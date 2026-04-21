import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';
import { createAssistantReply } from '@/src/server/aiAssistant';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const originError = requireTrustedOrigin(request);
    if (originError) {
      return originError;
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Войдите в аккаунт, чтобы использовать AI-помощника.' },
        { status: 401 }
      );
    }

    const rateLimit = await consumeRequestRateLimit(request, {
      scope: 'assistant:respond',
      limit: 8,
      windowSeconds: 10 * 60,
      keyParts: [user.id],
    });

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    const body = (await request.json().catch(() => null)) as { message?: unknown } | null;
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (message.length < 10) {
      return NextResponse.json(
        { error: 'validation_error', message: 'Опишите вопрос чуть подробнее, минимум 10 символов.' },
        { status: 400 }
      );
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: 'validation_error', message: 'Слишком длинный запрос. Сократите текст до 4000 символов.' },
        { status: 400 }
      );
    }

    const result = await createAssistantReply({
      userId: user.id,
      prompt: message,
    });

    return NextResponse.json({
      ok: true,
      answer: result.answer,
      model: result.model,
      tokensUsed: result.tokensUsed,
      usage: result.usage,
      requestId: result.requestId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось выполнить AI-запрос.';
    const status =
      message.includes('подписке') ? 403 :
      message.includes('исчерпан') ? 403 :
      message.includes('настроен') ? 503 :
      500;

    console.error('[api/assistant/respond]', message);
    return NextResponse.json(
      {
        error: 'assistant_error',
        message,
      },
      { status }
    );
  }
}
