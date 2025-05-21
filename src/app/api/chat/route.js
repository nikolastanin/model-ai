'use client';

import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { messages } = req.body;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // or gpt-3.5-turbo
        messages,
    });

    const reply = completion.choices[0].message.content;
    res.status(200).json({ reply });
}
