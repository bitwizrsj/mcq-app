"use client";

import { useEffect, useState, use } from "react";
import { Storage, MCQSet } from "@/lib/storage";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Minus, PlayCircle, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MCQSetOverviewPage({ params }: { params: Promise<{ projectId: string, mcqId: string }> }) {
  const router = useRouter();
  const { projectId, mcqId } = use(params);
  const [mcqSet, setMcqSet] = useState<MCQSet | null>(null);

  useEffect(() => {
    const set = Storage.getMCQSet(mcqId);
    if (!set) {
      router.push(`/project/${projectId}`);
      return;
    }
    setMcqSet(set);
  }, [mcqId, projectId, router]);

  if (!mcqSet) return null;

  const getStatusIcon = (index: number) => {
    if (!mcqSet.progress || mcqSet.progress.selectedOptions[index] === undefined) {
      return <Minus className="text-gray-300" size={18} />;
    }
    const isCorrect = mcqSet.progress.selectedOptions[index] === mcqSet.questions[index].correctOptionIndex;
    return isCorrect ? <CheckCircle2 className="text-[#107c10]" size={18} /> : <XCircle className="text-[#d13438]" size={18} />;
  };

  const getStatusText = (index: number) => {
    if (!mcqSet.progress || mcqSet.progress.selectedOptions[index] === undefined) {
      return <span className="text-gray-500">Unanswered</span>;
    }
    const isCorrect = mcqSet.progress.selectedOptions[index] === mcqSet.questions[index].correctOptionIndex;
    return isCorrect ? <span className="text-[#107c10]">Correct</span> : <span className="text-[#d13438]">Incorrect</span>;
  };

  return (
    <div className="min-h-screen bg-[#faf9f8] text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/project/${projectId}`} className="text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{mcqSet.title}</h1>
            <p className="text-xs text-gray-500">Question Overview</p>
          </div>
        </div>
        <Link
          href={`/solve/${mcqSet.id}`}
          className="bg-[#0067b8] hover:bg-[#005da6] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <PlayCircle size={16} /> Resume Solving
        </Link>
      </header>

      <div className="w-full p-6">
        <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 font-semibold text-gray-600 w-20 text-center">Status</th>
                <th className="px-6 py-3 font-semibold text-gray-600 w-24">No.</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Question Title</th>
                <th className="px-6 py-3 font-semibold text-gray-600 w-32 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mcqSet.questions.map((q, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center">{getStatusIcon(idx)}</div>
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {idx + 1}
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-800">
                    <div className="line-clamp-1">{q.text}</div>
                    <div className="text-xs mt-0.5 block sm:hidden">{getStatusText(idx)}</div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Link
                      href={`/solve/${mcqSet.id}?q=${idx}`}
                      className="inline-flex items-center text-xs font-semibold text-[#0067b8] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Solve <ChevronRight size={14} className="ml-1" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
