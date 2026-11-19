export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        if (!env.GEMINI_API_KEY) {
          return Response.json(
            { error: "Gemini API key is missing." },
            { status: 500 }
          );
        }

        const data = await request.json();

        if (!Array.isArray(data.messages) || !data.messages.length) {
          return Response.json(
            { error: "Please send a message." },
            { status: 400 }
          );
        }

        const conversation = data.messages.slice(-20).map(m => {
          const role = m.role === "assistant" ? "QAOO AI" : "User";
          return role + ": " + String(m.content).slice(0, 5000);
        }).join("\n\n");

        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/interactions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": env.GEMINI_API_KEY
            },
            body: JSON.stringify({
              model: "gemini-3.8-flash",
              input:
                "You are QAOO AI, an intelligent and friendly AI assistant. " +
                "Support Arabic, English, and Amharic. " +
                "Answer accurately and clearly. " +
                "The conversation history follows:\n\n" +
                conversation +
                "\n\nQAOO AI:"
            })
          }
        );

        const result = await response.json();

        if (!response.ok) {
          return Response.json(
            {
              error: result.error?.message || "Gemini API request failed."
            },
            { status: response.status }
          );
        }

        const reply =
          result.steps
            ?.filter(step => step.type === "model_output")
            .flatMap(step => step.content || [])
            .filter(item => item.type === "text")
            .map(item => item.text)
            .join("\n") || "";

        if (!reply) {
          return Response.json(
            { error: "Gemini returned an empty response." },
            { status: 502 }
          );
        }

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
