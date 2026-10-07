"use client";

import { useEffect, useState, use, useRef } from "react";
import { DB, MCQSet, Question, LeaderboardEntry } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, XCircle, FileText, Menu, X, Trophy } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SolveMCQPage({ params }: { params: Promise<{ mcqId: string }> }) {
  const { mcqId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mcqSet, setMcqSet] = useState<MCQSet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [showNotes, setShowNotes] = useState<Record<number, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [nickname, setNickname] = useState("");
  const [submittingScore, setSubmittingScore] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const set = await DB.getMCQSet(mcqId);
      if (!set) {
        router.push("/");
        return;
      }
      setMcqSet(set);
      
      const q = await DB.getQuestions(mcqId);
      setQuestions(q);

      try {
        const localData = localStorage.getItem(`progress_${mcqId}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          setSelectedOptions(parsed.selectedOptions || {});
          setShowNotes(parsed.showNotes || {});
          
          const startQ = searchParams.get("q");
          if (startQ !== null) {
            setCurrentIndex(parseInt(startQ, 10));
          } else if (parsed.currentIndex !== undefined) {
            setCurrentIndex(parsed.currentIndex);
          }
        }
      } catch (e) {}

      setLoading(false);
    };
    fetchData();
  }, [mcqId, router, searchParams]);

  useEffect(() => {
    if (!mcqSet || questions.length === 0) return;
    localStorage.setItem(`progress_${mcqId}`, JSON.stringify({
      currentIndex,
      selectedOptions,
      showNotes
    }));
  }, [currentIndex, selectedOptions, showNotes, mcqSet, mcqId, questions.length]);

  if (!mcqSet && loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!mcqSet || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const hasAnsweredCurrent = selectedOptions[currentIndex] !== undefined;
  const isCorrect = selectedOptions[currentIndex] === currentQuestion.correct_option_index;

  const handleOptionClick = (optionIndex: number) => {
    if (hasAnsweredCurrent) return;
    setSelectedOptions((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinish = async () => {
    const lb = await DB.getLeaderboard(mcqId);
    setLeaderboard(lb);
    setShowLeaderboard(true);
  };

  const handleSubmitScore = async () => {
    if (!nickname.trim()) return;
    setSubmittingScore(true);
    
    let score = 0;
    questions.forEach((q, i) => {
      if (selectedOptions[i] === q.correct_option_index) score++;
    });

    await DB.submitScore({
      set_id: mcqId,
      nickname: nickname.trim(),
      score,
      total_count: questions.length
    });

    const lb = await DB.getLeaderboard(mcqId);
    setLeaderboard(lb);
    setSubmittingScore(false);
  };

  if (showLeaderboard) {
    const score = Object.keys(selectedOptions).filter(i => selectedOptions[Number(i)] === questions[Number(i)].correct_option_index).length;
    
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-4">
        <div className="bg-white max-w-sm w-full rounded-md shadow-md overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center text-white relative">
            <Trophy size={40} className="mx-auto mb-3 text-yellow-300 drop-shadow-md" />
            <h2 className="text-xl font-bold mb-1">Set Completed!</h2>
            <p className="text-indigo-100 text-[13px] font-medium">You scored {score} out of {questions.length}</p>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Join Leaderboard</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your nickname..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-sm px-3 py-1.5 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button 
                  onClick={handleSubmitScore}
                  disabled={submittingScore || !nickname.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-sm text-[13px] font-bold disabled:opacity-50 transition-colors"
                >
                  {submittingScore ? "..." : "Submit"}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-[14px] font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                <Trophy size={14} className="text-yellow-500" /> Top Scores
              </h3>
              {leaderboard.length === 0 ? (
                <p className="text-[12px] text-gray-500 italic">No scores yet. Be the first!</p>
              ) : (
                <ul className="space-y-2">
                  {leaderboard.slice(0, 5).map((entry, idx) => (
                    <li key={entry.id || idx} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-sm border border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-[12px] w-5 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-400'}`}>#{idx + 1}</span>
                        <span className="font-bold text-[13px] text-gray-900">{entry.nickname}</span>
                      </div>
                      <span className="font-bold text-[13px] text-blue-600">{entry.score} <span className="text-[11px] text-gray-400">/ {entry.total_count}</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 text-center">
              <Link href={`/project/${mcqSet.project_id}`} className="text-blue-600 hover:underline text-[13px] font-bold">
                Return to Project
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#f8f9fc] font-sans text-[13px] overflow-hidden">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-2">
          <button 
            className="lg:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <Link href={`/project/${mcqSet.project_id}/set/${mcqId}`} className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-sm hover:bg-gray-100 hidden sm:block">
            <ArrowLeft size={16} />
          </Link>
          <div className="h-4 w-[1px] bg-gray-200 mx-1 hidden sm:block"></div>
          <h1 className="text-[14px] font-bold text-gray-900 truncate max-w-[200px] sm:max-w-md" title={mcqSet.title}>{mcqSet.title}</h1>
        </div>
        <div className="flex items-center gap-3 text-[12px] font-semibold">
          <div className="hidden sm:flex items-center gap-1.5 text-gray-500">
             <span className="text-green-600">{Object.keys(selectedOptions).length}</span> / {questions.length} Answered
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar Navigation */}
        <aside className={`absolute lg:static top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-10 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
          <div className="p-3 border-b border-gray-100 bg-gray-50 shrink-0">
            <h3 className="font-bold text-[12px] text-gray-700 uppercase tracking-wider mb-2">Overview</h3>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${(Object.keys(selectedOptions).length / questions.length) * 100}%` }}></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, i) => {
                const isSelected = selectedOptions[i] !== undefined;
                const isCorrectLocally = selectedOptions[i] === q.correct_option_index;
                
                let btnClass = "w-full aspect-square rounded-sm text-[13px] font-bold transition-all flex items-center justify-center border ";
                
                if (currentIndex === i) {
                  btnClass += "border-blue-600 bg-blue-600 text-white shadow-sm ring-2 ring-blue-100";
                } else if (isSelected) {
                  btnClass += isCorrectLocally 
                    ? "border-green-400 bg-green-50 text-green-700 shadow-sm" 
                    : "border-red-400 bg-red-50 text-red-700 shadow-sm";
                } else {
                  btnClass += "border-gray-200 bg-gray-50 text-gray-500 hover:bg-white hover:border-blue-300 hover:text-blue-600";
                }

                return (
                  <button
                    key={q.id || i}
                    onClick={() => {
                      setCurrentIndex(i);
                      setIsSidebarOpen(false);
                    }}
                    className={btnClass}
                    title={`Question ${i + 1}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white" onClick={() => setIsSidebarOpen(false)}>
          <div className="max-w-3xl mx-auto w-full px-6 py-8 lg:px-10 flex flex-col min-h-full">
            
            <div className="mb-6">
              <span className="inline-block bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-sm text-[11px] uppercase tracking-wider mb-3">Question {currentIndex + 1} of {questions.length}</span>
              <h2 className="text-[18px] font-bold text-gray-900 leading-snug">{currentQuestion.text}</h2>
            </div>

            <div className="space-y-3 mb-8 flex-1">
              {currentQuestion.options.map((option, index) => {
                let btnClass = "w-full text-left p-4 rounded-md border transition-all flex items-center justify-between group relative overflow-hidden ";
                const isSelected = selectedOptions[currentIndex] === index;
                const isActualCorrect = index === currentQuestion.correct_option_index;

                if (!hasAnsweredCurrent) {
                  btnClass += "border-gray-200 bg-white hover:border-blue-400 hover:shadow-sm text-gray-800 cursor-pointer";
                } else {
                  btnClass += "cursor-default ";
                  if (isSelected && isActualCorrect) {
                    btnClass += "border-green-500 bg-green-50 text-green-900 shadow-sm";
                  } else if (isSelected && !isActualCorrect) {
                    btnClass += "border-red-500 bg-red-50 text-red-900 shadow-sm";
                  } else if (isActualCorrect) {
                    btnClass += "border-green-400 bg-white text-green-800 border-dashed";
                  } else {
                    btnClass += "border-gray-200 bg-gray-50 text-gray-400 opacity-50";
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleOptionClick(index)}
                    disabled={hasAnsweredCurrent}
                    className={btnClass}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={`w-6 h-6 rounded-sm flex items-center justify-center font-bold text-[12px] shrink-0 border ${
                        hasAnsweredCurrent 
                          ? (isSelected && isActualCorrect) || isActualCorrect ? 'bg-green-500 text-white border-green-500' : isSelected ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-400'
                          : 'border-gray-200 text-gray-500 bg-gray-50 group-hover:border-blue-400 group-hover:text-blue-600 group-hover:bg-blue-50'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-[14px] font-semibold leading-relaxed">{option}</span>
                    </div>
                    {hasAnsweredCurrent && isActualCorrect && (
                      <CheckCircle2 className="text-green-500 relative z-10 shrink-0" size={20} />
                    )}
                    {hasAnsweredCurrent && isSelected && !isActualCorrect && (
                      <XCircle className="text-red-500 relative z-10 shrink-0" size={20} />
                    )}
                  </button>
                );
              })}
            </div>

            {hasAnsweredCurrent && (
              <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className={`p-4 rounded-md border-l-[3px] shadow-sm ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                  <h3 className={`text-[13px] font-bold flex items-center gap-1.5 mb-1.5 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {isCorrect ? "Correct!" : "Incorrect"}
                  </h3>
                  <p className="text-gray-700 font-medium text-[13px] leading-relaxed">
                    Correct Answer: <span className="font-bold">{currentQuestion.options[currentQuestion.correct_option_index]}</span>
                  </p>
                  
                  {!showNotes[currentIndex] ? (
                    <button
                      onClick={() => setShowNotes(prev => ({ ...prev, [currentIndex]: true }))}
                      className="mt-3 text-blue-600 text-[12px] font-bold hover:underline flex items-center gap-1"
                    >
                      <FileText size={14} /> View Explanation & Solution
                    </button>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-gray-200/50 space-y-4">
                      {currentQuestion.solution && (
                        <div>
                          <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Detailed Solution</h4>
                          <div className="bg-white border border-gray-200 p-3 rounded-sm text-[13px] text-gray-800 font-mono whitespace-pre-wrap leading-relaxed shadow-sm">
                            {currentQuestion.solution}
                          </div>
                        </div>
                      )}
                      {currentQuestion.notes && (
                        <div>
                          <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Explanation / Notes</h4>
                          <p className="text-gray-800 text-[13px] leading-relaxed whitespace-pre-wrap">{currentQuestion.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto shrink-0">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-[13px] font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              
              {currentIndex === questions.length - 1 ? (
                 <button
                 onClick={handleFinish}
                 disabled={!hasAnsweredCurrent}
                 className="flex items-center gap-1.5 px-6 py-2 rounded-sm text-[13px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-colors"
               >
                 Finish
               </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-6 py-2 rounded-sm text-[13px] font-bold bg-gray-900 hover:bg-black text-white shadow-sm transition-colors"
                >
                  Next <ChevronRight size={16} />
                </button>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
