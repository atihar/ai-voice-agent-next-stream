// app/api/chatgpt/stream/route.js
import OpenAI from 'openai';

export async function POST(req) {
  try {
    // Expecting sessionId and input in the request body.
    const { sessionId, input } = await req.json();

    console.log(`Session: ${sessionId}`);
    console.log(`Input: ${input}`);

    // Initialize OpenAI client. Make sure your OPENAI_API_KEY is set in your environment.
    const client = new OpenAI();

    // Initiate the streaming request using the combined input.
    const stream = await client.responses.create({
      model: 'gpt-4o-mini', // Change this to your desired model.
      input: input,
      stream: true,
    });

    // Create a ReadableStream to transform the response into SSE format.
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response('Error streaming response', { status: 500 });
  }
}
