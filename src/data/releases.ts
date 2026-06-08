import type { Release, Approval, ReleaseWindow, NotificationSubscription } from '@/types';
import { getDaysAgo } from '@/utils/date';

function createApprovals(releaseId: string, status: Release['status']): Approval[] {
  const approvals: Approval[] = [
    {
      id: `${releaseId}-app-1`,
      releaseId,
      approverId: 'user-4',
      level: 1,
      status: status === 'pending' ? 'pending' : status === 'rejected' ? 'rejected' : 'approved',
      comment: status === 'approved' ? '测试通过，同意发布' : status === 'rejected' ? '存在严重 bug，驳回' : '',
      approvedAt: status !== 'pending' ? getDaysAgo(status === 'rejected' ? 2 : 1) : undefined,
    },
    {
      id: `${releaseId}-app-2`,
      releaseId,
      approverId: 'user-6',
      level: 2,
      status: status === 'approved' || status === 'released' ? 'approved' : 'pending',
      comment: status === 'approved' || status === 'released' ? '同意发布' : '',
      approvedAt: status === 'approved' || status === 'released' ? getDaysAgo(0) : undefined,
    },
  ];
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
    approvals: createApprovals('release-1', 'released'),
    releaseWindow: {
      id: 'rw-1',
      name: '常规发布窗口',
      startTime: '2024-06-10T14:00:00.000Z',
      endTime: '2024-06-10T18:00:00.000Z',
      description: '每周二下午常规发布时间',
    },
    createdAt: getDaysAgo(3),
  },
  {
    id: 'release-2',
    projectId: 'proj-2',
    artifactId: 'art-3',
    title: '用户中心服务 v1.8.5 发布',
    description: '修复登录接口性能问题，优化缓存策略',
    applicantId: 'user-3',
    status: 'approved',
    approvals: createApprovals('release-2', 'approved'),
    releaseWindow: {
      id: 'rw-2',
      name: '紧急发布窗口',
      startTime: '2024-06-10T10:00:00.000Z',
      endTime: '2024-06-10T12:00:00.000Z',
      description: '紧急 bug 修复发布窗口',
    },
    createdAt: getDaysAgo(1),
  },
  {
    id: 'release-3',
    projectId: 'proj-3',
    artifactId: 'art-4',
    title: '支付网关 v3.1.0 发布',
    description: '新增微信支付渠道，优化对账流程',
    applicantId: 'user-7',
    status: 'pending',
    approvals: createApprovals('release-3', 'pending'),
    releaseWindow: {
      id: 'rw-3',
      name: '常规发布窗口',
      startTime: '2024-06-12T14:00:00.000Z',
      endTime: '2024-06-12T18:00:00.000Z',
      description: '每周四下午常规发布时间',
    },
    createdAt: getDaysAgo(0),
  },
  {
    id: 'release-4',
    projectId: 'proj-1',
    artifactId: 'art-2',
    title: '电商管理平台 v2.3.0 发布',
    description: '全新订单管理模块上线',
    applicantId: 'user-1',
    status: 'rejected',
    approvals: createApprovals('release-4', 'rejected'),
    createdAt: getDaysAgo(5),
  },
  {
    id: 'release-5',
    projectId: 'proj-4',
    artifactId: 'art-5',
    title: '移动端 App v1.2.3 发布',
    description: '修复推送通知问题，优化启动速度',
    applicantId: 'user-2',
    status: 'pending',
    approvals: createApprovals('release-5', 'pending'),
    releaseWindow: {
      id: 'rw-4',
      name: '应用商店审核',
      startTime: '2024-06-11T00:00:00.000Z',
      endTime: '2024-06-14T00:00:00.000Z',
      description: 'App Store 审核时间窗口',
    },
    createdAt: getDaysAgo(0),
  },
];

export const releaseWindows: ReleaseWindow[] = [
  {
    id: 'rw-1',
    name: '周二常规发布',
    startTime: '2024-06-10T14:00:00.000Z',
    endTime: '2024-06-10T18:00:00.000Z',
    description: '每周二下午 2-6 点常规发布窗口',
  },
  {
    id: 'rw-2',
    name: '周四常规发布',
    startTime: '2024-06-12T14:00:00.000Z',
    endTime: '2024-06-12T18:00:00.000Z',
    description: '每周四下午 2-6 点常规发布窗口',
  },
  {
    id: 'rw-3',
    name: '紧急发布窗口',
    startTime: '2024-06-09T10:00:00.000Z',
    endTime: '2024-06-09T12:00:00.000Z',
    description: '紧急 bug 修复专用窗口',
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
