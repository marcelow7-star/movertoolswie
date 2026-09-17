export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  const { assunto, corpo } = req.body || {};

  if (!assunto || !corpo) {
    res.status(400).json({ error: "Campos 'assunto' e 'corpo' são obrigatórios" });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    res.status(500).json({ error: "RESEND_API_KEY não configurada no servidor" });
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Sucessão em Movimento <onboarding@resend.dev>",
        to: ["marcelow7@gmail.com"],
        subject: assunto,
        text: corpo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({ error: data.message || "Erro ao enviar e-mail" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
