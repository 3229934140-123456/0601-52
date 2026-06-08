import { create } from 'zustand';
import type {
  Release,
  ReleaseStatus,
  Approval,
  NotificationSubscription,
  ReleaseWindow,
  EnvironmentType,
  AuditLog,
  AuditActionType,
} from '@/types';
import {
  releases as mockReleases,
  releaseWindows as mockWindows,
  notificationSubscriptions as mockSubs,
  getReleaseWindowsByEnvironment,
} from '@/data/releases';
import { getUserById } from '@/data/teams';

function addAuditLog(
  release: Release,
  action: AuditActionType,
  userId: string,
  description: string,
  details?: Record<string, string>
): Release {
  const user = getUserById(userId);
  const newLog: AuditLog = {
    id: `${release.id}-audit-${Date.now()}`,
    releaseId: release.id,
    action,
    userId,
    userName: user?.name || '未知用户',
    description,
    timestamp: new Date().toISOString(),
    details,
  };
  return {
    ...release,
    auditLogs: [...release.auditLogs, newLog],
  };
}

interface ReleaseState {
  releases: Release[];
  releaseWindows: ReleaseWindow[];
  subscriptions: NotificationSubscription[];
  currentUserId: string;

  getReleasesByStatus: (status: ReleaseStatus | 'all') => Release[];
  getReleasesByEnvironment: (env: EnvironmentType | 'all') => Release[];
  getFilteredReleases: (filters: {
    status?: ReleaseStatus | 'all';
    environment?: EnvironmentType | 'all';
  }) => Release[];
  getReleaseById: (id: string) => Release | undefined;
  getMyReleases: () => Release[];
  getPendingMyApproval: () => Release[];
  getCompletedReleases: () => Release[];
  getReleaseWindowsByEnv: (env: EnvironmentType) => ReleaseWindow[];
  getNextApproval: (releaseId: string) => Approval | undefined;
  getCurrentApprovalLevel: (releaseId: string) => number;
  canApprove: (releaseId: string) => boolean;
  canRelease: (releaseId: string) => boolean;
  canRollback: (releaseId: string) => boolean;

  submitRelease: (data: {
    projectId: string;
    artifactId: string;
    title: string;
    description: string;
    environment: EnvironmentType;
    releaseWindowId?: string;
    approvers: string[];
  }) => void;
  approveRelease: (releaseId: string, comment: string) => void;
  rejectRelease: (releaseId: string, comment: string) => void;
  markAsReleased: (releaseId: string) => void;
  rollbackRelease: (releaseId: string, reason: string) => void;
  recordDownloadArtifact: (releaseId: string) => void;

  toggleSubscription: (subId: string) => void;
  addSubscription: (sub: Omit<NotificationSubscription, 'id' | 'enabled'>) => void;
  removeSubscription: (subId: string) => void;
}

