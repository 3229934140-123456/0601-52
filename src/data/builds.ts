import type { Build, BuildStage, BuildLog } from '@/types';
import { getDaysAgo } from '@/utils/date';

function generateLogs(stageId: string, count: number): BuildLog[] {
  const logs: BuildLog[] = [];
  const messages = [
    'Starting build process...',
    'Checking cache for dependencies',
    'Installing npm packages',
    'added 1523 packages in 45s',
    'Compiling TypeScript files',
    'Bundling with Vite',
    '✓ 342 modules transformed.',
    'Building for production...',
    'Running ESLint',
    '✓ No lint errors found',
    'Running unit tests',
    'PASS: 128 passed, 0 failed',
    'Coverage: 85.3%',
    'Generating artifacts',
    'Build completed successfully',
  ];
  
  for (let i = 0; i < count; i++) {
    const time = new Date();
    time.setSeconds(time.getSeconds() + i * 2);
    logs.push({
      id: `log-${stageId}-${i}`,
      stageId,
      timestamp: time.toISOString(),
      level: i === count - 2 ? 'error' : i === count - 3 ? 'warn' : 'info',
      message: messages[i % messages.length],
    });
  }
  return logs;
}

function createBuildStages(buildId: string, status: Build['status']): BuildStage[] {
  const stages: BuildStage[] = [];
  const stageNames = ['代码检查', '构建', '测试', '部署'];
  const durations = [45, 120, 180, 90];
  
  let currentTime = new Date(getDaysAgo(0));
  
  for (let i = 0; i < stageNames.length; i++) {
    let stageStatus: BuildStage['status'] = 'success';
    
    if (status === 'failed' && i >= 2) {
      stageStatus = i === 2 ? 'failed' : 'pending';
    } else if (status === 'running' && i >= 1) {
      stageStatus = i === 1 ? 'running' : 'pending';
    } else if (status === 'pending') {
      stageStatus = 'pending';
    }
    
    const startTime = new Date(currentTime);
    const endTime = new Date(startTime.getTime() + durations[i] * 1000);
    
    stages.push({
      id: `${buildId}-stage-${i}`,
      buildId,
      stageName: stageNames[i],
      status: stageStatus,
      startTime: startTime.toISOString(),
      endTime: stageStatus === 'success' || stageStatus === 'failed' ? endTime.toISOString() : undefined,
      duration: stageStatus === 'success' || stageStatus === 'failed' ? durations[i] : undefined,
      logs: generateLogs(`${buildId}-stage-${i}`, 15),
    });
    
    if (stageStatus !== 'pending') {
      currentTime = endTime;
    }
  }
  
  return stages;
}

function createBuild(
  id: string,
  projectId: string,
  status: Build['status'],
  daysAgo: number,
  index: number
): Build {
  const startTime = new Date(getDaysAgo(daysAgo));
  startTime.setHours(10 + index, 30);
  
  const stages = createBuildStages(id, status);
  const totalDuration = stages.reduce((sum, s) => sum + (s.duration || 0), 0);
  const endTime = new Date(startTime.getTime() + totalDuration * 1000);
  
  return {
    id,
    projectId,
    pipelineId: 'pipeline-1',
    status,
    triggeredBy: 'user-1',
    triggerType: index % 3 === 0 ? 'push' : index % 3 === 1 ? 'manual' : 'schedule',
    commitHash: `a${Math.random().toString(36).substr(2, 6)}b${Math.random().toString(36).substr(2, 6)}`,
    commitMessage: [
      'feat: 添加用户认证功能',
      'fix: 修复登录页面样式问题',
      'refactor: 重构订单模块代码',
      'chore: 更新依赖版本',
      'test: 添加单元测试用例',
    ][index % 5],
    startTime: startTime.toISOString(),
    endTime: status === 'success' || status === 'failed' ? endTime.toISOString() : undefined,
    duration: status === 'success' || status === 'failed' ? totalDuration : undefined,
    stages,
  };
}

export const builds: Build[] = [
  createBuild('build-1', 'proj-1', 'success', 0, 0),
  createBuild('build-2', 'proj-1', 'success', 1, 1),
  createBuild('build-3', 'proj-1', 'failed', 2, 2),
  createBuild('build-4', 'proj-1', 'success', 3, 3),
  createBuild('build-5', 'proj-2', 'success', 0, 0),
  createBuild('build-6', 'proj-2', 'running', 0, 1),
  createBuild('build-7', 'proj-3', 'failed', 2, 0),
  createBuild('build-8', 'proj-4', 'running', 0, 0),
];

export function getBuildById(id: string): Build | undefined {
  return builds.find((b) => b.id === id);
}

export function getBuildsByProject(projectId: string): Build[] {
  return builds.filter((b) => b.projectId === projectId).sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}

export function getLatestBuild(projectId: string): Build | undefined {
  const projectBuilds = getBuildsByProject(projectId);
  return projectBuilds[0];
}
