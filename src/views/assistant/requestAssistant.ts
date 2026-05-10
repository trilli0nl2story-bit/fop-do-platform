export async function requestAssistantAnswer(message: string): Promise<string> {
  const response = await fetch('/api/assistant/respond', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      aiRulesAccepted: true,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data?.answer !== 'string') {
    throw new Error(data?.message || 'Не удалось получить ответ помощника. Попробуйте ещё раз.');
  }

  return data.answer;
}
