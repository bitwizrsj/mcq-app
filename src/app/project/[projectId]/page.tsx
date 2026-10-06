"use client";

import { useEffect, useState, use } from "react";
import { Storage, Project, MCQSet } from "@/lib/storage";
import Link from "next/link";
import { FileQuestion, Plus, ArrowLeft, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const router = useRouter();
  const { projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [mcqSets, setMcqSets] = useState<MCQSet[]>([]);

  useEffect(() => {
    const projs = Storage.getProjects();
    const p = projs.find((p) => p.id === projectId);
    if (!p) {
      router.push("/");
      return;
    }
    setProject(p);
    setMcqSets(Storage.getMCQSets(projectId));
  }, [projectId, router]);

  const generatePin = (setId: string) => {
    const set = Storage.getMCQSet(setId);
    if (!set) return;
    
    // Generate random 6 character alphanumeric PIN
    const pin = Math.random().toString(36).substring(2, 8).toUpperCase();
    const updatedSet = { ...set, sharePin: pin };
    
    Storage.saveMCQSet(updatedSet);
    setMcqSets(Storage.getMCQSets(projectId));
  };

  if (!project) return null;

  return (
    <div className="min-h-screen bg-[#faf9f8] text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold text-gray-800">{project.name}</h1>
      </header>

      <div className="w-full px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Question Sets</h2>
          <Link
            href={`/project/${project.id}/create`}
            className="bg-[#0067b8] hover:bg-[#005da6] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={16} /> New Question Set
          </Link>
        </div>

        <section>
          {mcqSets.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-white shadow-sm rounded-sm border border-gray-200 border-dashed">
              <FileQuestion size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-base font-medium">No MCQ sets created yet.</p>
              <p className="text-sm mt-1 text-gray-400">Click the button above to generate some questions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mcqSets.map((set) => (
                <div key={set.id} className="bg-white border border-gray-200 p-5 rounded-sm shadow-sm flex flex-col hover:shadow-md transition-shadow relative group">
                  
                  {/* Share PIN Section */}
                  <div className="absolute top-4 right-4">
                    {set.sharePin ? (
                      <div className="bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold px-2 py-1 rounded-sm shadow-sm font-mono tracking-widest flex items-center gap-1 cursor-help" title="Share this PIN with others">
                        PIN: {set.sharePin}
                      </div>
                    ) : (
                      <button
                        onClick={() => generatePin(set.id)}
                        className="text-gray-400 hover:text-[#0067b8] transition-colors p-1"
                        title="Generate Share PIN"
                      >
                        <Share2 size={16} />
                      </button>
                    )}
                  </div>

                  <h3 className="text-base font-semibold mb-2 text-gray-800 pr-16">{set.title}</h3>
                  <div className="text-xs text-gray-500 mb-4 space-y-1.5 flex-1">
                    <p><span className="font-medium text-gray-700">Topic:</span> {set.topic}</p>
                    <p><span className="font-medium text-gray-700">Level:</span> <span className="capitalize">{set.level}</span></p>
                    <p><span className="font-medium text-gray-700">Count:</span> {set.count} questions</p>
                  </div>
                  <Link
                    href={`/project/${project.id}/set/${set.id}`}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-sm text-sm font-medium flex justify-center items-center gap-2 transition-colors border border-gray-200"
                  >
                    <FileQuestion size={16} /> View Questions
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
