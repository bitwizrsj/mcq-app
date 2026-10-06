"use client";

import { useEffect, useState, use } from "react";
import { Storage, Project, MCQSet } from "@/lib/storage";
import Link from "next/link";
import { FileQuestion, Plus, ArrowLeft, PlayCircle } from "lucide-react";
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

  if (!project) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <Link href="/" className="inline-flex items-center text-neutral-400 hover:text-white transition-colors mb-6 text-sm">
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
          </Link>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-neutral-400 mt-2">Manage your question sets for this project</p>
            </div>
            <Link
              href={`/project/${project.id}/create`}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
            >
              <Plus size={18} /> Create MCQ Set
            </Link>
          </div>
        </header>

        <section>
          {mcqSets.length === 0 ? (
            <div className="text-center py-16 text-neutral-500 bg-neutral-900/50 rounded-2xl border border-neutral-800 border-dashed">
              <FileQuestion size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No MCQ sets created yet.</p>
              <p className="text-sm mt-1">Click the button above to generate some questions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mcqSets.map((set) => (
                <div key={set.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col">
                  <h3 className="text-lg font-semibold mb-2">{set.title}</h3>
                  <div className="text-sm text-neutral-400 mb-4 space-y-1 flex-1">
                    <p><span className="text-neutral-500">Topic:</span> {set.topic}</p>
                    <p><span className="text-neutral-500">Level:</span> <span className="capitalize">{set.level}</span></p>
                    <p><span className="text-neutral-500">Questions:</span> {set.count}</p>
                  </div>
                  <Link
                    href={`/solve/${set.id}`}
                    className="w-full bg-neutral-800 hover:bg-blue-600/20 hover:text-blue-400 border border-transparent hover:border-blue-500/30 text-white px-4 py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition-all"
                  >
                    <PlayCircle size={18} /> Solve Now
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
