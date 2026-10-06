export interface Project {
  id: string;
  name: string;
  createdAt: number;
}

export interface MCQSet {
  id: string;
  projectId: string;
  title: string;
  topic: string;
  level: string;
  count: number;
  questions: Question[];
  createdAt: number;
  progress?: {
    currentIndex: number;
    selectedOptions: Record<number, number>;
    showNotes: Record<number, boolean>;
  };
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  solution: string;
  notes: string;
}

export const Storage = {
  getProjects: (): Project[] => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("mcq_projects") || "[]");
  },
  saveProject: (p: Project) => {
    const projs = Storage.getProjects();
    localStorage.setItem("mcq_projects", JSON.stringify([...projs, p]));
  },
  getMCQSets: (projectId?: string): MCQSet[] => {
    if (typeof window === "undefined") return [];
    const sets: MCQSet[] = JSON.parse(localStorage.getItem("mcq_sets") || "[]");
    return projectId ? sets.filter((s) => s.projectId === projectId) : sets;
  },
  getMCQSet: (id: string): MCQSet | undefined => {
    return Storage.getMCQSets().find((s) => s.id === id);
  },
  saveMCQSet: (s: MCQSet) => {
    const sets = Storage.getMCQSets();
    localStorage.setItem("mcq_sets", JSON.stringify([...sets, s]));
  },
};
