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
        throw new Error("Failed to generate MCQs. Check your Gemini API key or try again.");
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
    <div className="min-h-screen bg-[#faf9f8] text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href={`/project/${projectId}`} className="text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold text-gray-800">Generate MCQ Set</h1>
      </header>

      <div className="w-full px-6 py-8">
        <form onSubmit={handleGenerate} className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm max-w-2xl">
          <div className="mb-6 border-b border-gray-200 pb-4">
            <h2 className="text-base font-semibold text-gray-800">Configuration</h2>
            <p className="text-xs text-gray-500 mt-1">Powered by Gemini AI</p>
          </div>

          {error && (
            <div className="bg-[#fde7e9] border border-[#d13438] text-[#d13438] p-3 rounded-sm text-sm mb-6 flex items-center">
              {error}
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Set Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Chapter 1 Quiz"
                className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Topic or Prompt</label>
              <textarea
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Describe what the questions should be about..."
                rows={4}
                className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Questions</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] transition-colors appearance-none"
                >
                  <option value={20}>20 Questions</option>
                  <option value={30}>30 Questions</option>
                  <option value={50}>50 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Difficulty Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] transition-colors appearance-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="easy-to-hard">Easy to Hard</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isGenerating}
              className="bg-[#0067b8] hover:bg-[#005da6] text-white px-5 py-2.5 rounded-sm text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Generate MCQs
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
