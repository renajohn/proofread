const LLM_BASE_URL = process.env.LLM_BASE_URL || "http://p-cloud.local:8002";
const LLM_TIMEOUT_MS = 120_000;

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  model: string;
};

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number }
): Promise<{ content: string; model: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const res = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        temperature: options?.temperature ?? 0.3,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`LLM returned ${res.status}: ${body}`);
    }

    const data: ChatCompletionResponse = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return { content, model: data.model ?? "unknown" };
  } finally {
    clearTimeout(timeout);
  }
}
