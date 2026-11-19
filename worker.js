export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // AI Chat API
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const data = await request.json();

        if (!Array.isArray(data.messages) || data.messages.length === 0) {
          return Response.json(
            { error: "Please send a message." },
            { status: 400 }
          );
        }

        const messages = [
          {
            role: "system",
            content: `You are QAOO AI, an intelligent and helpful AI assistant.
            Answer clearly and accurately.
            Support Arabic, English, and Amharic.
            Follow the language used by the user.
            Help with science, education, coding, technology,
            mathematics, creativity, and general questions.`
          },
          ...data.messages.slice(-20).map(message => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: String(message.content).slice(0, 5000)
          }))
        ];

        const result = await env.AI.run(
          "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
          {
            messages,
            max_tokens: 1024
          }
        );

        return Response.json({
          success: true,
          reply: result.response
        });

      } catch (error) {
        return Response.json(
          {
            success: false,
            error: "QAOO AI encountered an error. Please try again."
          },
          { status: 500 }
        );
      }
    }

    // Website files
    return env.ASSETS.fetch(request);
  }
};
