import type { Artifact } from '@/types';
import { getDaysAgo } from '@/utils/date';

export const artifacts: Artifact[] = [
  {
    id: 'art-1',
    buildId: 'build-1',
    projectId: 'proj-1',
    name: 'ecommerce-admin',
    version: 'v2.3.1',
    size: 15728640,
    type: 'docker',
    uploadTime: getDaysAgo(0),
    uploader: 'user-1',
    downloadUrl: '/artifacts/art-1/download',
    metadata: {
      os: 'linux',
      arch: 'amd64',
      baseImage: 'node:18-alpine',
    },
  },
  {
    id: 'art-2',
    buildId: 'build-2',
    projectId: 'proj-1',
    name: 'ecommerce-admin',
    version: 'v2.3.0',
    size: 15482880,
    type: 'docker',
    uploadTime: getDaysAgo(1),
    uploader: 'user-1',
    downloadUrl: '/artifacts/art-2/download',
    metadata: {
      os: 'linux',
      arch: 'amd64',
      baseImage: 'node:18-alpine',
    },
  },
  {
    id: 'art-3',
    buildId: 'build-5',
    projectId: 'proj-2',
    name: 'user-center-service',
    version: 'v1.8.5',
    size: 52428800,
    type: 'jar',
    uploadTime: getDaysAgo(0),
    uploader: 'user-3',
    downloadUrl: '/artifacts/art-3/download',
    metadata: {
      jdkVersion: '17',
      framework: 'spring-boot',
    },
  },
  {
    id: 'art-4',
    buildId: 'build-7',
    projectId: 'proj-3',
    name: 'payment-gateway',
    version: 'v3.1.0',
    size: 48234496,
    type: 'jar',
    uploadTime: getDaysAgo(2),
    uploader: 'user-7',
    downloadUrl: '/artifacts/art-4/download',
    metadata: {
      jdkVersion: '17',
      framework: 'spring-boot',
    },
  },
  {
    id: 'art-5',
    buildId: 'build-8',
    projectId: 'proj-4',
    name: 'mobile-app-ios',
    version: 'v1.2.3',
    size: 104857600,
    type: 'ipa',
    uploadTime: getDaysAgo(0),
    uploader: 'user-2',
    downloadUrl: '/artifacts/art-5/download',
    metadata: {
      platform: 'ios',
      minVersion: '15.0',
    },
  },
  {
    id: 'art-6',
    buildId: 'build-8',
    projectId: 'proj-4',
    name: 'mobile-app-android',
    version: 'v1.2.3',
    size: 98566144,
    type: 'apk',
    uploadTime: getDaysAgo(0),
    uploader: 'user-2',
    downloadUrl: '/artifacts/art-6/download',
    metadata: {
      platform: 'android',
      minSdk: '26',
    },
  },
  {
    id: 'art-7',
    buildId: 'build-4',
    projectId: 'proj-1',
    name: 'ecommerce-admin',
    version: 'v2.2.9',
    size: 15204352,
    type: 'docker',
    uploadTime: getDaysAgo(3),
    uploader: 'user-1',
    downloadUrl: '/artifacts/art-7/download',
    metadata: {
      os: 'linux',
      arch: 'amd64',
      baseImage: 'node:18-alpine',
    },
  },
  {
    id: 'art-8',
    buildId: 'build-6',
    projectId: 'proj-2',
    name: 'user-center-service',
    version: 'v1.8.4',
    size: 51642368,
    type: 'jar',
    uploadTime: getDaysAgo(1),
    uploader: 'user-3',
    downloadUrl: '/artifacts/art-8/download',
    metadata: {
      jdkVersion: '17',
      framework: 'spring-boot',
    },
  },
];

export function getArtifactById(id: string): Artifact | undefined {
  return artifacts.find((a) => a.id === id);
}

export function getArtifactsByProject(projectId: string): Artifact[] {
  return artifacts
    .filter((a) => a.projectId === projectId)
    .sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime());
}

export function getArtifactsByBuild(buildId: string): Artifact[] {
  return artifacts.filter((a) => a.buildId === buildId);
}

export const artifactTypes = ['all', 'docker', 'jar', 'ipa', 'apk', 'npm'];
