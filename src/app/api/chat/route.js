import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
    try {
        const body = await req.json();
        const { messages } = body;

        console.log("Received messages:", messages);

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: "Invalid request format" }), { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages,
        });

        console.log("OpenAI reply:", completion.choices[0].message.content);

        return Response.json({
            reply: completion.choices[0].message.content,
        });
    } catch (error) {
        console.error("❌ Backend Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
        });
    }
}
