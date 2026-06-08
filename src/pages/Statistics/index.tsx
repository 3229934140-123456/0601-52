import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  GitBranch,
  BarChart,
  LineChart,
  PieChart,
} from 'lucide-react';
import {
  BarChart as ReBarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/common/Card';
import { Tabs } from '@/components/common/Tabs';
import { statistics } from '@/data/statistics';
import { formatDuration, formatNumber } from '@/utils/format';
import { formatPercent } from '@/utils/format';
import { cn } from '@/lib/utils';

export function Statistics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const tabs = [
    { key: 'overview', label: '总览' },
    { key: 'teams', label: '团队统计' },
    { key: 'owners', label: '负责人追踪' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">统计报表</h2>
        <p className="text-dark-400 mt-1">查看构建数据和团队绩效</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="总构建数"
              value={formatNumber(statistics.totalBuilds)}
              icon={BarChart3}
              color="text-primary-400"
              bgColor="bg-primary-500/10"
              trend="+12.5%"
              trendUp={true}
            />
            <StatCard
              label="成功率"
              value={formatPercent(statistics.successRate)}
              icon={CheckCircle2}
              color="text-success-500"
              bgColor="bg-success-500/10"
              trend="+2.1%"
              trendUp={true}
            />
            <StatCard
              label="平均耗时"
              value={formatDuration(statistics.avgDuration)}
              icon={Clock}
              color="text-warning-500"
              bgColor="bg-warning-500/10"
              trend="-5.3%"
              trendUp={true}
            />
            <StatCard
              label="活跃团队"
              value={String(statistics.teamStats.length)}
              icon={Users}
              color="text-purple-400"
              bgColor="bg-purple-500/10"
              trend="+1"
              trendUp={true}
            />
          </div>

          <Card>
            <Card.Body>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">构建趋势</h3>
                  <p className="text-sm text-dark-400 mt-1">近14天构建数量和成功率趋势</p>
                </div>
                <div className="flex gap-1 bg-dark-800/50 p-1 rounded-lg">
                  <button
                    onClick={() => setChartType('line')}
                    className={cn(
                      'p-2 rounded-md transition-colors',
                      chartType === 'line'
                        ? 'bg-dark-700 text-white'
                        : 'text-dark-400 hover:text-white'
                    )}
                  >
                    <LineChart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={cn(
                      'p-2 rounded-md transition-colors',
                      chartType === 'bar'
                        ? 'bg-dark-700 text-white'
                        : 'text-dark-400 hover:text-white'
                    )}
                  >
                    <BarChart className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <ReLineChart data={statistics.dailyBuilds}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={12}
                        tickFormatter={(value) => value.slice(5)}
                      />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="总构建数"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="successCount"
                        name="成功数"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: '#22c55e', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </ReLineChart>
                  ) : (
                    <ReBarChart data={statistics.dailyBuilds}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={12}
                        tickFormatter={(value) => value.slice(5)}
                      />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" name="总构建数" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="successCount" name="成功数" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </ReBarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Body>
                <h3 className="text-lg font-semibold text-white mb-4">团队成功率排名</h3>
                <div className="space-y-4">
                  {[...statistics.teamStats]
                    .sort((a, b) => b.successRate - a.successRate)
                    .map((team, index) => (
                      <div key={team.teamId} className="flex items-center gap-4">
                        <span
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                            index === 0
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : index === 1
                              ? 'bg-dark-400/20 text-dark-400'
                              : index === 2
                              ? 'bg-amber-600/20 text-amber-500'
                              : 'bg-dark-700 text-dark-500'
                          )}
                        >
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-white">
                              {team.teamName}
                            </span>
                            <span className="text-sm text-success-400">
                              {team.successRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 to-success-500 rounded-full transition-all duration-1000"
                              style={{ width: `${team.successRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <h3 className="text-lg font-semibold text-white mb-4">团队构建次数</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart
                      data={statistics.teamStats}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#64748b" fontSize={12} />
                      <YAxis
                        dataKey="teamName"
                        type="category"
                        stroke="#64748b"
                        fontSize={12}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9',
                        }}
                      />
                      <Bar dataKey="buildCount" name="构建数" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statistics.teamStats.map((team, index) => (
            <Card key={team.teamId} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}>
              <Card.Body>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-primary-500/10 rounded-xl">
                    <Users className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{team.teamName}</h3>
                    <p className="text-xs text-dark-400">{team.buildCount} 次构建</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-dark-700/30 rounded-lg">
                    <p className="text-xs text-dark-500 mb-1">成功率</p>
                    <p className="text-lg font-bold text-success-400">
                      {team.successRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 bg-dark-700/30 rounded-lg">
                    <p className="text-xs text-dark-500 mb-1">平均耗时</p>
                    <p className="text-lg font-bold text-warning-400">
                      {formatDuration(team.avgDuration)}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-dark-400">成功率进度</span>
                    <span className="text-xs text-dark-300">{team.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-1000',
                        team.successRate >= 95
                          ? 'bg-success-500'
                          : team.successRate >= 90
                          ? 'bg-warning-500'
                          : 'bg-danger-500'
                      )}
                      style={{ width: `${team.successRate}%` }}
                    />
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'owners' && (
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">流水线负责人</h3>
                <p className="text-sm text-dark-400 mt-1">追踪每条流水线的负责人及其绩效</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-dark-700">
                    <th className="pb-3 text-sm font-medium text-dark-400">负责人</th>
                    <th className="pb-3 text-sm font-medium text-dark-400">负责流水线</th>
                    <th className="pb-3 text-sm font-medium text-dark-400">构建总数</th>
                    <th className="pb-3 text-sm font-medium text-dark-400">成功率</th>
                    <th className="pb-3 text-sm font-medium text-dark-400">绩效</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {statistics.pipelineOwners.map((owner, index) => (
                    <tr key={owner.userId} className="hover:bg-dark-800/30 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={owner.userAvatar}
                            alt={owner.userName}
                            className="w-9 h-9 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-white">{owner.userName}</p>
                            <p className="text-xs text-dark-500">ID: {owner.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-dark-500" />
                          <span className="text-dark-300">{owner.pipelineCount} 条</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-dark-300">{owner.buildCount}</span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                owner.successRate >= 95
                                  ? 'bg-success-500'
                                  : owner.successRate >= 90
                                  ? 'bg-warning-500'
                                  : 'bg-danger-500'
                              )}
                              style={{ width: `${owner.successRate}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              'text-sm font-medium',
                              owner.successRate >= 95
                                ? 'text-success-400'
                                : owner.successRate >= 90
                                ? 'text-warning-400'
                                : 'text-danger-400'
                            )}
                          >
                            {owner.successRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span
                          className={cn(
                            'px-2.5 py-1 text-xs font-medium rounded-full',
                            index < 3
                              ? 'bg-success-500/10 text-success-400'
                              : 'bg-dark-700 text-dark-400'
                          )}
                        >
                          {index === 0 ? '优秀' : index === 1 ? '良好' : index === 2 ? '良好' : '达标'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: typeof BarChart3;
  color: string;
  bgColor: string;
  trend: string;
  trendUp: boolean;
}

function StatCard({ label, value, icon: Icon, color, bgColor, trend, trendUp }: StatCardProps) {
  return (
    <Card>
      <Card.Body>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-dark-400">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
          </div>
          <div className={cn('p-3 rounded-xl', bgColor)}>
            <Icon className={cn('w-6 h-6', color)} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <TrendingUp
            className={cn('w-4 h-4', trendUp ? 'text-success-500' : 'text-danger-500')}
          />
          <span
            className={cn(
              'text-sm font-medium',
              trendUp ? 'text-success-500' : 'text-danger-500'
            )}
          >
            {trend}
          </span>
          <span className="text-xs text-dark-500">较上周</span>
        </div>
      </Card.Body>
    </Card>
  );
}
