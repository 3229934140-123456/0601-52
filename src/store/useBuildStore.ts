import { create } from 'zustand';
import type { Build, BuildStage, BuildLog, TestConclusion } from '@/types';
import { builds as mockBuilds, getBuildById, getBuildsByProject } from '@/data/builds';

function generateRunningLogs(stageId: string): BuildLog[] {
  const logs: BuildLog[] = [];
  const messages = [
    'Starting build process...',
    'Checking cache for dependencies',
    'Installing packages...',
    'Compiling source files...',
    'Running lint checks...',
  ];
  
  for (let i = 0; i < messages.length; i++) {
    const time = new Date();
    time.setSeconds(time.getSeconds() + i);
    logs.push({
      id: `log-${stageId}-${i}`,
      stageId,
      timestamp: time.toISOString(),
      level: 'info',
      message: messages[i],
    });
  }
  return logs;
}

interface BuildState {
  builds: Build[];
  currentBuild: Build | null;
  selectedStage: BuildStage | null;
  isLoading: boolean;
  testConclusions: Record<string, TestConclusion>;
  setCurrentBuild: (buildId: string) => void;
  setSelectedStage: (stage: BuildStage | null) => void;
  getBuildsByProject: (projectId: string) => Build[];
  triggerBuild: (projectId: string) => string;
  rerunStage: (buildId: string, stageId: string) => void;
  compareBuilds: (buildId1: string, buildId2: string) => {
    build1: Build | undefined;
    build2: Build | undefined;
  };
  getBuild: (buildId: string) => Build | undefined;
  saveTestConclusion: (buildId: string, conclusion: TestConclusion) => void;
  getTestConclusion: (buildId: string) => TestConclusion | undefined;
}

export const useBuildStore = create<BuildState>((set, get) => ({
  builds: mockBuilds,
  currentBuild: null,
  selectedStage: null,
  isLoading: false,
  testConclusions: {},
  
  setCurrentBuild: (buildId) => {
    const state = get();
    let build = state.builds.find((b) => b.id === buildId);
    if (!build) {
      build = getBuildById(buildId);
    }
    set({ currentBuild: build || null });
    if (build && build.stages.length > 0) {
      set({ selectedStage: build.stages[0] });
    }
  },
  
  setSelectedStage: (stage) => set({ selectedStage: stage }),
  
  getBuildsByProject: (projectId) => {
    const state = get();
    const storeBuilds = state.builds.filter((b) => b.projectId === projectId);
    const mockBuildsForProject = getBuildsByProject(projectId);
    const allBuilds = [...storeBuilds, ...mockBuildsForProject];
    const uniqueBuilds = Array.from(new Map(allBuilds.map((b) => [b.id, b])).values());
    return uniqueBuilds.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  },
  
  getBuild: (buildId) => {
    const state = get();
    let build = state.builds.find((b) => b.id === buildId);
    if (!build) {
      build = getBuildById(buildId);
    }
    return build;
  },
  
  triggerBuild: (projectId) => {
    const buildId = `build-${Date.now()}`;
    const now = new Date().toISOString();
    const stageNames = ['代码检查', '构建', '测试', '部署'];
    
    const stages: BuildStage[] = stageNames.map((name, index) => ({
      id: `${buildId}-stage-${index}`,
      buildId,
      stageName: name,
      status: index === 0 ? 'running' : 'pending',
      startTime: now,
      endTime: undefined,
      duration: undefined,
      logs: index === 0 ? generateRunningLogs(`${buildId}-stage-${index}`) : [],
    }));
    
    const newBuild: Build = {
      id: buildId,
      projectId,
      pipelineId: 'pipeline-1',
      status: 'running',
      triggeredBy: 'user-1',
      triggerType: 'manual',
      commitHash: `a${Math.random().toString(36).substr(2, 6)}b${Math.random().toString(36).substr(2, 6)}`,
      commitMessage: '手动触发构建',
      startTime: now,
      endTime: undefined,
      duration: undefined,
      stages,
    };
    
    set((state) => ({
      builds: [newBuild, ...state.builds],
      currentBuild: newBuild,
      selectedStage: newBuild.stages[0],
    }));
    
    return buildId;
  },
  
  rerunStage: (buildId, stageId) => {
    const now = new Date().toISOString();
    set((state) => {
      const updatedBuilds = state.builds.map((build) => {
        if (build.id !== buildId) return build;
        const updatedStages = build.stages.map((stage) =>
          stage.id === stageId
            ? {
                ...stage,
                status: 'running' as const,
                startTime: now,
                endTime: undefined,
                duration: undefined,
                logs: generateRunningLogs(stage.id),
              }
            : stage
        );
        return {
          ...build,
          status: 'running' as const,
          endTime: undefined,
          duration: undefined,
          stages: updatedStages,
        };
      });
      
      const updatedCurrentBuild = state.currentBuild?.id === buildId
        ? updatedBuilds.find((b) => b.id === buildId) || null
        : state.currentBuild;
      
      const updatedSelectedStage = state.selectedStage?.id === stageId && updatedCurrentBuild
        ? updatedCurrentBuild.stages.find((s) => s.id === stageId) || null
        : state.selectedStage;
      
      return {
        builds: updatedBuilds,
        currentBuild: updatedCurrentBuild,
        selectedStage: updatedSelectedStage,
      };
    });
  },
  
  compareBuilds: (buildId1, buildId2) => {
    const state = get();
    const b1 = state.builds.find((b) => b.id === buildId1) || getBuildById(buildId1);
    const b2 = state.builds.find((b) => b.id === buildId2) || getBuildById(buildId2);
    return {
      build1: b1,
      build2: b2,
    };
  },
  
  saveTestConclusion: (buildId, conclusion) => {
    set((state) => ({
      testConclusions: {
        ...state.testConclusions,
        [buildId]: conclusion,
      },
    }));
  },
  
  getTestConclusion: (buildId) => {
    return get().testConclusions[buildId];
  },
}));