export const useReleaseStore = create<ReleaseState>((set, get) => ({
  releases: mockReleases,
  releaseWindows: mockWindows,
  subscriptions: mockSubs,
  currentUserId: 'user-1',

  getReleasesByStatus: (status) => {
    const list = status === 'all'
      ? [...get().releases]
      : get().releases.filter((r) => r.status === status);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getReleasesByEnvironment: (env) => {
    const list = env === 'all'
      ? [...get().releases]
      : get().releases.filter((r) => r.environment === env);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getFilteredReleases: (filters) => {
    let list = [...get().releases];
    if (filters.status && filters.status !== 'all') {
      list = list.filter((r) => r.status === filters.status);
    }
    if (filters.environment && filters.environment !== 'all') {
      list = list.filter((r) => r.environment === filters.environment);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getReleaseById: (id) => {
    return get().releases.find((r) => r.id === id);
  },

  getMyReleases: () => {
    const { releases, currentUserId } = get();
    return releases
      .filter((r) => r.applicantId === currentUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getPendingMyApproval: () => {
    const { releases, currentUserId } = get();
    return releases
      .filter((r) => {
        if (r.status !== 'pending') return false;
        const pendingApproval = r.approvals.find((a) => a.status === 'pending');
        return pendingApproval?.approverId === currentUserId;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getCompletedReleases: () => {
    const { releases, currentUserId } = get();
    return releases
      .filter((r) => r.status === 'approved' || r.status === 'rejected' || r.status === 'released' || r.status === 'rolled_back')
      .filter((r) => {
        return r.applicantId === currentUserId ||
          r.approvals.some((a) => a.approverId === currentUserId);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getReleaseWindowsByEnv: (env) => {
    return getReleaseWindowsByEnvironment(env);
  },

  getNextApproval: (releaseId) => {
    const release = get().getReleaseById(releaseId);
    if (!release) return undefined;
    return release.approvals.find((a) => a.status === 'pending');
  },

  getCurrentApprovalLevel: (releaseId) => {
    const release = get().getReleaseById(releaseId);
    if (!release) return 0;
    const approvedCount = release.approvals.filter((a) => a.status === 'approved').length;
    return approvedCount + 1;
  },

  canApprove: (releaseId) => {
    const { currentUserId } = get();
    const release = get().getReleaseById(releaseId);
    if (!release || release.status !== 'pending') return false;
    const nextApproval = release.approvals.find((a) => a.status === 'pending');
    return nextApproval?.approverId === currentUserId;
  },

  canRelease: (releaseId) => {
    const release = get().getReleaseById(releaseId);
    if (!release) return false;
    return release.status === 'approved';
  },

  canRollback: (releaseId) => {
    const release = get().getReleaseById(releaseId);
    if (!release) return false;
    return release.status === 'released';
  },

  submitRelease: (data) => {
    const releaseId = `release-${Date.now()}`;
    const now = new Date().toISOString();
    const { currentUserId } = get();

    const approvals: Approval[] = data.approvers.map((approverId, index) => ({
      id: `${releaseId}-app-${index + 1}`,
      releaseId,
      approverId,
      level: index + 1,
      status: 'pending' as const,
      comment: '',
    }));

    const selectedWindow = data.releaseWindowId
      ? get().releaseWindows.find((w) => w.id === data.releaseWindowId)
      : undefined;

    const applicant = getUserById(currentUserId);

    const auditLogs: AuditLog[] = [
      {
        id: `${releaseId}-audit-1`,
        releaseId,
        action: 'submit',
        userId: currentUserId,
        userName: applicant?.name || '未知用户',
        description: '提交发布申请',
        timestamp: now,
        details: { environment: data.environment },
      },
    ];

    const newRelease: Release = {
      id: releaseId,
      projectId: data.projectId,
      artifactId: data.artifactId,
      title: data.title,
      description: data.description,
      applicantId: currentUserId,
      status: 'pending',
      environment: data.environment,
      approvals,
      releaseWindow: selectedWindow,
      auditLogs,
      createdAt: now,
    };

    set((state) => ({
      releases: [newRelease, ...state.releases],
    }));
  },

  approveRelease: (releaseId, comment) => {
    const now = new Date().toISOString();
    const { currentUserId } = get();
    const approver = getUserById(currentUserId);

    set((state) => {
      const updatedReleases = state.releases.map((release) => {
        if (release.id !== releaseId) return release;

        const pendingIndex = release.approvals.findIndex((a) => a.status === 'pending');
        if (pendingIndex === -1) return release;

        const pendingApproval = release.approvals[pendingIndex];
        if (pendingApproval.approverId !== currentUserId) return release;

        const updatedApprovals = release.approvals.map((app, index) =>
          index === pendingIndex
            ? { ...app, status: 'approved' as const, comment, approvedAt: now }
            : app
        );

        const allApproved = updatedApprovals.every((a) => a.status === 'approved');
        const newStatus: ReleaseStatus = allApproved ? 'approved' : release.status;

        let updatedRelease: Release = {
          ...release,
          status: newStatus,
          approvals: updatedApprovals,
        };

        updatedRelease = addAuditLog(
          updatedRelease,
          'approve',
          currentUserId,
          `通过第${pendingIndex + 1}级审批`,
          { level: String(pendingIndex + 1), comment }
        );

        if (allApproved && approver) {
          updatedRelease = addAuditLog(
            updatedRelease,
            'approve',
            currentUserId,
            '全部审批通过',
            { totalLevels: String(updatedApprovals.length) }
          );
        }

        return updatedRelease;
      });

      return { releases: updatedReleases };
    });
  },

  rejectRelease: (releaseId, comment) => {
    const now = new Date().toISOString();
    const { currentUserId } = get();

    set((state) => {
      const updatedReleases = state.releases.map((release) => {
        if (release.id !== releaseId) return release;

        const pendingIndex = release.approvals.findIndex((a) => a.status === 'pending');
        if (pendingIndex === -1) return release;

        const pendingApproval = release.approvals[pendingIndex];
        if (pendingApproval.approverId !== currentUserId) return release;

        const updatedApprovals = release.approvals.map((app, index) =>
          index === pendingIndex
            ? { ...app, status: 'rejected' as const, comment, approvedAt: now }
            : app
        );

        let updatedRelease: Release = {
          ...release,
          status: 'rejected' as const,
          approvals: updatedApprovals,
        };

        updatedRelease = addAuditLog(
          updatedRelease,
          'reject',
          currentUserId,
          '驳回发布申请',
          { level: String(pendingIndex + 1), comment }
        );

        return updatedRelease;
      });

      return { releases: updatedReleases };
    });
  },

  markAsReleased: (releaseId) => {
    const now = new Date().toISOString();
    const { currentUserId } = get();

    set((state) => {
      const updatedReleases = state.releases.map((release) => {
        if (release.id !== releaseId) return release;
        if (release.status !== 'approved') return release;

        let updatedRelease: Release = {
          ...release,
          status: 'released' as const,
          releasedAt: now,
        };

        updatedRelease = addAuditLog(
          updatedRelease,
          'release',
          currentUserId,
          '标记为已发布'
        );

        return updatedRelease;
      });

      return { releases: updatedReleases };
    });
  },

  rollbackRelease: (releaseId, reason) => {
    const now = new Date().toISOString();
    const { currentUserId } = get();

    set((state) => {
      const updatedReleases = state.releases.map((release) => {
        if (release.id !== releaseId) return release;
        if (release.status !== 'released') return release;

        let updatedRelease: Release = {
          ...release,
          status: 'rolled_back' as const,
          rollbackReason: reason,
          rolledBackAt: now,
        };

        updatedRelease = addAuditLog(
          updatedRelease,
          'rollback',
          currentUserId,
          '回滚发布',
          { reason }
        );

        return updatedRelease;
      });

      return { releases: updatedReleases };
    });
  },

  recordDownloadArtifact: (releaseId) => {
    const { currentUserId } = get();

    set((state) => {
      const updatedReleases = state.releases.map((release) => {
        if (release.id !== releaseId) return release;

        const updatedRelease = addAuditLog(
          release,
          'download_artifact',
          currentUserId,
          '下载制品'
        );

        return updatedRelease;
      });

      return { releases: updatedReleases };
    });
  },

  toggleSubscription: (subId) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((sub) =>
        sub.id === subId ? { ...sub, enabled: !sub.enabled } : sub
      ),
    }));
  },

  addSubscription: (subData) => {
    const newSub: NotificationSubscription = {
      ...subData,
      id: `sub-${Date.now()}`,
      enabled: true,
    };

    set((state) => ({
      subscriptions: [...state.subscriptions, newSub],
    }));
  },

  removeSubscription: (subId) => {
    set((state) => ({
      subscriptions: state.subscriptions.filter((s) => s.id !== subId),
    }));
  },
}));
