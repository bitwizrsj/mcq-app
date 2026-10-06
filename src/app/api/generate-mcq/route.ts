import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in the environment." },
        { status: 500 }
      );
    }

    const { topic, count, level } = await req.json();

    const systemPrompt = `You are an expert educational content creator. Your task is to generate Multiple Choice Questions (MCQs) based on the user's prompt. 
You must return the output STRICTLY as a JSON array of objects. Do not include markdown formatting like \`\`\`json or any other text.
Each object in the array must have the following structure:
{
  "text": "The question text",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctOptionIndex": 0,
  "solution": "A brief sentence stating the correct answer clearly.",
  "notes": "Detailed notes or explanation on why this is correct and others are wrong."
}
Make sure you generate exactly ${count} questions. The difficulty level should be: ${level}.
Topic: ${topic}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          { parts: [{ text: `Generate exactly ${count} MCQs on the following topic: "${topic}". Difficulty level: ${level}.` }] }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate MCQs from Gemini." },
        { status: response.status }
      );
    }

    const data = await response.json();
    let content = data.candidates[0].content.parts[0].text.trim();
    
    // Strip markdown formatting if AI still includes it
    if (content.startsWith("\`\`\`json")) {
      content = content.substring(7);
    }
    if (content.startsWith("\`\`\`")) {
      content = content.substring(3);
    }
    if (content.endsWith("\`\`\`")) {
      content = content.substring(0, content.length - 3);
    }

    const questions = JSON.parse(content);

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("Generate API Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while generating." },
      { status: 500 }
    );
  }
}
