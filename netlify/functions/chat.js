
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  const send = (statusCode, body) => ({
    statusCode,
    headers,
    body: JSON.stringify(body)
  });

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return send(405, { error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return send(500, { error: "OpenAI API key is missing." });
    }

    const data = JSON.parse(event.body || "{}");

    if (!Array.isArray(data.messages) || !data.messages.length) {
      return send(400, { error: "Please send a message." });
    }

    const messages = data.messages
      .slice(-20)
      .filter(m => ["user", "assistant"].includes(m.role))
      .map(m => ({
        role: m.role,
        content: String(m.content || "").slice(0, 5000)
      }));

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-5.5",
          instructions:
            "You are QAOO AI, a helpful and intelligent assistant. " +
            "Support Arabic, English and Amharic. " +
            "Give accurate, clear and useful answers.",
          input: messages
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return send(response.status, {
        error: result.error?.message || "OpenAI request failed."
      });
    }

    const reply = (result.output || [])
      .filter(item => item.type === "message")
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    if (!reply) {
      return send(502, { error: "Empty AI response." });
    }

    return send(200, { success: true, reply });

  } catch (error) {
    return send(500, {
      error: "Server error: " + error.message
    });
  }
};
