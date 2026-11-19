export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const data = await request.json();

        if (!Array.isArray(data.messages) || data.messages.length === 0) {
          return Response.json(
            { error: "Please send a message" },
            { status: 400 }
          );
        }

        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
          encodeURIComponent(env.GEMINI_API_KEY),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{
                  text: "You are QAOO AI, a helpful intelligent assistant. Support Arabic, English and Amharic. Answer clearly and accurately."
                }]
              },
              contents: data.messages.slice(-20).map(m => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: String(m.content).slice(0, 5000) }]
              })),
              generationConfig: {
                maxOutputTokens: 1024
              }
            })
          }
        );

        const result = await response.json();

        if (!response.ok) {
          return Response.json(
            { error: result.error?.message || "Gemini API error" },
            { status: 502 }
          );
        }

        const reply =
          result.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") ||
          "No response received.";

        return Response.json({
          success: true,
          reply
        });

      } catch (error) {
        return Response.json(
          { error: "Server error: " + error.message },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
