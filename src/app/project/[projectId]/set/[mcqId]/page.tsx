"use client";

import { useEffect, useState, use } from "react";
import { DB, MCQSet, Question } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Minus, PlayCircle, ChevronRight, Loader2, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MCQSetOverviewPage({ params }: { params: Promise<{ projectId: string, mcqId: string }> }) {
  const router = useRouter();
  const { projectId, mcqId } = use(params);
  const [mcqSet, setMcqSet] = useState<MCQSet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [progress, setProgress] = useState<Record<number, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const set = await DB.getMCQSet(mcqId);
      if (!set) {
        router.push(`/project/${projectId}`);
        return;
      }
      setMcqSet(set);
      const q = await DB.getQuestions(mcqId);
      setQuestions(q);
      
      try {
        const localData = localStorage.getItem(`progress_${mcqId}`);
        if (localData) {
          setProgress(JSON.parse(localData).selectedOptions || {});
        }
      } catch(e) {}
      
      setLoading(false);
    };
    fetchData();
  }, [projectId, mcqId, router]);

  if (!mcqSet && loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex justify-center items-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }
  
  if (!mcqSet) return null;

  const getStatusIcon = (index: number, question: Question) => {
    const selected = progress[index];
    if (selected === undefined) {
      return <Minus size={14} className="text-gray-300" />;
    }
    return selected === question.correct_option_index ? (
      <CheckCircle2 size={14} className="text-green-500" />
    ) : (
      <XCircle size={14} className="text-red-500" />
    );
  };

  const answeredCount = Object.keys(progress).length;
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-gray-900 font-sans text-[13px]">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href={`/project/${projectId}`} className="p-1 hover:bg-gray-100 rounded-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>
          <div className="flex-1 min-w-0 max-w-sm">
            <h1 className="text-[15px] font-bold text-gray-900 leading-tight truncate" title={mcqSet.title}>{mcqSet.title}</h1>
            <p className="text-[11px] text-gray-500 font-medium truncate uppercase tracking-wider mt-0.5" title={mcqSet.topic}>{mcqSet.topic} • {questions.length} Qs</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/solve/${mcqId}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-sm text-[12px] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <PlayCircle size={14} /> Resume
          </Link>
        </div>
      </header>

      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        
        {/* Progress Card */}
        <div className="bg-white border border-gray-200 rounded-md p-4 mb-6 shadow-sm flex items-center gap-5">
          <div className="relative w-14 h-14 flex items-center justify-center bg-gray-50 rounded-full border-[3px] border-gray-100">
            <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
              <circle cx="25" cy="25" r="25" stroke="#e5e7eb" strokeWidth="6" fill="none" className="translate-x-0.5 translate-y-0.5"/>
              <circle cx="25" cy="25" r="25" stroke="#2563eb" strokeWidth="6" fill="none" strokeDasharray="157" strokeDashoffset={157 - (157 * progressPercent) / 100} className="transition-all duration-1000 translate-x-0.5 translate-y-0.5"/>
            </svg>
            <span className="text-[13px] font-bold text-gray-900">{Math.round(progressPercent)}%</span>
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-bold text-gray-900 mb-0.5">Your Progress</h3>
            <p className="text-gray-500 text-[12px]">You have answered {answeredCount} out of {questions.length} questions.</p>
          </div>
        </div>

        {/* List View */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-[13px]">Question List</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                  <th className="py-2.5 px-4 w-12 text-center">St</th>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4 w-20 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr 
                    key={q.id || i} 
                    className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/solve/${mcqId}?q=${i}`)}
                  >
                    <td className="py-3 px-4 text-center align-middle">
                      <div className="flex justify-center">
                        {getStatusIcon(i, q)}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <div className="font-medium text-gray-900 line-clamp-1 text-[13px]">{i + 1}. {q.text}</div>
                    </td>
                    <td className="py-3 px-4 align-middle text-center">
                      <div className="inline-flex items-center text-[12px] font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                        Solve <ChevronRight size={12} className="ml-0.5" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
