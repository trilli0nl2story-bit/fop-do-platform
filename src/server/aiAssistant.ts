import { query } from './db';
import { getEffectiveSubscriptionStatus } from './subscriptions';

const DEFAULT_ASSISTANT_MODEL = 'gpt-5-mini';
const MONTHLY_LIMIT = 15;

type SubscriptionRow = {
  status: string;
  current_period_end: string | null;
};

type AiUsageRow = {
  used_count: string;
};

type CreatedAiRequestRow = {
  id: string;
};

export interface AssistantUsageSummary {
  available: boolean;
  reason: 'active' | 'no_subscription' | 'not_configured';
  monthlyLimit: number;
  usedThisMonth: number;
  remainingThisMonth: number;
  subscriptionActive: boolean;
  configured: boolean;
}

export interface AssistantReplyResult {
  requestId: string;
  answer: string;
  model: string;
  tokensUsed: number | null;
  usage: AssistantUsageSummary;
}

function getAssistantModel(): string {
  return (
    process.env.OPENAI_ASSISTANT_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    DEFAULT_ASSISTANT_MODEL
  );
}

export function isAssistantConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

async function getLatestSubscription(userId: string): Promise<SubscriptionRow | null> {
  const result = await query<SubscriptionRow>(
    `
      SELECT status, current_period_end
      FROM subscriptions
      WHERE user_id = $1
      ORDER BY
        CASE WHEN status = 'active' AND current_period_end > now() THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

async function getUsedCountThisMonth(userId: string): Promise<number> {
  const result = await query<AiUsageRow>(
    `
      SELECT COUNT(*)::text AS used_count
      FROM ai_requests
      WHERE user_id = $1
        AND status = 'completed'
        AND created_at >= date_trunc('month', now())
    `,
    [userId]
  );

  return Number(result.rows[0]?.used_count ?? '0');
}

export async function getAssistantUsageSummary(
  userId: string
): Promise<AssistantUsageSummary> {
  const [subscription, usedThisMonth] = await Promise.all([
    getLatestSubscription(userId),
    getUsedCountThisMonth(userId),
  ]);

  const subscriptionActive = subscription
    ? getEffectiveSubscriptionStatus(subscription.status, subscription.current_period_end) === 'active'
    : false;
  const configured = isAssistantConfigured();
  const remainingThisMonth = Math.max(0, MONTHLY_LIMIT - usedThisMonth);

  let reason: AssistantUsageSummary['reason'] = 'active';
  if (!subscriptionActive) {
    reason = 'no_subscription';
  } else if (!configured) {
    reason = 'not_configured';
  }

  return {
    available: subscriptionActive && configured && remainingThisMonth > 0,
    reason,
    monthlyLimit: MONTHLY_LIMIT,
    usedThisMonth,
    remainingThisMonth,
    subscriptionActive,
    configured,
  };
}

function buildSystemPrompt(): string {
  return [
    'Ты методический AI-помощник для педагогов дошкольного образования в России.',
    'Отвечай на русском языке, спокойно, понятно и практично.',
    'Ориентируйся на реальные рабочие задачи воспитателя, методиста и молодого специалиста.',
    'Если уместно, предлагай ответ в виде коротких шагов, списка действий, структуры документа или готового черновика.',
    'Не придумывай ссылки на законы и документы, если не уверен.',
    'Если вопрос требует официальной юридической или медицинской консультации, прямо скажи об ограничении и дай осторожную практическую рекомендацию.',
    'Избегай воды, пиши содержательно и доброжелательно.',
  ].join(' ');
}

function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const record = payload as Record<string, unknown>;

  if (typeof record.output_text === 'string') {
    return record.output_text.trim();
  }

  const output = Array.isArray(record.output) ? record.output : [];
  const parts: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const itemRecord = item as Record<string, unknown>;
    const content = Array.isArray(itemRecord.content) ? itemRecord.content : [];

    for (const chunk of content) {
      if (!chunk || typeof chunk !== 'object') continue;
      const chunkRecord = chunk as Record<string, unknown>;
      if (typeof chunkRecord.text === 'string') {
        parts.push(chunkRecord.text);
      } else if (
        chunkRecord.type === 'output_text' &&
        typeof chunkRecord.text === 'string'
      ) {
        parts.push(chunkRecord.text);
      }
    }
  }

  return parts.join('\n').trim();
}

function extractTokenUsage(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null;
  const usage = (payload as Record<string, unknown>).usage;
  if (!usage || typeof usage !== 'object') return null;

  const totalTokens = (usage as Record<string, unknown>).total_tokens;
  return typeof totalTokens === 'number' && Number.isFinite(totalTokens)
    ? totalTokens
    : null;
}

async function createPendingAiRequest(params: {
  userId: string;
  prompt: string;
  model: string;
}): Promise<string> {
  const result = await query<CreatedAiRequestRow>(
    `
      INSERT INTO ai_requests (user_id, prompt, model, status, created_at)
      VALUES ($1, $2, $3, 'pending', now())
      RETURNING id
    `,
    [params.userId, params.prompt, params.model]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Не удалось создать AI-запрос.');
  }

  return row.id;
}

async function completeAiRequest(params: {
  requestId: string;
  answer: string;
  tokensUsed: number | null;
}): Promise<void> {
  await query(
    `
      UPDATE ai_requests
      SET response = $2,
          status = 'completed',
          tokens_used = $3,
          error = null,
          completed_at = now()
      WHERE id = $1
    `,
    [params.requestId, params.answer, params.tokensUsed]
  );
}

async function failAiRequest(params: {
  requestId: string;
  error: string;
}): Promise<void> {
  await query(
    `
      UPDATE ai_requests
      SET status = 'failed',
          error = $2,
          completed_at = now()
      WHERE id = $1
    `,
    [params.requestId, params.error.slice(0, 500)]
  );
}

export async function createAssistantReply(params: {
  userId: string;
  prompt: string;
}): Promise<AssistantReplyResult> {
  const usage = await getAssistantUsageSummary(params.userId);

  if (!usage.subscriptionActive) {
    throw new Error('AI-помощник доступен только при активной подписке.');
  }

  if (!usage.configured) {
    throw new Error('AI-помощник ещё не настроен на сервере. Добавьте OPENAI_API_KEY и опубликуйте сайт.');
  }

  if (usage.remainingThisMonth <= 0) {
    throw new Error('Лимит AI-запросов на этот месяц уже исчерпан.');
  }

  const model = getAssistantModel();
  const requestId = await createPendingAiRequest({
    userId: params.userId,
    prompt: params.prompt,
    model,
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        input: params.prompt,
        instructions: buildSystemPrompt(),
        max_output_tokens: 900,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiMessage =
        (payload as Record<string, unknown>)?.error &&
        typeof (payload as Record<string, unknown>).error === 'object'
          ? String(((payload as Record<string, unknown>).error as Record<string, unknown>).message ?? '')
          : '';
      throw new Error(apiMessage || `OpenAI API returned ${response.status}`);
    }

    const answer = extractOutputText(payload);
    if (!answer) {
      throw new Error('AI не вернул текст ответа.');
    }

    const tokensUsed = extractTokenUsage(payload);
    await completeAiRequest({ requestId, answer, tokensUsed });

    const nextUsage = await getAssistantUsageSummary(params.userId);

    return {
      requestId,
      answer,
      model,
      tokensUsed,
      usage: nextUsage,
    };
  } catch (error) {
    await failAiRequest({
      requestId,
      error: error instanceof Error ? error.message : 'Unknown AI error',
    });
    throw error;
  }
}
