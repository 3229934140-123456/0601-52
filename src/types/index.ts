export interface Team {
  id: string;
  name: string;
  memberCount: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'developer' | 'tester' | 'ops' | 'manager';
  teamId: string;
}

export type BuildStatus = 'success' | 'failed' | 'running' | 'pending' | 'cancelled';
export type StageStatus = 'success' | 'failed' | 'running' | 'pending' | 'skipped';
export type ReleaseStatus = 'pending' | 'approved' | 'rejected' | 'released';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type Severity = 'critical' | 'major' | 'minor' | 'info';
export type IssueType = 'bug' | 'vulnerability' | 'code_smell' | 'duplication';
export type IssueStatus = 'open' | 'fixed' | 'false_positive';

export interface Project {
  id: string;
  name: string;
  description: string;
  teamId: string;
  ownerId: string;
  repoUrl: string;
  buildCount: number;
  lastBuildStatus: BuildStatus;
  lastBuildTime: string;
  createdAt: string;
}

export interface Pipeline {
  id: string;
  projectId: string;
  name: string;
  ownerId: string;
  stages: PipelineStage[];
  qualityGate: QualityGate;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  steps: PipelineStep[];
}

export interface PipelineStep {
  id: string;
  name: string;
  type: 'build' | 'test' | 'lint' | 'deploy' | 'script';
  script: string;
  timeout: number;
  dependencies: string[];
}

export interface QualityGate {
  id: string;
  name: string;
  rules: QualityGateRule[];
}

export interface QualityGateRule {
  id: string;
  name: string;
  metric: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  threshold: number;
  critical: boolean;
  actualValue?: number;
  passed?: boolean;
}

export interface Build {
  id: string;
  projectId: string;
  pipelineId: string;
  status: BuildStatus;
  triggeredBy: string;
  triggerType: 'manual' | 'push' | 'schedule';
  commitHash: string;
  commitMessage: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  stages: BuildStage[];
}

export interface BuildStage {
  id: string;
  buildId: string;
  stageName: string;
  status: StageStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  logs: BuildLog[];
}

export interface BuildLog {
  id: string;
  stageId: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface CodeIssue {
  id: string;
  buildId: string;
  file: string;
  line: number;
  severity: Severity;
  type: IssueType;
  message: string;
  rule: string;
  status: IssueStatus;
}

export interface Artifact {
  id: string;
  buildId: string;
  projectId: string;
  name: string;
  version: string;
  size: number;
  type: string;
  uploadTime: string;
  uploader: string;
  downloadUrl: string;
  metadata: Record<string, string>;
}

export interface Release {
  id: string;
  projectId: string;
  artifactId: string;
  title: string;
  description: string;
  applicantId: string;
  status: ReleaseStatus;
  approvals: Approval[];
  releaseWindow?: ReleaseWindow;
  createdAt: string;
}

export interface Approval {
  id: string;
  releaseId: string;
  approverId: string;
  level: number;
  status: ApprovalStatus;
  comment: string;
  approvedAt?: string;
}

export interface ReleaseWindow {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description: string;
}

export interface Statistics {
  totalBuilds: number;
  successRate: number;
  avgDuration: number;
  teamStats: TeamStat[];
  dailyBuilds: DailyBuild[];
  pipelineOwners: PipelineOwner[];
}

export interface TeamStat {
  teamId: string;
  teamName: string;
  buildCount: number;
  successCount: number;
  successRate: number;
  avgDuration: number;
}

export interface DailyBuild {
  date: string;
  count: number;
  successCount: number;
}

export interface PipelineOwner {
  userId: string;
  userName: string;
  userAvatar: string;
  pipelineCount: number;
  buildCount: number;
  successRate: number;
}

export interface NotificationSubscription {
  id: string;
  userId: string;
  eventType: 'build_failed' | 'release_approved' | 'release_rejected';
  channel: 'email' | 'webhook' | 'in_app';
  target: string;
  enabled: boolean;
}
