import { create } from 'zustand';
import type { Build, BuildStage } from '@/types';
import { builds as mockBuilds, getBuildById, getBuildsByProject } from '@/data/builds';

interface BuildState {
  builds: Build[];
  currentBuild: Build | null;
  selectedStage: BuildStage | null;
  isLoading: boolean;
  setCurrentBuild: (buildId: string) => void;
  setSelectedStage: (stage: BuildStage | null) => void;
  getBuildsByProject: (projectId: string) => Build[];
  triggerBuild: (projectId: string) => void;
  rerunStage: (buildId: string, stageId: string) => void;
  compareBuilds: (buildId1: string, buildId2: string) => {
    build1: Build | undefined;
    build2: Build | undefined;
  };
}

export const useBuildStore = create<BuildState>((set, get) => ({
  builds: mockBuilds,
  currentBuild: null,
  selectedStage: null,
  isLoading: false,
  
  setCurrentBuild: (buildId) => {
    const build = getBuildById(buildId);
    set({ currentBuild: build || null });
    if (build && build.stages.length > 0) {
      set({ selectedStage: build.stages[0] });
    }
  },
  
  setSelectedStage: (stage) => set({ selectedStage: stage }),
  
  getBuildsByProject: (projectId) => {
    return getBuildsByProject(projectId);
  },
  
  triggerBuild: (projectId) => {
    const newBuild: Build = {
      id: `build-${Date.now()}`,
      projectId,
      pipelineId: 'pipeline-1',
      status: 'running',
      triggeredBy: 'user-1',
      triggerType: 'manual',
      commitHash: `a${Math.random().toString(36).substr(2, 6)}b${Math.random().toString(36).substr(2, 6)}`,
      commitMessage: '手动触发构建',
      startTime: new Date().toISOString(),
      stages: [
        {
          id: `stage-${Date.now()}-1`,
          buildId: `build-${Date.now()}`,
          stageName: '代码检查',
          status: 'running',
          startTime: new Date().toISOString(),
          logs: [],
        },
        {
          id: `stage-${Date.now()}-2`,
          buildId: `build-${Date.now()}`,
          stageName: '构建',
          status: 'pending',
          startTime: new Date().toISOString(),
          logs: [],
        },
        {
          id: `stage-${Date.now()}-3`,
          buildId: `build-${Date.now()}`,
          stageName: '测试',
          status: 'pending',
          startTime: new Date().toISOString(),
          logs: [],
        },
        {
          id: `stage-${Date.now()}-4`,
          buildId: `build-${Date.now()}`,
          stageName: '部署',
          status: 'pending',
          startTime: new Date().toISOString(),
          logs: [],
        },
      ],
    };
    
    set((state) => ({
      builds: [newBuild, ...state.builds],
    }));
  },
  
  rerunStage: (buildId, stageId) => {
    set((state) => {
      const updatedBuilds = state.builds.map((build) => {
        if (build.id !== buildId) return build;
        return {
          ...build,
          status: 'running' as const,
          stages: build.stages.map((stage) =>
            stage.id === stageId
              ? { ...stage, status: 'running' as const, startTime: new Date().toISOString() }
              : stage
          ),
        };
      });
      return { builds: updatedBuilds };
    });
  },
  
  compareBuilds: (buildId1, buildId2) => {
    return {
      build1: getBuildById(buildId1),
      build2: getBuildById(buildId2),
    };
  },
}));
