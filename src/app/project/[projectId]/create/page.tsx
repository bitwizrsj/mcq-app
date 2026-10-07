"use client";

import { useState, use } from "react";
import { DB } from "@/lib/db";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function CreateMCQPage({ params }: { params: Promise<{ projectId: string }> }) {
  const router = useRouter();
  const { projectId } = use(params);
  
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(10);
  const [level, setLevel] = useState("Medium");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }
    
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count, level })
      });

      if (!response.ok) {
        throw new Error("Failed to generate questions. Please try again.");
      }

      const data = await response.json();
      
      const shortTopic = topic.length > 50 ? topic.substring(0, 50) + '...' : topic;
      const newSet = await DB.createMCQSet({
        project_id: projectId,
        title: `${shortTopic} (${level})`,
        topic: shortTopic,
        level,
        count: data.questions.length
      });

      if (!newSet) throw new Error("Failed to save MCQ Set to database.");

      const questionsToSave = data.questions.map((q: any) => ({
        set_id: newSet.id,
        text: q.text,
        options: q.options,
        correct_option_index: q.correctOptionIndex,
        solution: q.solution,
        notes: q.notes
      }));

      const success = await DB.createQuestions(questionsToSave);
      if (!success) throw new Error("Failed to save questions to database.");

      router.push(`/project/${projectId}`);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-gray-900 font-sans text-[13px]">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href={`/project/${projectId}`} className="p-1 hover:bg-gray-100 rounded-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>
          <h1 className="text-[15px] font-bold text-gray-800 flex items-center gap-1.5">
            <Sparkles className="text-blue-600" size={16} /> Generate Questions
          </h1>
        </div>
      </header>

      <div className="w-full max-w-xl mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 p-6 rounded-md shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -z-0"></div>
          
          <h2 className="text-lg font-bold mb-1 text-gray-900 relative z-10">AI Generator</h2>
          <p className="text-[13px] text-gray-500 mb-6 relative z-10">Define your topic and let our AI craft the perfect multiple-choice questions.</p>

          <div className="space-y-5 relative z-10">
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Topic / Prompt</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Python Generators and Iterators..."
                className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[100px] resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Count</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={20}>20 Questions</option>
                  <option value={30}>30 Questions</option>
                  <option value={50}>50 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Difficulty</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Easy-To-Hard">Easy to Hard</option>
                </select>
              </div>
            </div>

            {error && <p className="text-red-600 text-[12px] font-bold p-2 bg-red-50 rounded-sm border border-red-100">{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-sm text-[13px] font-bold flex justify-center items-center gap-2 transition-all shadow-sm disabled:opacity-70 mt-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Questions
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
