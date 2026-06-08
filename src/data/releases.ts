import type { Release, Approval, ReleaseWindow, NotificationSubscription, AuditLog, EnvironmentType } from '@/types';
import { getDaysAgo } from '@/utils/date';
import { getUserById } from './teams';

function createAuditLogs(releaseId: string, status: Release['status'], environment: EnvironmentType): AuditLog[] {
  const logs: AuditLog[] = [];
  const applicant = getUserById('user-1');

  logs.push({
    id: `${releaseId}-audit-1`,
    releaseId,
    action: 'submit',
    userId: 'user-1',
    userName: applicant?.name || '未知用户',
    description: '提交发布申请',
    timestamp: getDaysAgo(3),
    details: { environment },
  });

  if (status !== 'pending') {
    const approver1 = getUserById('user-4');
    logs.push({
      id: `${releaseId}-audit-2`,
      releaseId,
      action: status === 'rejected' ? 'reject' : 'approve',
      userId: 'user-4',
      userName: approver1?.name || '未知用户',
      description: status === 'rejected' ? '驳回发布申请' : '通过第1级审批',
      timestamp: getDaysAgo(2),
      details: { level: '1', comment: status === 'rejected' ? '存在严重 bug，驳回' : '测试通过，同意发布' },
    });
  }

  if (status === 'approved' || status === 'released' || status === 'rolled_back') {
    const approver2 = getUserById('user-6');
    logs.push({
      id: `${releaseId}-audit-3`,
      releaseId,
      action: 'approve',
      userId: 'user-6',
      userName: approver2?.name || '未知用户',
      description: '通过第2级审批',
      timestamp: getDaysAgo(1),
      details: { level: '2', comment: '同意发布' },
    });
  }

  if (status === 'released') {
    const releaser = getUserById('user-1');
    logs.push({
      id: `${releaseId}-audit-4`,
      releaseId,
      action: 'release',
      userId: 'user-1',
      userName: releaser?.name || '未知用户',
      description: '标记为已发布',
      timestamp: getDaysAgo(0),
    });
  }

  if (status === 'rolled_back') {
    const releaser = getUserById('user-1');
    logs.push({
      id: `${releaseId}-audit-4`,
      releaseId,
      action: 'release',
      userId: 'user-1',
      userName: releaser?.name || '未知用户',
      description: '标记为已发布',
      timestamp: getDaysAgo(0),
    });
    logs.push({
      id: `${releaseId}-audit-5`,
      releaseId,
      action: 'rollback',
      userId: 'user-1',
      userName: releaser?.name || '未知用户',
      description: '回滚发布',
      timestamp: getDaysAgo(0),
      details: { reason: '发现线上问题，紧急回滚' },
    });
  }

  return logs;
}

function createApprovals(releaseId: string, status: Release['status'], environment: EnvironmentType): Approval[] {
  const approvals: Approval[] = [];

  const levelCount = environment === 'production' ? 3 : 2;

  for (let i = 1; i <= levelCount; i++) {
    let approvalStatus: Approval['status'] = 'pending';
    let comment = '';
    let approvedAt: string | undefined = undefined;

    if (status === 'approved' || status === 'released' || status === 'rolled_back') {
      approvalStatus = 'approved';
      comment = i === 1 ? '测试通过，同意发布' : '同意发布';
      approvedAt = getDaysAgo(levelCount - i);
    } else if (status === 'rejected') {
      if (i === 1) {
        approvalStatus = 'rejected';
        comment = '存在严重 bug，驳回';
        approvedAt = getDaysAgo(2);
      } else {
        approvalStatus = 'pending';
      }
    } else {
      approvalStatus = i === 1 ? 'pending' : 'pending';
    }

    const approverId = i === 1 ? 'user-4' : i === 2 ? 'user-6' : 'user-2';

    approvals.push({
      id: `${releaseId}-app-${i}`,
      releaseId,
      approverId,
      level: i,
      status: approvalStatus,
      comment,
      approvedAt,
    });
  }

  return approvals;
}

