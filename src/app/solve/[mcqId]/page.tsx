"use client";

import { useEffect, useState, use, Suspense } from "react";
import { Storage, MCQSet, Question } from "@/lib/storage";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb, ChevronRight, ChevronLeft, Plus, Loader2, PlayCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

function SolveMCQContent({ mcqId }: { mcqId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q");

  const [mcqSet, setMcqSet] = useState<MCQSet | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [showNotes, setShowNotes] = useState<Record<number, boolean>>({});
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  
  const initialized = useRef(false);

  useEffect(() => {
    const set = Storage.getMCQSet(mcqId);
    if (!set) {
      router.push("/");
      return;
    }
    setMcqSet(set);
    
    if (set.progress && !initialized.current) {
      setSelectedOptions(set.progress.selectedOptions);
      setShowNotes(set.progress.showNotes);
      if (qParam && !isNaN(Number(qParam))) {
        setCurrentIndex(Number(qParam));
      } else {
        setCurrentIndex(set.progress.currentIndex);
      }
      initialized.current = true;
    } else if (qParam && !isNaN(Number(qParam)) && !initialized.current) {
      setCurrentIndex(Number(qParam));
      initialized.current = true;
    }
  }, [mcqId, router, qParam]);

  useEffect(() => {
    if (!mcqSet || !initialized.current) return;
    const currentSet = Storage.getMCQSet(mcqSet.id);
    if (currentSet) {
      Storage.saveMCQSet({
        ...currentSet,
        progress: { currentIndex, selectedOptions, showNotes }
      });
    }
  }, [currentIndex, selectedOptions, showNotes, mcqSet?.id]);

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

  const handleAddMore = async () => {
    setIsGeneratingMore(true);
    try {
      const existingQuestions = mcqSet.questions.map(q => q.text);
      const response = await fetch("/api/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic: mcqSet.topic, 
          count: 5, 
          level: mcqSet.level,
          existingQuestions 
        }),
      });

      if (!response.ok) throw new Error("Failed to generate more MCQs");
      
      const data = await response.json();
      const newQuestions: Question[] = data.questions.map((q: any) => ({
        id: uuidv4(),
        text: q.text,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        solution: q.solution,
        notes: q.notes,
      }));

      const updatedSet = {
        ...mcqSet,
        count: mcqSet.count + newQuestions.length,
        questions: [...mcqSet.questions, ...newQuestions]
      };
      
      Storage.saveMCQSet(updatedSet);
      setMcqSet(updatedSet);
      setCurrentIndex(mcqSet.count);
    } catch (err) {
      console.error(err);
      alert("Failed to add more questions.");
    } finally {
      setIsGeneratingMore(false);
    }
  };

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans overflow-hidden w-full">
      
      {/* Real Left Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-[#faf9f8] border-r border-gray-200 flex flex-col h-full hidden md:flex">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <Link href={`/project/${mcqSet.projectId}/set/${mcqSet.id}`} className="text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="truncate">
            <h2 className="text-sm font-semibold text-gray-800 truncate">{mcqSet.title}</h2>
            <p className="text-xs text-gray-500">Question List</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-5 gap-2">
            {mcqSet.questions.map((q, idx) => {
              const answered = selectedOptions[idx] !== undefined;
              const correct = selectedOptions[idx] === q.correctOptionIndex;
              
              let btnClass = "bg-white border-gray-200 text-gray-600 hover:bg-gray-100";
              if (answered) {
                btnClass = correct 
                  ? "bg-[#dff6dd] border-[#107c10] text-[#107c10]" 
                  : "bg-[#fde7e9] border-[#d13438] text-[#d13438]";
              }
              
              const isActive = currentIndex === idx;
              if (isActive) {
                btnClass += " ring-2 ring-[#0067b8] ring-offset-1";
              }
              
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-full aspect-square rounded-sm border flex items-center justify-center text-xs font-semibold transition-all ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-[#faf9f8]">
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-[#0067b8] h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / mcqSet.count) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">{currentIndex + 1} of {mcqSet.count} Completed</p>
        </div>
      </aside>

      {/* Main Solve Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-white">
        
        {/* Mobile Header */}
        <header className="md:hidden border-b border-gray-200 p-4 flex items-center gap-3 bg-[#faf9f8]">
           <Link href={`/project/${mcqSet.projectId}/set/${mcqSet.id}`} className="text-gray-500 hover:text-gray-800">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-sm font-semibold truncate flex-1">{mcqSet.title}</h1>
          <span className="text-xs font-semibold text-gray-500">{currentIndex + 1} / {mcqSet.count}</span>
        </header>

        <div className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full">
          <div className="mb-6">
            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-sm mb-4">Question {currentIndex + 1}</span>
            <h2 className="text-xl md:text-2xl font-medium text-gray-900 leading-relaxed">
              {question.text}
            </h2>
          </div>

          <div className="space-y-3">
            {question.options.map((option, idx) => {
              let btnClass = "bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-800";
              let Icon = null;

              if (hasAnswered) {
                if (idx === question.correctOptionIndex) {
                  btnClass = "bg-[#dff6dd] border-[#107c10] text-[#107c10]";
                  Icon = <CheckCircle2 size={18} className="text-[#107c10]" />;
                } else if (idx === selectedOptions[currentIndex]) {
                  btnClass = "bg-[#fde7e9] border-[#d13438] text-[#d13438]";
                  Icon = <XCircle size={18} className="text-[#d13438]" />;
                } else {
                  btnClass = "bg-white border-gray-200 text-gray-400 opacity-60";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={hasAnswered}
                  className={`w-full text-left px-5 py-4 rounded-sm border flex items-center justify-between transition-all text-sm font-medium shadow-sm ${btnClass}`}
                >
                  <span>{option}</span>
                  {Icon}
                </button>
              );
            })}
          </div>

          {hasAnswered && (
            <div className="mt-8 pt-6 border-t border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-4">
                <div className={`font-semibold flex items-center gap-2 text-sm ${isCorrect ? 'text-[#107c10]' : 'text-[#d13438]'}`}>
                  {isCorrect ? (
                    <><CheckCircle2 size={18} /> Correct</>
                  ) : (
                    <><XCircle size={18} /> Incorrect</>
                  )}
                </div>
                <button
                  onClick={toggleNotes}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#0067b8] hover:underline transition-colors"
                >
                  <Lightbulb size={14} /> {showNotes[currentIndex] ? "Hide Solution" : "Show Solution"}
                </button>
              </div>

              {showNotes[currentIndex] && (
                <div className="bg-[#f3f2f1] p-5 rounded-sm border border-gray-200 space-y-2">
                  <p className="font-semibold text-gray-800 text-sm">Answer: {question.solution}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{question.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-12 flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            
            {currentIndex === mcqSet.count - 1 && hasAnswered ? (
              <div className="flex gap-3">
                <Link
                  href={`/project/${mcqSet.projectId}/set/${mcqSet.id}`}
                  className="flex items-center gap-1 px-4 py-2 rounded-sm bg-[#107c10] hover:bg-[#0b5a0b] text-white transition-all text-sm font-medium shadow-sm"
                >
                  <CheckCircle2 size={16} /> Finish
                </Link>
                <button
                  onClick={handleAddMore}
                  disabled={isGeneratingMore}
                  className="flex items-center gap-1 px-4 py-2 rounded-sm bg-[#0067b8] hover:bg-[#005da6] text-white transition-all text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                >
                  {isGeneratingMore ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Add 5 More
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentIndex((p) => Math.min(mcqSet.count - 1, p + 1))}
                disabled={currentIndex === mcqSet.count - 1}
                className="flex items-center gap-1 px-4 py-2 rounded-sm bg-[#0067b8] hover:bg-[#005da6] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

import { useRef } from "react";
export default function SolveMCQPage({ params }: { params: Promise<{ mcqId: string }> }) {
  const { mcqId } = use(params);
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#faf9f8]"><Loader2 className="animate-spin text-[#0067b8]" /></div>}>
      <SolveMCQContent mcqId={mcqId} />
    </Suspense>
  );
}
