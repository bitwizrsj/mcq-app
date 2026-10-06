"use client";

import { useEffect, useState, use } from "react";
import { Storage, MCQSet } from "@/lib/storage";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb, ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SolveMCQPage({ params }: { params: Promise<{ mcqId: string }> }) {
  const router = useRouter();
  const { mcqId } = use(params);
  const [mcqSet, setMcqSet] = useState<MCQSet | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [showNotes, setShowNotes] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const set = Storage.getMCQSet(mcqId);
    if (!set) {
      router.push("/");
      return;
    }
    setMcqSet(set);
  }, [mcqId, router]);

  if (!mcqSet || mcqSet.questions.length === 0) return null;

  const question = mcqSet.questions[currentIndex];
  const hasAnswered = selectedOptions[currentIndex] !== undefined;
  const isCorrect = selectedOptions[currentIndex] === question.correctOptionIndex;

  const handleOptionSelect = (index: number) => {
    if (hasAnswered) return;
    setSelectedOptions((prev) => ({ ...prev, [currentIndex]: index }));
  };

  const toggleNotes = () => {
    setShowNotes((prev) => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <Link href={`/project/${mcqSet.projectId}`} className="inline-flex items-center text-neutral-400 hover:text-white transition-colors mb-6 text-sm">
            <ArrowLeft size={16} className="mr-2" /> Back to Project
          </Link>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold">{mcqSet.title}</h1>
              <p className="text-neutral-400 mt-2 capitalize">{mcqSet.topic} • {mcqSet.level}</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-semibold">{currentIndex + 1}</span>
              <span className="text-neutral-500"> / {mcqSet.count}</span>
            </div>
          </div>
          
          <div className="w-full bg-neutral-900 rounded-full h-2 mt-6">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / mcqSet.count) * 100}%` }}
            ></div>
          </div>
        </header>

        <section className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl">
          <h2 className="text-xl font-medium mb-8 leading-relaxed">
            {question.text}
          </h2>

          <div className="space-y-4">
            {question.options.map((option, idx) => {
              let btnClass = "bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800";
              let Icon = null;

              if (hasAnswered) {
                if (idx === question.correctOptionIndex) {
                  btnClass = "bg-green-500/10 border-green-500 text-green-400";
                  Icon = <CheckCircle2 size={20} className="text-green-500" />;
                } else if (idx === selectedOptions[currentIndex]) {
                  btnClass = "bg-red-500/10 border-red-500 text-red-400";
                  Icon = <XCircle size={20} className="text-red-500" />;
                } else {
                  btnClass = "bg-neutral-950 border-neutral-800 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={hasAnswered}
                  className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${btnClass}`}
                >
                  <span>{option}</span>
                  {Icon}
                </button>
              );
            })}
          </div>

          {hasAnswered && (
            <div className="mt-8 pt-6 border-t border-neutral-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-4">
                <div className={`font-medium flex items-center gap-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {isCorrect ? (
                    <><CheckCircle2 size={20} /> Correct!</>
                  ) : (
                    <><XCircle size={20} /> Incorrect</>
                  )}
                </div>
                <button
                  onClick={toggleNotes}
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Lightbulb size={16} /> {showNotes[currentIndex] ? "Hide Solution" : "Show Solution"}
                </button>
              </div>

              {showNotes[currentIndex] && (
                <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 space-y-4">
                  <p className="font-medium text-blue-400">Answer: {question.solution}</p>
                  <p className="text-neutral-300 text-sm leading-relaxed">{question.notes}</p>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={20} /> Previous
          </button>
          <button
            onClick={() => setCurrentIndex((p) => Math.min(mcqSet.count - 1, p + 1))}
            disabled={currentIndex === mcqSet.count - 1}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
