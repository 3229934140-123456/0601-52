import type { Statistics, TeamStat, DailyBuild, PipelineOwner } from '@/types';

function generateDailyBuilds(days: number): DailyBuild[] {
  const result: DailyBuild[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const count = Math.floor(Math.random() * 30) + 20;
    const successCount = Math.floor(count * (0.8 + Math.random() * 0.15));
    
    result.push({
      date: date.toISOString().split('T')[0],
      count,
      successCount,
    });
  }
  
  return result;
}

const teamStats: TeamStat[] = [
  {
    teamId: 'team-1',
    teamName: '前端团队',
    buildCount: 273,
    successCount: 256,
    successRate: 93.8,
    avgDuration: 245,
  },
  {
    teamId: 'team-2',
    teamName: '后端团队',
    buildCount: 457,
    successCount: 428,
    successRate: 93.7,
    avgDuration: 312,
  },
  {
    teamId: 'team-3',
    teamName: '测试团队',
    buildCount: 156,
    successCount: 142,
    successRate: 91.0,
    avgDuration: 520,
  },
  {
    teamId: 'team-4',
    teamName: '运维团队',
    buildCount: 198,
    successCount: 189,
    successRate: 95.5,
    avgDuration: 178,
  },
  {
    teamId: 'team-5',
    teamName: '产品团队',
    buildCount: 45,
    successCount: 43,
    successRate: 95.6,
    avgDuration: 89,
  },
];

const pipelineOwners: PipelineOwner[] = [
  {
    userId: 'user-1',
    userName: '张明',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming',
    pipelineCount: 3,
    buildCount: 206,
    successRate: 94.2,
  },
  {
    userId: 'user-3',
    userName: '王芳',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangfang',
    pipelineCount: 2,
    buildCount: 368,
    successRate: 92.7,
  },
  {
    userId: 'user-7',
    userName: '周洁',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhoujie',
    pipelineCount: 1,
    buildCount: 89,
    successRate: 88.8,
  },
  {
    userId: 'user-2',
    userName: '李华',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lihua',
    pipelineCount: 1,
    buildCount: 67,
    successRate: 95.5,
  },
  {
    userId: 'user-4',
    userName: '赵强',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoqiang',
    pipelineCount: 1,
    buildCount: 45,
    successRate: 91.1,
  },
  {
    userId: 'user-5',
    userName: '陈静',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenjing',
    pipelineCount: 1,
    buildCount: 156,
    successRate: 95.5,
  },
];

export const statistics: Statistics = {
  totalBuilds: 1129,
  successRate: 93.2,
  avgDuration: 267,
  teamStats,
  dailyBuilds: generateDailyBuilds(14),
  pipelineOwners,
};

export function getTeamStats(): TeamStat[] {
  return teamStats;
}

export function getDailyBuilds(days: number = 14): DailyBuild[] {
  return generateDailyBuilds(days);
}

export function getPipelineOwners(): PipelineOwner[] {
  return pipelineOwners;
}
