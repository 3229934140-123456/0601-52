import { create } from 'zustand';
import type { Project, BuildStatus } from '@/types';
import { projects as mockProjects, getProjectById } from '@/data/projects';

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  searchKeyword: string;
  filterStatus: BuildStatus | 'all';
  filterTeam: string;
  setSearchKeyword: (keyword: string) => void;
  setFilterStatus: (status: BuildStatus | 'all') => void;
  setFilterTeam: (teamId: string) => void;
  selectProject: (project: Project | null) => void;
  getFilteredProjects: () => Project[];
  addProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: mockProjects,
  selectedProject: null,
  searchKeyword: '',
  filterStatus: 'all',
  filterTeam: 'all',
  
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  
  setFilterStatus: (status) => set({ filterStatus: status }),
  
  setFilterTeam: (teamId) => set({ filterTeam: teamId }),
  
  selectProject: (project) => set({ selectedProject: project }),
  
  getFilteredProjects: () => {
    const { projects, searchKeyword, filterStatus, filterTeam } = get();
    let result = [...projects];
    
    if (searchKeyword) {
      const lower = searchKeyword.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower)
      );
    }
    
    if (filterStatus !== 'all') {
      result = result.filter((p) => p.lastBuildStatus === filterStatus);
    }
    
    if (filterTeam !== 'all') {
      result = result.filter((p) => p.teamId === filterTeam);
    }
    
    return result;
  },
  
  addProject: (project) => {
    set((state) => ({ projects: [project, ...state.projects] }));
  },
}));

export { getProjectById };
