import { create } from 'zustand';

interface AppState {
  sidebarCollapsed: boolean;
  theme: 'dark';
  currentPage: string;
  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  theme: 'dark',
  currentPage: 'projects',
  
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  setCurrentPage: (page) => set({ currentPage: page }),
}));
