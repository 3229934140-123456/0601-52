import type { Pipeline, PipelineStage, PipelineStep, QualityGate } from '@/types';

const buildSteps: PipelineStep[] = [
  {
    id: 'step-build-1',
    name: '安装依赖',
    type: 'script',
    script: 'npm install',
    timeout: 300,
    dependencies: [],
  },
  {
    id: 'step-build-2',
    name: '代码编译',
    type: 'build',
    script: 'npm run build',
    timeout: 600,
    dependencies: ['step-build-1'],
  },
];

const testSteps: PipelineStep[] = [
  {
    id: 'step-test-1',
    name: '单元测试',
    type: 'test',
    script: 'npm run test:unit',
    timeout: 300,
    dependencies: [],
  },
  {
    id: 'step-test-2',
    name: '集成测试',
    type: 'test',
    script: 'npm run test:integration',
    timeout: 600,
    dependencies: ['step-test-1'],
  },
];

const lintSteps: PipelineStep[] = [
  {
    id: 'step-lint-1',
    name: '代码检查',
    type: 'lint',
    script: 'npm run lint',
    timeout: 120,
    dependencies: [],
  },
];

const deploySteps: PipelineStep[] = [
  {
    id: 'step-deploy-1',
    name: '部署到测试环境',
    type: 'deploy',
    script: 'npm run deploy:staging',
    timeout: 300,
    dependencies: [],
  },
];

export const qualityGate: QualityGate = {
  id: 'qg-1',
  name: '默认质量门禁',
  rules: [
    {
      id: 'qgr-1',
      name: '严重缺陷数',
      metric: 'critical_issues',
      operator: 'lte',
      threshold: 0,
      critical: true,
    },
    {
      id: 'qgr-2',
      name: '主要缺陷数',
      metric: 'major_issues',
      operator: 'lte',
      threshold: 10,
      critical: false,
    },
    {
      id: 'qgr-3',
      name: '代码覆盖率',
      metric: 'coverage',
      operator: 'gte',
      threshold: 80,
      critical: true,
    },
    {
      id: 'qgr-4',
      name: '重复代码率',
      metric: 'duplication',
      operator: 'lte',
      threshold: 5,
      critical: false,
    },
  ],
};

export const defaultStages: PipelineStage[] = [
  {
    id: 'stage-1',
    name: '代码检查',
    order: 1,
    steps: lintSteps,
  },
  {
    id: 'stage-2',
    name: '构建',
    order: 2,
    steps: buildSteps,
  },
  {
    id: 'stage-3',
    name: '测试',
    order: 3,
    steps: testSteps,
  },
  {
    id: 'stage-4',
    name: '部署',
    order: 4,
    steps: deploySteps,
  },
];

export const pipelines: Pipeline[] = [
  {
    id: 'pipeline-1',
    projectId: 'proj-1',
    name: '主分支流水线',
    ownerId: 'user-1',
    stages: defaultStages,
    qualityGate: qualityGate,
  },
  {
    id: 'pipeline-2',
    projectId: 'proj-2',
    name: '发布流水线',
    ownerId: 'user-3',
    stages: defaultStages,
    qualityGate: qualityGate,
  },
  {
    id: 'pipeline-3',
    projectId: 'proj-3',
    name: 'CI 流水线',
    ownerId: 'user-7',
    stages: [
      {
        id: 'stage-1',
        name: '代码检查',
        order: 1,
        steps: lintSteps,
      },
      {
        id: 'stage-2',
        name: '构建',
        order: 2,
        steps: buildSteps,
      },
      {
        id: 'stage-3',
        name: '测试',
        order: 3,
        steps: testSteps,
      },
    ],
    qualityGate: qualityGate,
  },
];

export function getPipelineById(id: string): Pipeline | undefined {
  return pipelines.find((p) => p.id === id);
}

export function getPipelineByProject(projectId: string): Pipeline | undefined {
  return pipelines.find((p) => p.projectId === projectId);
}
