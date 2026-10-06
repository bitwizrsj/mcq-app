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
  sharePin?: string;
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
    const index = projs.findIndex(existing => existing.id === p.id);
    if (index >= 0) {
      projs[index] = p;
    } else {
      projs.push(p);
    }
    localStorage.setItem("mcq_projects", JSON.stringify(projs));
  },
  getMCQSets: (projectId?: string): MCQSet[] => {
    if (typeof window === "undefined") return [];
    const sets: MCQSet[] = JSON.parse(localStorage.getItem("mcq_sets") || "[]");
    return projectId ? sets.filter((s) => s.projectId === projectId) : sets;
  },
  getMCQSet: (id: string): MCQSet | undefined => {
    return Storage.getMCQSets().find((s) => s.id === id);
  },
  getMCQSetByPin: (pin: string): MCQSet | undefined => {
    return Storage.getMCQSets().find((s) => s.sharePin === pin);
  },
  saveMCQSet: (s: MCQSet) => {
    const sets = Storage.getMCQSets();
    const index = sets.findIndex(existing => existing.id === s.id);
    if (index >= 0) {
      sets[index] = s;
    } else {
      sets.push(s);
    }
    localStorage.setItem("mcq_sets", JSON.stringify(sets));
  },
  deleteDuplicates: () => {
    // A utility to clean up the existing duplicate mess
    const sets = Storage.getMCQSets();
    const uniqueSets: Record<string, MCQSet> = {};
    // Iterate backwards so we keep the latest version of the set
    for (let i = sets.length - 1; i >= 0; i--) {
      if (!uniqueSets[sets[i].id]) {
        uniqueSets[sets[i].id] = sets[i];
      }
    }
    localStorage.setItem("mcq_sets", JSON.stringify(Object.values(uniqueSets).reverse()));
  }
};
