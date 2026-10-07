"use client";

import { useEffect, useState } from "react";
import { DB, Project } from "@/lib/db";
import Link from "next/link";
import { 
  Folder, Plus, ChevronRight, LogIn, Loader2, Sparkles, 
  Home as HomeIcon, Trophy, BarChart3, Settings, Search, 
  Bell, LayoutTemplate, Zap, LayoutGrid, List, ArrowRight,
  MoreHorizontal, Code, Menu
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [joinPin, setJoinPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const [activeTab, setActiveTab] = useState("Home");
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    const data = await DB.getProjects();
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    await DB.createProject(newProjectName.trim());
    setNewProjectName("");
    fetchProjects();
  };

  const handleJoinByPin = async () => {
    if (!joinPin.trim()) return;
    const pin = joinPin.trim().toUpperCase();
    
    setIsJoining(true);
    setPinError("");

    try {
      const set = await DB.getMCQSetByPin(pin);
      if (set) {
        router.push(`/solve/${set.id}`);
      } else {
        setPinError("Invalid PIN or Question Set not found.");
      }
    } catch (err) {
      setPinError("Error connecting to server.");
    } finally {
      setIsJoining(false);
    }
  };

  const getGradient = (name: string) => {
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      "from-blue-500 to-indigo-600",
      "from-purple-500 to-pink-500",
      "from-emerald-400 to-teal-500",
      "from-orange-400 to-red-500",
    ];
    return gradients[hash % gradients.length];
  };

  const SidebarItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
    <button 
      onClick={() => setActiveTab(label)}
      className={`w-full flex items-center ${isSidebarMinimized ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-sm text-[13px] font-medium transition-colors ${
        active 
          ? "bg-blue-50 text-blue-700" 
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
      title={isSidebarMinimized ? label : ""}
    >
      <Icon size={16} className={active ? "text-blue-700" : "text-gray-400"} />
      {!isSidebarMinimized && label}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#f8f9fc] font-sans overflow-hidden text-[13px]">
      
      {/* Sidebar */}
      <aside className={`${isSidebarMinimized ? 'w-16' : 'w-56'} bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0 transition-all duration-300`}>
        <div className={`p-4 flex items-center ${isSidebarMinimized ? 'justify-center' : 'justify-between'} gap-2 border-b border-gray-100`}>
          {!isSidebarMinimized && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="bg-blue-600 p-1 rounded-sm shrink-0">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="text-base font-bold text-gray-900 truncate">QuizMaster <span className="text-blue-600">Pro</span></span>
            </div>
          )}
          <button onClick={() => setIsSidebarMinimized(!isSidebarMinimized)} className="p-1 hover:bg-gray-100 rounded-sm text-gray-500 shrink-0">
            <Menu size={16} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <SidebarItem icon={HomeIcon} label="Home" active={activeTab === "Home"} />
          <SidebarItem icon={Folder} label="My Projects" active={activeTab === "My Projects"} />
          <SidebarItem icon={Trophy} label="Challenges" active={activeTab === "Challenges"} />
          <SidebarItem icon={BarChart3} label="Leaderboard" active={activeTab === "Leaderboard"} />
          <SidebarItem icon={LayoutTemplate} label="Templates" active={activeTab === "Templates"} />
          <SidebarItem icon={BarChart3} label="Analytics" active={activeTab === "Analytics"} />
          <SidebarItem icon={Settings} label="Settings" active={activeTab === "Settings"} />
        </nav>

        {!isSidebarMinimized && (
          <div className="p-3 mt-auto border-t border-gray-100">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-md p-3">
              <div className="bg-amber-100 w-6 h-6 rounded-sm flex items-center justify-center mb-2">
                <Zap size={14} className="text-amber-600" />
              </div>
              <h4 className="text-[13px] font-bold text-gray-900 mb-1">Upgrade to Pro</h4>
              <p className="text-[11px] text-gray-600 mb-2 leading-tight">Unlock premium features and analytics.</p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1.5 rounded-sm flex items-center justify-center gap-1 transition-colors">
                Upgrade Now <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="relative w-80">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search projects, challenges..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-sm pl-8 pr-4 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-all"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-sm px-1.5 py-0.5 text-[9px] font-bold text-gray-400">Ctrl K</div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={16} />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></div>
            </button>
            <div className="w-7 h-7 rounded-sm bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
              RS
            </div>
          </div>
        </header>

        {activeTab !== "Home" ? (
          <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={24} className="text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Feature Coming Soon</h2>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                The <strong>{activeTab}</strong> page is currently under development. Stay tuned!
              </p>
              <button 
                onClick={() => setActiveTab("Home")}
                className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-sm text-[13px] font-semibold transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto space-y-6">
              
              {/* Hero Section */}
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-md p-6 lg:p-8 relative overflow-hidden border border-indigo-100 flex items-center justify-between">
                <div className="relative z-10 max-w-lg">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-indigo-600 uppercase mb-3">
                    <Zap size={12} className="fill-indigo-600" /> Practice • Compete • Master
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-2">
                    Build Your Knowledge.<br/>
                    <span className="text-blue-600">One Question at a Time.</span>
                  </h1>
                  <p className="text-gray-600 text-[13px] mt-3 max-w-md leading-relaxed">
                    Create custom quizzes, join live challenges, and track your progress with powerful analytics — all in one place.
                  </p>
                </div>
                {/* 3D Illustration Image */}
                <div className="relative z-10 hidden md:block w-56 h-40">
                  <img src="/hero_illustration.png" alt="Quiz Illustration" className="w-full h-full object-contain drop-shadow-xl" />
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-10 w-48 h-48 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl opacity-10 rotate-12 blur-2xl"></div>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* Create Project Card */}
                <div className="bg-white rounded-md p-5 shadow-sm border border-gray-200 flex items-start gap-4 hover:border-gray-300 transition-colors">
                  <div className="bg-blue-50 p-2.5 rounded-sm shrink-0">
                    <Folder size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 mb-1">Create New Project</h3>
                    <p className="text-[12px] text-gray-500 mb-3">Organize your MCQs into projects (e.g., Biology Midterms).</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Project name..."
                        className="flex-1 border border-gray-200 rounded-sm px-3 py-1.5 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleCreateProject}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-sm text-[13px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus size={14} /> Create
                      </button>
                    </div>
                  </div>
                </div>

                {/* Join Challenge Card */}
                <div className="bg-white rounded-md p-5 shadow-sm border border-gray-200 flex items-start gap-4 hover:border-gray-300 transition-colors">
                  <div className="bg-purple-50 p-2.5 rounded-sm shrink-0">
                    <Trophy size={20} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 mb-1">Join a Challenge</h3>
                    <p className="text-[12px] text-gray-500 mb-3">Enter a 6-digit PIN to join a multiplayer MCQ session.</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={joinPin}
                        onChange={(e) => {
                          setJoinPin(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));
                          setPinError("");
                        }}
                        placeholder="PIN (e.g. A1B2C3)"
                        maxLength={10}
                        className="flex-1 border border-gray-200 rounded-sm px-3 py-1.5 text-[13px] uppercase font-mono tracking-widest focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      />
                      <button
                        onClick={handleJoinByPin}
                        disabled={isJoining || !joinPin}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-sm text-[13px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        {isJoining ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />} Join Now
                      </button>
                    </div>
                    {pinError && <p className="text-red-500 text-[11px] font-semibold mt-1.5">{pinError}</p>}
                  </div>
                </div>

              </div>

              {/* Projects List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Folder className="text-blue-600" size={18} />
                    <h2 className="text-lg font-bold text-gray-900">Your Projects</h2>
                    <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-1.5 py-0.5 rounded-sm">{projects.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-gray-200 rounded-sm overflow-hidden bg-white">
                      <button className="p-1.5 bg-blue-50 text-blue-600"><LayoutGrid size={14} /></button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600"><List size={14} /></button>
                    </div>
                    <select className="border border-gray-200 rounded-sm px-2 py-1 text-[12px] bg-white text-gray-600 focus:outline-none">
                      <option>Recently Created</option>
                      <option>Alphabetical</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {projects.map((p) => (
                      <div key={p.id} className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm hover:border-blue-300 transition-colors group relative flex flex-col">
                        <div className={`h-20 w-full bg-gradient-to-br ${getGradient(p.name)} relative`}>
                          <button className="absolute top-2 right-2 p-1 bg-black/20 hover:bg-black/40 rounded-sm text-white backdrop-blur-sm transition-colors">
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                        <div className="p-4 relative flex-1 flex flex-col">
                          <div className="absolute -top-5 right-5 w-10 h-10 bg-white rounded-sm flex items-center justify-center shadow-sm">
                            <button 
                              onClick={() => router.push(`/project/${p.id}`)}
                              className="w-8 h-8 rounded-sm border border-gray-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <ArrowRight size={14} />
                            </button>
                          </div>
                          <div className="bg-blue-50 text-blue-600 w-8 h-8 rounded-sm flex items-center justify-center mb-2 mt-1">
                            <Code size={16} />
                          </div>
                          <h3 className="text-[15px] font-bold mb-0.5 text-gray-900 truncate pr-12">{p.name}</h3>
                          <p className="text-[12px] text-gray-500">
                            Created {new Date(p.created_at || "").toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Create New Project Placeholder Card */}
                    <div 
                      onClick={() => document.querySelector("input")?.focus()}
                      className="border border-dashed border-gray-300 rounded-md h-full min-h-[160px] flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-sm bg-white border border-gray-100 flex items-center justify-center shadow-sm mb-2">
                        <Plus size={20} />
                      </div>
                      <h3 className="text-[14px] font-bold text-gray-900">Create Another Project</h3>
                      <p className="text-[12px]">Start organizing your questions</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
