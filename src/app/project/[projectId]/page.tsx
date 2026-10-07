"use client";

import { useEffect, useState, use } from "react";
import { DB, Project, MCQSet } from "@/lib/db";
import Link from "next/link";
import { FileQuestion, Plus, ArrowLeft, Share2, Loader2, Trophy, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const router = useRouter();
  const { projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [mcqSets, setMcqSets] = useState<MCQSet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectData = async () => {
    setLoading(true);
    const p = await DB.getProject(projectId);
    if (!p) {
      router.push("/");
      return;
    }
    setProject(p);
    const sets = await DB.getMCQSets(projectId);
    setMcqSets(sets);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId, router]);

  const [isSharing, setIsSharing] = useState<Record<string, boolean>>({});

  const generatePin = async (setId: string, currentPin?: string) => {
    setIsSharing(prev => ({ ...prev, [setId]: true }));
    try {
      const pin = currentPin || Math.random().toString(36).substring(2, 8).toUpperCase();
      await DB.updateMCQSetPin(setId, pin);
      fetchProjectData();
    } catch (e) {
      console.error("Failed to generate PIN", e);
    } finally {
      setIsSharing(prev => ({ ...prev, [setId]: false }));
    }
  };

  if (!project && loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex justify-center items-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-gray-900 font-sans text-[13px]">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 hover:bg-gray-100 rounded-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>
          <h1 className="text-[15px] font-bold text-gray-800">{project.name}</h1>
        </div>
      </header>

      <div className="w-full max-w-5xl mx-auto px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">Question Sets</h2>
          <Link
            href={`/project/${project.id}/create`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-sm text-[13px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus size={14} /> New Set
          </Link>
        </div>

        <section>
          {mcqSets.length === 0 ? (
            <div className="text-center py-16 bg-white shadow-sm rounded-md border border-gray-200 border-dashed">
              <div className="bg-blue-50 w-12 h-12 rounded-sm flex items-center justify-center mx-auto mb-3">
                <FileQuestion size={24} className="text-blue-600" />
              </div>
              <p className="text-[15px] font-bold text-gray-900">No question sets yet.</p>
              <p className="text-[13px] mt-1 text-gray-500 max-w-sm mx-auto">Create a new set by providing a topic and letting AI generate the questions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mcqSets.map((set) => (
                <div key={set.id} className="bg-white border border-gray-200 rounded-md shadow-sm flex flex-col hover:border-blue-300 transition-colors relative group overflow-hidden">
                  
                  {/* Decorative Header */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>

                  <div className="p-5 flex-1 flex flex-col">
                    {/* Share PIN Section */}
                    <div className="absolute top-5 right-5 flex items-center gap-2">
                      {set.share_pin ? (
                        <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold px-2 py-1 rounded-sm shadow-sm font-mono tracking-widest cursor-help">
                          PIN: {set.share_pin}
                        </div>
                      ) : (
                        <button
                          onClick={() => generatePin(set.id)}
                          disabled={isSharing[set.id]}
                          className="bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 transition-colors px-2 py-1 rounded-sm text-[11px] font-bold flex items-center gap-1 shadow-sm disabled:opacity-50"
                        >
                          {isSharing[set.id] ? <Loader2 size={12} className="animate-spin" /> : <Share2 size={12} />} Share
                        </button>
                      )}
                    </div>

                    <h3 className="text-[15px] font-bold mb-3 text-gray-900 pr-20 leading-tight line-clamp-2" title={set.title}>{set.title}</h3>
                    
                    <div className="space-y-1.5 mb-5 flex-1 border-t border-gray-100 pt-3">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="font-semibold text-gray-500">Topic</span>
                        <span className="text-gray-800 font-medium truncate max-w-[150px]">{set.topic}</span>
                      </div>
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="font-semibold text-gray-500">Level</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded-sm capitalize ${set.level.toLowerCase().includes('hard') ? 'bg-red-50 text-red-700' : set.level.toLowerCase().includes('medium') ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>{set.level}</span>
                      </div>
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="font-semibold text-gray-500">Count</span>
                        <span className="text-gray-800 font-medium">{set.count} Qs</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link
                        href={`/project/${project.id}/set/${set.id}`}
                        className="flex-1 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-sm text-[12px] font-bold flex justify-center items-center gap-1 transition-colors border border-gray-200 shadow-sm"
                      >
                        Details
                      </Link>
                      <Link
                        href={`/solve/${set.id}`}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-sm text-[12px] font-bold flex justify-center items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Trophy size={14} /> Compete
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
