"use client";

import { useState, use } from "react";
import { Storage, MCQSet, Question } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function CreateMCQPage({ params }: { params: Promise<{ projectId: string }> }) {
  const router = useRouter();
  const { projectId } = use(params);
  
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(20);
  const [level, setLevel] = useState("easy");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !topic) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count, level }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate MCQs. Check your Grok API key or try again.");
      }

      const data = await response.json();
      const questions: Question[] = data.questions.map((q: any) => ({
        id: uuidv4(),
        text: q.text,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        solution: q.solution,
        notes: q.notes,
      }));

      const newSet: MCQSet = {
        id: uuidv4(),
        projectId,
        title,
        topic,
        level,
        count: questions.length,
        questions,
        createdAt: Date.now(),
      };

      Storage.saveMCQSet(newSet);
      router.push(`/project/${projectId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <Link href={`/project/${projectId}`} className="inline-flex items-center text-neutral-400 hover:text-white transition-colors mb-6 text-sm">
            <ArrowLeft size={16} className="mr-2" /> Back to Project
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Generate MCQ Set</h1>
            <p className="text-neutral-400 mt-2">Powered by Gemini AI</p>
          </div>
        </header>

        <form onSubmit={handleGenerate} className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Set Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 1 Quiz"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Topic or Prompt</label>
            <textarea
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe what the questions should be about..."
              rows={4}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Number of Questions</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              >
                <option value={20}>20 Questions</option>
                <option value={30}>30 Questions</option>
                <option value={50}>50 Questions</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Difficulty Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="easy-to-hard">Easy to Hard</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Generating with AI...
              </>
            ) : (
              <>
                <Sparkles size={20} /> Generate MCQs
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
