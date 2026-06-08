import { create } from 'zustand';
import type { Release, ReleaseStatus, Approval, NotificationSubscription, ReleaseWindow } from '@/types';
import { releases as mockReleases, releaseWindows as mockWindows, notificationSubscriptions as mockSubs } from '@/data/releases';

interface ReleaseState {
  releases: Release[];
  releaseWindows: ReleaseWindow[];
  subscriptions: NotificationSubscription[];
  getReleasesByStatus: (status: ReleaseStatus | 'all') => Release[];
  getReleaseById: (id: string) => Release | undefined;
  submitRelease: (data: {
    projectId: string;
    artifactId: string;
    title: string;
    description: string;
    releaseWindowId?: string;
  }) => void;
  approveRelease: (releaseId: string, level: number, comment: string) => void;
  rejectRelease: (releaseId: string, level: number, comment: string) => void;
  toggleSubscription: (subId: string) => void;
  addSubscription: (sub: Omit<NotificationSubscription, 'id' | 'enabled'>) => void;
  removeSubscription: (subId: string) => void;
}

export const useReleaseStore = create<ReleaseState>((set, get) => ({
  releases: mockReleases,
  releaseWindows: mockWindows,
  subscriptions: mockSubs,
  
  getReleasesByStatus: (status) => {
    const list = status === 'all' 
      ? [...get().releases] 
      : get().releases.filter((r) => r.status === status);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  getReleaseById: (id) => {
    return get().releases.find((r) => r.id === id);
  },
  
  submitRelease: (data) => {
    const releaseId = `release-${Date.now()}`;
    const approvals: Approval[] = [
      {
        id: `${releaseId}-app-1`,
        releaseId,
        approverId: 'user-4',
        level: 1,
        status: 'pending',
        comment: '',
      },
      {
        id: `${releaseId}-app-2`,
        releaseId,
        approverId: 'user-6',
        level: 2,
        status: 'pending',
        comment: '',
      },
    ];
    
    const selectedWindow = data.releaseWindowId
      ? get().releaseWindows.find((w) => w.id === data.releaseWindowId)
      : undefined;
    
    const newRelease: Release = {
      id: releaseId,
      projectId: data.projectId,
      artifactId: data.artifactId,
      title: data.title,
      description: data.description,
      applicantId: 'user-1',
      status: 'pending',
      approvals,
      releaseWindow: selectedWindow,
      createdAt: new Date().toISOString(),
    };
    
    set((state) => ({
      releases: [newRelease, ...state.releases],
    }));
  },
  
  approveRelease: (releaseId, level, comment) => {
    const now = new Date().toISOString();
    set((state) => {
      const updatedReleases = state.releases.map((release) => {
        if (release.id !== releaseId) return release;
        
        const updatedApprovals = release.approvals.map((app) =>
          app.level === level
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
  
  rejectRelease: (releaseId, level, comment) => {
    const now = new Date().toISOString();
    set((state) => {
      const updatedReleases = state.releases.map((release) => {
        if (release.id !== releaseId) return release;
        
        const updatedApprovals = release.approvals.map((app) =>
          app.level === level
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
