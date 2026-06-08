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

function generateFailedLogs(stageId: string): BuildLog[] {
  const logs: BuildLog[] = [];
  const messages = [
    { level: 'info' as const, msg: 'Starting build process...' },
    { level: 'info' as const, msg: 'Checking cache for dependencies' },
    { level: 'info' as const, msg: 'Installing packages...' },
    { level: 'warn' as const, msg: 'Warning: deprecated package version' },
    { level: 'error' as const, msg: 'ERROR: Failed to compile - syntax error at line 42' },
    { level: 'error' as const, msg: 'ERROR: Build failed with exit code 1' },
  ];

  for (let i = 0; i < messages.length; i++) {
    const time = new Date();
    time.setSeconds(time.getSeconds() + i);
    logs.push({
      id: `log-${stageId}-${i}`,
      stageId,
      timestamp: time.toISOString(),
      level: messages[i].level,
      message: messages[i].msg,
    });
  }
  return logs;
}

interface RerunRecord {
  stageId: string;
  rerunTime: string;
  previousStatus: string;
  previousEndTime?: string;
  failureReason?: string;
  previousLogs: BuildLog[];
}

function generateTimeline(
  build: Build,
  testConclusion?: TestConclusion,
  rerunHistory?: RerunRecord[]
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

  const rerunStageIds = new Set(rerunHistory?.map((r) => r.stageId) || []);

  build.stages.forEach((stage) => {
    const stageStart = stage.startTime;
    const hasRerun = rerunStageIds.has(stage.id);

    if (stage.status === 'pending' && !hasRerun) {
      return;
    }

    if (stage.status !== 'pending' || hasRerun) {
      events.push({
        id: `${stage.id}-start`,
        buildId: build.id,
        type: 'stage_start',
        title: `${stage.stageName} 开始`,
        timestamp: stageStart,
        stageId: stage.id,
        status: stage.status,
      });
    }

    if (hasRerun && rerunHistory) {
      const stageReruns = rerunHistory.filter((r) => r.stageId === stage.id);
      stageReruns.forEach((rerun, idx) => {
        if (rerun.previousStatus === 'failed' && rerun.previousEndTime) {
          events.push({
            id: `${stage.id}-end-before-rerun-${idx}`,
            buildId: build.id,
            type: 'stage_end',
            title: `${stage.stageName} 失败（第${idx + 1}次）`,
            timestamp: rerun.previousEndTime,
            stageId: stage.id,
            status: 'failed',
          });

          events.push({
            id: `${stage.id}-failed-before-rerun-${idx}`,
            buildId: build.id,
            type: 'failed',
            title: `${stage.stageName} 执行失败`,
            description: rerun.failureReason || '阶段执行出现错误',
            timestamp: rerun.previousEndTime,
            stageId: stage.id,
          });
        }

        events.push({
          id: `${stage.id}-rerun-${idx}`,
          buildId: build.id,
          type: 'stage_rerun',
          title: `${stage.stageName} 重跑`,
          description: `第${idx + 1}次重跑`,
          timestamp: rerun.rerunTime,
          stageId: stage.id,
        });

        events.push({
          id: `${stage.id}-restart-${idx}`,
          buildId: build.id,
          type: 'stage_start',
          title: `${stage.stageName} 重新开始`,
          timestamp: rerun.rerunTime,
          stageId: stage.id,
          status: 'running',
        });
      });
    }

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
        const errorLog = stage.logs.find((l) => l.level === 'error');
        events.push({
          id: `${stage.id}-failed-evt`,
          buildId: build.id,
          type: 'failed',
          title: `${stage.stageName} 执行失败`,
          description: errorLog?.message || '阶段执行出现错误',
          timestamp: stageEnd,
          stageId: stage.id,
        });
      }
    }
  });

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

interface RerunRecord {
  stageId: string;
  rerunTime: string;
  previousStatus: string;
  previousEndTime?: string;
  failureReason?: string;
  previousLogs: BuildLog[];
}

interface BuildState {
  builds: Build[];
  currentBuild: Build | null;
  selectedStage: BuildStage | null;
  isLoading: boolean;
  testConclusions: Record<string, TestConclusion>;
  rerunHistory: Record<string, RerunRecord[]>;
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
  getStageLogsByVersion: (buildId: string, stageId: string, version?: number) => BuildLog[];
  getStageRerunCount: (buildId: string, stageId: string) => number;
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
      const build = state.builds.find((b) => b.id === buildId);
      const stage = build?.stages.find((s) => s.id === stageId);

      const prevStatus = stage?.status || 'pending';
      const prevEndTime = stage?.endTime;
      const prevLogs = stage?.logs || [];
      const errorLog = prevLogs.find((l) => l.level === 'error');
      const failureReason = errorLog?.message;

      const updatedBuilds = state.builds.map((b) => {
        if (b.id !== buildId) return b;
        const updatedStages = b.stages.map((s) =>
          s.id === stageId
            ? {
                ...s,
                status: 'running' as const,
                startTime: now,
                endTime: undefined,
                duration: undefined,
                logs: generateRunningLogs(s.id),
              }
            : s
        );
        return {
          ...b,
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
      const newHistory: RerunRecord[] = [
        ...prevHistory,
        {
          stageId,
          rerunTime: now,
          previousStatus: prevStatus,
          previousEndTime: prevEndTime,
          failureReason,
          previousLogs: prevLogs,
        },
      ];

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

  getStageLogsByVersion: (buildId, stageId, version) => {
    const state = get();
    const build = state.builds.find((b) => b.id === buildId) || getBuildById(buildId);
    const stage = build?.stages.find((s) => s.id === stageId);
    const rerunHistory = state.rerunHistory[buildId] || [];
    const stageReruns = rerunHistory.filter((r) => r.stageId === stageId);

    if (version === undefined || version === 0) {
      return stage?.logs || [];
    }

    if (version < 0) {
      const absVersion = Math.abs(version);
      if (absVersion > stageReruns.length) {
        return stage?.logs || [];
      }
      const rerunIndex = stageReruns.length - absVersion;
      return stageReruns[rerunIndex].previousLogs;
    }

    if (version > 0 && version <= stageReruns.length) {
      return stageReruns[version - 1].previousLogs;
    }

    return stage?.logs || [];
  },

  getStageRerunCount: (buildId, stageId) => {
    const state = get();
    const rerunHistory = state.rerunHistory[buildId] || [];
    return rerunHistory.filter((r) => r.stageId === stageId).length;
  },
}));
