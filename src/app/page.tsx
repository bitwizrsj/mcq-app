"use client";

import { useEffect, useState } from "react";
import { Storage, Project } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { Folder, Plus, ArrowRight } from "lucide-react";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    setProjects(Storage.getProjects());
  }, []);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const p: Project = {
      id: uuidv4(),
      name: newProjectName,
      createdAt: Date.now(),
    };
    Storage.saveProject(p);
    setProjects(Storage.getProjects());
    setNewProjectName("");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              MCQ Generator
            </h1>
            <p className="text-neutral-400 mt-2">Manage and create AI-powered question sets</p>
          </div>
        </header>

        <section className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
          <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g., Biology Midterms"
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button
              onClick={handleCreateProject}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
            >
              <Plus size={18} /> Create
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Folder className="text-blue-400" /> Your Projects
          </h2>
          {projects.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 bg-neutral-900/50 rounded-2xl border border-neutral-800 border-dashed">
              No projects yet. Create one above to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((p) => (
                <Link
                  href={`/project/${p.id}`}
                  key={p.id}
                  className="group bg-neutral-900 border border-neutral-800 p-6 rounded-2xl hover:border-blue-500/50 hover:bg-neutral-800/80 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                    <ArrowRight className="text-blue-400" size={20} />
                  </div>
                  <h3 className="text-lg font-medium mb-2 pr-8">{p.name}</h3>
                  <p className="text-sm text-neutral-500">
                    Created {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
