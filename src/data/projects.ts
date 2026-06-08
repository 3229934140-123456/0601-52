import type { Project, BuildStatus } from '@/types';
import { getDaysAgo } from '@/utils/date';

export const projects: Project[] = [
  {
    id: 'proj-1',
    name: '电商管理平台',
    description: '电商后台管理系统，包含订单、商品、用户管理等模块',
    teamId: 'team-1',
    ownerId: 'user-1',
    repoUrl: 'https://git.example.com/team1/ecommerce-admin',
    buildCount: 128,
    lastBuildStatus: 'success',
    lastBuildTime: getDaysAgo(0),
    createdAt: getDaysAgo(180),
  },
  {
    id: 'proj-2',
    name: '用户中心服务',
    description: '用户中心微服务，提供用户认证、权限管理等功能',
    teamId: 'team-2',
    ownerId: 'user-3',
    repoUrl: 'https://git.example.com/team2/user-center',
    buildCount: 256,
    lastBuildStatus: 'success',
    lastBuildTime: getDaysAgo(1),
    createdAt: getDaysAgo(200),
  },
  {
    id: 'proj-3',
    name: '支付网关',
    description: '统一支付网关服务，支持多种支付渠道',
    teamId: 'team-2',
    ownerId: 'user-7',
    repoUrl: 'https://git.example.com/team2/payment-gateway',
    buildCount: 89,
    lastBuildStatus: 'failed',
    lastBuildTime: getDaysAgo(2),
    createdAt: getDaysAgo(150),
  },
  {
    id: 'proj-4',
    name: '移动端 App',
    description: '移动端原生应用，iOS 和 Android 双端',
    teamId: 'team-1',
    ownerId: 'user-2',
    repoUrl: 'https://git.example.com/team1/mobile-app',
    buildCount: 67,
    lastBuildStatus: 'running',
    lastBuildTime: getDaysAgo(0),
    createdAt: getDaysAgo(120),
  },
  {
    id: 'proj-5',
    name: '数据分析平台',
    description: '大数据分析平台，提供实时报表和数据可视化',
    teamId: 'team-3',
    ownerId: 'user-4',
    repoUrl: 'https://git.example.com/team3/data-analytics',
    buildCount: 45,
    lastBuildStatus: 'success',
    lastBuildTime: getDaysAgo(3),
    createdAt: getDaysAgo(90),
  },
  {
    id: 'proj-6',
    name: '消息推送服务',
    description: '统一消息推送服务，支持短信、邮件、App 推送',
    teamId: 'team-2',
    ownerId: 'user-3',
    repoUrl: 'https://git.example.com/team2/message-service',
    buildCount: 112,
    lastBuildStatus: 'pending',
    lastBuildTime: getDaysAgo(1),
    createdAt: getDaysAgo(160),
  },
  {
    id: 'proj-7',
    name: '运营后台',
    description: '运营管理后台，包含活动管理、内容管理等功能',
    teamId: 'team-1',
    ownerId: 'user-1',
    repoUrl: 'https://git.example.com/team1/operation-admin',
    buildCount: 78,
    lastBuildStatus: 'success',
    lastBuildTime: getDaysAgo(0),
    createdAt: getDaysAgo(100),
  },
  {
    id: 'proj-8',
    name: 'API 网关',
    description: '统一 API 网关，提供路由、限流、鉴权等功能',
    teamId: 'team-4',
    ownerId: 'user-5',
    repoUrl: 'https://git.example.com/team4/api-gateway',
    buildCount: 156,
    lastBuildStatus: 'success',
    lastBuildTime: getDaysAgo(2),
    createdAt: getDaysAgo(250),
  },
];

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function getProjectsByTeam(teamId: string): Project[] {
  return projects.filter((p) => p.teamId === teamId);
}

export function getProjectsByOwner(ownerId: string): Project[] {
  return projects.filter((p) => p.ownerId === ownerId);
}

export function searchProjects(keyword: string): Project[] {
  const lower = keyword.toLowerCase();
  return projects.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower)
  );
}

export function filterProjectsByStatus(status: BuildStatus | 'all'): Project[] {
  if (status === 'all') return projects;
  return projects.filter((p) => p.lastBuildStatus === status);
}
