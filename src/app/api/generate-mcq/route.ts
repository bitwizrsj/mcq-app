import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/** Escape raw control characters inside JSON string literals so JSON.parse succeeds. */
function sanitizeJsonContent(raw: string): string {
  let content = raw.trim();

  // Strip markdown fences if the model still wraps the payload
  if (content.startsWith("```json")) content = content.slice(7);
  else if (content.startsWith("```")) content = content.slice(3);
  if (content.endsWith("```")) content = content.slice(0, -3);
  content = content.trim();

  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const code = ch.charCodeAt(0);

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\" && inString) {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    // Raw control chars are illegal in JSON strings; escape or drop them
    if (code >= 0 && code <= 0x1f) {
      if (inString) {
        if (ch === "\n") result += "\\n";
        else if (ch === "\r") result += "\\r";
        else if (ch === "\t") result += "\\t";
        else result += " ";
      } else {
        // Outside strings, whitespace is fine as a single space
        result += " ";
      }
      continue;
    }

    result += ch;
  }

  return result;
}

export async function POST(req: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in the environment." },
        { status: 500 }
      );
    }

    const { topic, count, level, existingQuestions = [] } = await req.json();

    const avoidPrompt =
      existingQuestions.length > 0
        ? `\n\nCRITICAL: Do NOT generate any questions that are similar to these existing ones:\n${existingQuestions.map((q: string) => "- " + q).join("\n")}`
        : "";

    const systemPrompt = `You are an expert educational content creator. Your task is to generate Multiple Choice Questions (MCQs) based on the user's prompt.
You must return a JSON array of objects only.
Each object must have this structure:
{
  "text": "The question text",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctOptionIndex": 0,
  "solution": "A brief sentence stating the correct answer clearly.",
  "notes": "Detailed notes or explanation on why this is correct and others are wrong."
}
Generate exactly ${count} questions. Difficulty level: ${level}.
Topic: ${topic}${avoidPrompt}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const fetchWithRetry = async (
      fetchUrl: string,
      options: RequestInit,
      retries = 3
    ): Promise<Response> => {
      try {
        const res = await fetch(fetchUrl, options);
        if (!res.ok && res.status >= 500 && retries > 0) {
          console.log(`Retrying API call... (${retries} left)`);
          await new Promise((r) => setTimeout(r, 1000 * (4 - retries)));
          return await fetchWithRetry(fetchUrl, options, retries - 1);
        }
        return res;
      } catch (error: unknown) {
        if (retries > 0) {
          const msg = error instanceof Error ? error.message : String(error);
          console.log(`Network error (${msg}), retrying... (${retries} left)`);
          await new Promise((r) => setTimeout(r, 1000 * (4 - retries)));
          return await fetchWithRetry(fetchUrl, options, retries - 1);
        }
        throw error;
      }
    };

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            parts: [
              {
                text: `Generate exactly ${count} MCQs on the following topic: "${topic}". Difficulty level: ${level}.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                text: { type: "STRING" },
                options: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
                correctOptionIndex: { type: "INTEGER" },
                solution: { type: "STRING" },
                notes: { type: "STRING" },
              },
              required: [
                "text",
                "options",
                "correctOptionIndex",
                "solution",
                "notes",
              ],
            },
          },
          temperature: 0.7,
        },
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
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText || typeof rawText !== "string") {
      console.error("Unexpected Gemini response shape:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json(
        { error: "Gemini returned an empty or invalid response." },
        { status: 502 }
      );
    }

    const content = sanitizeJsonContent(rawText);
    const questions = JSON.parse(content);

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Gemini did not return a question array." },
        { status: 502 }
      );
    }

    return NextResponse.json({ questions });
  } catch (error: unknown) {
    console.error("Generate API Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while generating." },
      { status: 500 }
    );
  }
}
