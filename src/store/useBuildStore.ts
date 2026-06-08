import { create } from 'zustand';
import type { Build, BuildStage, BuildLog, TestConclusion, BuildTimelineEvent } from '@/types';
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

function generateTimeline(
  build: Build,
  testConclusion?: TestConclusion,
  rerunHistory?: { stageId: string; rerunTime: string }[]
): BuildTimelineEvent[] {
  const events: BuildTimelineEvent[] = [];
  const startTime = new Date(build.startTime);

  events.push({
    id: `${build.id}-triggered`,
    buildId: build.id,
    type: 'triggered',
    title: '构建触发',
    description: build.triggerType === 'manual' ? '手动触发构建' : build.triggerType === 'push' ? '代码推送触发' : '定时触发',
    timestamp: build.startTime,
    userId: build.triggeredBy,
  });

  const queueTime = new Date(startTime.getTime() + 2000);
  events.push({
    id: `${build.id}-queued`,
    buildId: build.id,
    type: 'queued',
    title: '排队等待',
    description: '构建任务已加入队列',
    timestamp: queueTime.toISOString(),
  });

  build.stages.forEach((stage) => {
    const stageStart = stage.startTime;
    events.push({
      id: `${stage.id}-start`,
      buildId: build.id,
      type: 'stage_start',
      title: `${stage.stageName} 开始`,
      timestamp: stageStart,
      stageId: stage.id,
      status: stage.status,
    });

    if (stage.status !== 'running' && stage.status !== 'pending') {
      const stageEnd = stage.endTime || stageStart;
      events.push({
        id: `${stage.id}-end`,
        buildId: build.id,
        type: 'stage_end',
        title: `${stage.stageName} ${stage.status === 'success' ? '成功' : stage.status === 'failed' ? '失败' : stage.status === 'skipped' ? '跳过' : '结束'}`,
        timestamp: stageEnd,
        stageId: stage.id,
        status: stage.status,
      });

      if (stage.status === 'failed') {
        events.push({
          id: `${stage.id}-failed-evt`,
          buildId: build.id,
          type: 'failed',
          title: `${stage.stageName} 执行失败`,
          description: '阶段执行出现错误',
          timestamp: stageEnd,
          stageId: stage.id,
        });
      }
    }
  });

  if (rerunHistory) {
    rerunHistory.forEach((rerun, idx) => {
      const stage = build.stages.find((s) => s.id === rerun.stageId);
      if (stage) {
        events.push({
          id: `${rerun.stageId}-rerun-${idx}`,
          buildId: build.id,
          type: 'stage_rerun',
          title: `${stage.stageName} 重跑`,
          description: '手动触发阶段重跑',
          timestamp: rerun.rerunTime,
          stageId: rerun.stageId,
        });
      }
    });
  }

  if (build.status === 'success' || build.status === 'failed') {
    events.push({
      id: `${build.id}-completed`,
      buildId: build.id,
      type: 'completed',
      title: build.status === 'success' ? '构建成功' : '构建失败',
      timestamp: build.endTime || new Date(startTime.getTime() + 120000).toISOString(),
      status: build.status,
    });
  }

  if (testConclusion) {
    events.push({
      id: `${build.id}-test-conclusion`,
      buildId: build.id,
      type: 'test_conclusion',
      title: '测试结论登记',
      description: `测试结果: ${testConclusion.result === 'pass' ? '通过' : testConclusion.result === 'fail' ? '失败' : '阻塞'}`,
      timestamp: testConclusion.createdAt,
      userId: testConclusion.testerId,
      status: testConclusion.result,
    });
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

interface BuildState {
  builds: Build[];
  currentBuild: Build | null;
  selectedStage: BuildStage | null;
  isLoading: boolean;
  testConclusions: Record<string, TestConclusion>;
  rerunHistory: Record<string, { stageId: string; rerunTime: string }[]>;
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
  getTimeline: (buildId: string) => BuildTimelineEvent[];
}

export const useBuildStore = create<BuildState>((set, get) => ({
  builds: mockBuilds,
  currentBuild: null,
  selectedStage: null,
  isLoading: false,
  testConclusions: {},
  rerunHistory: {},

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
      rerunHistory: { ...state.rerunHistory, [buildId]: [] },
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

      const prevHistory = state.rerunHistory[buildId] || [];
      const newHistory = [...prevHistory, { stageId, rerunTime: now }];

      return {
        builds: updatedBuilds,
        currentBuild: updatedCurrentBuild,
        selectedStage: updatedSelectedStage,
        rerunHistory: { ...state.rerunHistory, [buildId]: newHistory },
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

  getTimeline: (buildId) => {
    const state = get();
    const build = state.builds.find((b) => b.id === buildId) || getBuildById(buildId);
    if (!build) return [];
    const testConclusion = state.testConclusions[buildId];
    const rerunHistory = state.rerunHistory[buildId] || [];
    return generateTimeline(build, testConclusion, rerunHistory);
  },
}));