export const releases: Release[] = [
  {
    id: 'release-1',
    projectId: 'proj-1',
    artifactId: 'art-1',
    title: '电商管理平台 v2.3.1 发布',
    description: '本次发布包含用户认证功能优化和若干 bug 修复',
    applicantId: 'user-1',
    status: 'released',
    environment: 'production',
    approvals: createApprovals('release-1', 'released', 'production'),
    releaseWindow: {
      id: 'rw-1',
      name: '生产常规发布窗口',
      environment: 'production',
      startTime: '2024-06-10T14:00:00.000Z',
      endTime: '2024-06-10T18:00:00.000Z',
      description: '每周二下午常规发布时间',
    },
    auditLogs: createAuditLogs('release-1', 'released', 'production'),
    releasedAt: getDaysAgo(0),
    createdAt: getDaysAgo(3),
  },
  {
    id: 'release-2',
    projectId: 'proj-2',
    artifactId: 'art-3',
    title: '用户中心服务 v1.8.5 预发发布',
    description: '修复登录接口性能问题，优化缓存策略',
    applicantId: 'user-3',
    status: 'approved',
    environment: 'staging',
    approvals: createApprovals('release-2', 'approved', 'staging'),
    releaseWindow: {
      id: 'rw-2',
      name: '预发紧急发布窗口',
      environment: 'staging',
      startTime: '2024-06-10T10:00:00.000Z',
      endTime: '2024-06-10T12:00:00.000Z',
      description: '紧急 bug 修复发布窗口',
    },
    auditLogs: createAuditLogs('release-2', 'approved', 'staging'),
    createdAt: getDaysAgo(1),
  },
  {
    id: 'release-3',
    projectId: 'proj-3',
    artifactId: 'art-4',
    title: '支付网关 v3.1.0 生产发布',
    description: '新增微信支付渠道，优化对账流程',
    applicantId: 'user-7',
    status: 'pending',
    environment: 'production',
    approvals: createApprovals('release-3', 'pending', 'production'),
    releaseWindow: {
      id: 'rw-3',
      name: '生产常规发布窗口',
      environment: 'production',
      startTime: '2024-06-12T14:00:00.000Z',
      endTime: '2024-06-12T18:00:00.000Z',
      description: '每周四下午常规发布时间',
    },
    auditLogs: createAuditLogs('release-3', 'pending', 'production'),
    createdAt: getDaysAgo(0),
  },
  {
    id: 'release-4',
    projectId: 'proj-1',
    artifactId: 'art-2',
    title: '电商管理平台 v2.3.0 测试发布',
    description: '全新订单管理模块上线',
    applicantId: 'user-1',
    status: 'rejected',
    environment: 'test',
    approvals: createApprovals('release-4', 'rejected', 'test'),
    auditLogs: createAuditLogs('release-4', 'rejected', 'test'),
    createdAt: getDaysAgo(5),
  },
  {
    id: 'release-5',
    projectId: 'proj-4',
    artifactId: 'art-5',
    title: '移动端 App v1.2.3 测试发布',
    description: '修复推送通知问题，优化启动速度',
    applicantId: 'user-2',
    status: 'pending',
    environment: 'test',
    approvals: createApprovals('release-5', 'pending', 'test'),
    releaseWindow: {
      id: 'rw-4',
      name: '测试环境发布窗口',
      environment: 'test',
      startTime: '2024-06-11T00:00:00.000Z',
      endTime: '2024-06-14T00:00:00.000Z',
      description: '测试环境随时可发布',
    },
    auditLogs: createAuditLogs('release-5', 'pending', 'test'),
    createdAt: getDaysAgo(0),
  },
  {
    id: 'release-6',
    projectId: 'proj-2',
    artifactId: 'art-6',
    title: '用户中心 v1.8.4 回滚',
    description: '发现线上问题紧急回滚',
    applicantId: 'user-1',
    status: 'rolled_back',
    environment: 'production',
    approvals: createApprovals('release-6', 'rolled_back', 'production'),
    auditLogs: createAuditLogs('release-6', 'rolled_back', 'production'),
    releasedAt: getDaysAgo(1),
    rollbackReason: '发现线上问题，紧急回滚',
    rolledBackAt: getDaysAgo(0),
    createdAt: getDaysAgo(4),
  },
];

export const releaseWindows: ReleaseWindow[] = [
  {
    id: 'rw-test-1',
    name: '测试环境常规发布',
    environment: 'test',
    startTime: '2024-06-10T09:00:00.000Z',
    endTime: '2024-06-10T18:00:00.000Z',
    description: '测试环境工作日全天可发布',
  },
  {
    id: 'rw-staging-1',
    name: '预发环境常规发布',
    environment: 'staging',
    startTime: '2024-06-10T10:00:00.000Z',
    endTime: '2024-06-10T17:00:00.000Z',
    description: '预发环境工作日发布窗口',
  },
  {
    id: 'rw-prod-1',
    name: '周二生产常规发布',
    environment: 'production',
    startTime: '2024-06-11T14:00:00.000Z',
    endTime: '2024-06-11T18:00:00.000Z',
    description: '每周二下午 2-6 点生产发布窗口',
  },
  {
    id: 'rw-prod-2',
    name: '周四生产常规发布',
    environment: 'production',
    startTime: '2024-06-13T14:00:00.000Z',
    endTime: '2024-06-13T18:00:00.000Z',
    description: '每周四下午 2-6 点生产发布窗口',
  },
  {
    id: 'rw-prod-3',
    name: '生产紧急发布',
    environment: 'production',
    startTime: '2024-06-10T00:00:00.000Z',
    endTime: '2024-06-30T23:59:59.000Z',
    description: '紧急问题修复专用发布窗口',
    isFreeze: true,
    freezeReason: '大促期间生产冻结',
  },
];

export const notificationSubscriptions: NotificationSubscription[] = [
  {
    id: 'sub-1',
    userId: 'user-1',
    eventType: 'build_failed',
    channel: 'email',
    target: 'zhangming@example.com',
    enabled: true,
  },
  {
    id: 'sub-2',
    userId: 'user-1',
    eventType: 'release_approved',
    channel: 'in_app',
    target: 'in_app',
    enabled: true,
  },
  {
    id: 'sub-3',
    userId: 'user-3',
    eventType: 'build_failed',
    channel: 'webhook',
    target: 'https://hooks.example.com/build-failed',
    enabled: true,
  },
];

export function getReleaseById(id: string): Release | undefined {
  return releases.find((r) => r.id === id);
}

export function getReleasesByProject(projectId: string): Release[] {
  return releases
    .filter((r) => r.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getReleaseByStatus(status: Release['status'] | 'all'): Release[] {
  if (status === 'all') {
    return [...releases].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return releases
    .filter((r) => r.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getReleaseWindowsByEnvironment(env: EnvironmentType): ReleaseWindow[] {
  return releaseWindows.filter((w) => w.environment === env);
}
