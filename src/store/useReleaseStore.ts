import { create } from 'zustand';
import type { Release, ReleaseStatus, Approval, NotificationSubscription, ReleaseWindow } from '@/types';
import { releases as mockReleases, releaseWindows as mockWindows, notificationSubscriptions as mockSubs } from '@/data/releases';

interface ReleaseState {
  releases: Release[];
  releaseWindows: ReleaseWindow[];
  subscriptions: NotificationSubscription[];
  currentUserId: string;
  getReleasesByStatus: (status: ReleaseStatus | 'all') => Release[];
  getReleaseById: (id: string) => Release | undefined;
  getMyReleases: () => Release[];
  getPendingMyApproval: () => Release[];
  getCompletedReleases: () => Release[];
  submitRelease: (data: {
    projectId: string;
    artifactId: string;
    title: string;
    description: string;
    releaseWindowId?: string;
    approvers: string[];
  }) => void;
  approveRelease: (releaseId: string, comment: string) => void;
  rejectRelease: (releaseId: string, comment: string) => void;
  toggleSubscription: (subId: string) => void;
  addSubscription: (sub: Omit<NotificationSubscription, 'id' | 'enabled'>) => void;
  removeSubscription: (subId: string) => void;
  getNextApproval: (releaseId: string) => Approval | undefined;
  getCurrentApprovalLevel: (releaseId: string) => number;
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
      .filter((r) => r.status === 'approved' || r.status === 'rejected' || r.status === 'released')
      .filter((r) => {
        return r.applicantId === currentUserId ||
          r.approvals.some((a) => a.approverId === currentUserId);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  submitRelease: (data) => {
    const releaseId = `release-${Date.now()}`;
    const approvals: Approval[] = data.approvers.map((approverId, index) => ({
      id: `${releaseId}-app-${index + 1}`,
      releaseId,
      approverId,
      level: index + 1,
      status: index === 0 ? 'pending' : 'pending' as const,
      comment: '',
    }));

    const selectedWindow = data.releaseWindowId
      ? get().releaseWindows.find((w) => w.id === data.releaseWindowId)
      : undefined;

    const newRelease: Release = {
      id: releaseId,
      projectId: data.projectId,
      artifactId: data.artifactId,
      title: data.title,
      description: data.description,
      applicantId: get().currentUserId,
      status: 'pending',
      approvals,
      releaseWindow: selectedWindow,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      releases: [newRelease, ...state.releases],
    }));
  },

  approveRelease: (releaseId, comment) => {
    const now = new Date().toISOString();
    set((state) => {
      const updatedReleases = state.releases.map((release) => {
        if (release.id !== releaseId) return release;

        const pendingIndex = release.approvals.findIndex((a) => a.status === 'pending');
        if (pendingIndex === -1) return release;

        const updatedApprovals = release.approvals.map((app, index) =>
          index === pendingIndex
            ? { ...app, status: 'approved' as const, comment, approvedAt: now }
            : app
        );

        const allApproved = updatedApprovals.every((a) => a.status === 'approved');
        const newStatus: ReleaseStatus = allApproved ? 'approved' : release.status;

        return {
          ...release,
          status: newStatus,
          approvals: updatedApprovals,
        };
      });

      return { releases: updatedReleases };
    });
  },

  rejectRelease: (releaseId, comment) => {
    const now = new Date().toISOString();
    set((state) => {
      const updatedReleases = state.releases.map((release) => {
        if (release.id !== releaseId) return release;

        const pendingIndex = release.approvals.findIndex((a) => a.status === 'pending');
        if (pendingIndex === -1) return release;

        const updatedApprovals = release.approvals.map((app, index) =>
          index === pendingIndex
            ? { ...app, status: 'rejected' as const, comment, approvedAt: now }
            : app
        );

        return {
          ...release,
          status: 'rejected' as const,
          approvals: updatedApprovals,
        };
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
