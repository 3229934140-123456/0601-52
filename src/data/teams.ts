import type { Team, User } from '@/types';

export const teams: Team[] = [
  { id: 'team-1', name: '前端团队', memberCount: 12 },
  { id: 'team-2', name: '后端团队', memberCount: 15 },
  { id: 'team-3', name: '测试团队', memberCount: 8 },
  { id: 'team-4', name: '运维团队', memberCount: 5 },
  { id: 'team-5', name: '产品团队', memberCount: 6 },
];

export const users: User[] = [
  {
    id: 'user-1',
    name: '张明',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming',
    role: 'developer',
    teamId: 'team-1',
  },
  {
    id: 'user-2',
    name: '李华',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lihua',
    role: 'developer',
    teamId: 'team-1',
  },
  {
    id: 'user-3',
    name: '王芳',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangfang',
    role: 'developer',
    teamId: 'team-2',
  },
  {
    id: 'user-4',
    name: '赵强',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoqiang',
    role: 'tester',
    teamId: 'team-3',
  },
  {
    id: 'user-5',
    name: '陈静',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenjing',
    role: 'ops',
    teamId: 'team-4',
  },
  {
    id: 'user-6',
    name: '刘伟',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liuwei',
    role: 'manager',
    teamId: 'team-5',
  },
  {
    id: 'user-7',
    name: '周洁',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhoujie',
    role: 'developer',
    teamId: 'team-2',
  },
  {
    id: 'user-8',
    name: '吴磊',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wulei',
    role: 'tester',
    teamId: 'team-3',
  },
];

export function getTeamById(id: string): Team | undefined {
  return teams.find((t) => t.id === id);
}

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function getUsersByTeam(teamId: string): User[] {
  return users.filter((u) => u.teamId === teamId);
}
