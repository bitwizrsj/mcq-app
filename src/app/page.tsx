"use client";

import { useEffect, useState } from "react";
import { Storage, Project } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { Folder, Plus, ChevronRight, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  
  const [joinPin, setJoinPin] = useState("");
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    // Clean up any duplicates caused by previous bug
    Storage.deleteDuplicates();
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

  const handleJoinByPin = () => {
    if (!joinPin.trim()) return;
    const set = Storage.getMCQSetByPin(joinPin.trim().toUpperCase());
    if (set) {
      router.push(`/solve/${set.id}`);
    } else {
      setPinError("Invalid PIN or Question Set not found.");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f8] text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800">MCQ Generator</h1>
      </header>

      <div className="w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Create Project Card */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Create New Project</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Biology Midterms"
                className="flex-1 bg-white border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] transition-colors"
              />
              <button
                onClick={handleCreateProject}
                className="bg-[#0067b8] hover:bg-[#005da6] text-white px-5 py-2 rounded-sm text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={16} /> Create
              </button>
            </div>
          </div>

          {/* Join by PIN Card */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Join by PIN</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={joinPin}
                onChange={(e) => {
                  setJoinPin(e.target.value);
                  setPinError("");
                }}
                placeholder="Enter 6-digit PIN"
                className="flex-1 bg-white border border-gray-300 rounded-sm px-3 py-2 text-sm uppercase focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] transition-colors tracking-widest"
                maxLength={6}
              />
              <button
                onClick={handleJoinByPin}
                className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-sm text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <LogIn size={16} /> Join Set
              </button>
            </div>
            {pinError && <p className="text-[#d13438] text-xs font-semibold mt-2">{pinError}</p>}
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <Folder size={20} className="text-[#0067b8]" /> Your Projects
          </h2>
          {projects.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white shadow-sm rounded-sm border border-gray-200 border-dashed">
              No projects yet. Create one above to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {projects.map((p) => (
                <Link
                  href={`/project/${p.id}`}
                  key={p.id}
                  className="group bg-white border border-gray-200 p-5 rounded-sm shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="text-[#0067b8]" size={18} />
                  </div>
                  <h3 className="text-base font-semibold mb-1 text-gray-800 pr-6">{p.name}</h3>
                  <p className="text-xs text-gray-500">
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
