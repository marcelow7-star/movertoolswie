export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  const { prompt, maxTokens } = req.body || {};

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Campo 'prompt' é obrigatório" });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada no servidor" });
    return;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: Math.min(Number(maxTokens) || 300, 1500),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({ error: data.error?.message || "Erro na API da Anthropic" });
      return;
    }

    const textBlock = Array.isArray(data.content) ? data.content.find((b) => b.type === "text") : null;
    res.status(200).json({ text: textBlock ? textBlock.text.trim() : "" });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
