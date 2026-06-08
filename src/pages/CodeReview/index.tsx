import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Bug,
  Shield,
  Copy,
  CheckCircle2,
  XCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Tabs';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getIssuesByBuild, getIssueStats } from '@/data/codeIssues';
import { getBuildById } from '@/data/builds';
import { getProjectById } from '@/data/projects';
import { formatRelativeTime } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { CodeIssue, Severity, IssueType, IssueStatus } from '@/types';

const severityColors: Record<Severity, string> = {
  critical: 'text-danger-500 bg-danger-500/10 border-danger-500/20',
  major: 'text-warning-500 bg-warning-500/10 border-warning-500/20',
  minor: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
  info: 'text-dark-400 bg-dark-700/50 border-dark-600',
};

const typeIcons: Record<IssueType, typeof Bug> = {
  bug: Bug,
  vulnerability: Shield,
  code_smell: Zap,
  duplication: Copy,
};

const typeLabels: Record<IssueType, string> = {
  bug: 'Bug',
  vulnerability: '漏洞',
  code_smell: '代码异味',
  duplication: '重复代码',
};

const statusLabels: Record<IssueStatus, string> = {
  open: '待处理',
  fixed: '已修复',
  false_positive: '误报',
};

export function CodeReview() {
  const { buildId } = useParams<{ buildId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<IssueType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  const build = buildId ? getBuildById(buildId) : undefined;
  const project = build ? getProjectById(build.projectId) : undefined;
  const issues = buildId ? getIssuesByBuild(buildId) : [];
  const stats = buildId ? getIssueStats(buildId) : null;

  const filteredIssues = issues.filter((issue) => {
    if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && issue.type !== typeFilter) return false;
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    return true;
  });

  const tabs = [
    { key: 'overview', label: '概览' },
    { key: 'issues', label: '问题列表' },
    { key: 'quality-gate', label: '质量门禁' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">代码检查</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-dark-400">
              <span>{project?.name}</span>
              <span>·</span>
              <span>构建 #{build?.id.split('-')[1]}</span>
              <span>·</span>
              <span>{build ? formatRelativeTime(build.startTime) : ''}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary">导出报告</Button>
          <Button>重新检查</Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="总问题数"
              value={stats.total}
              icon={AlertTriangle}
              color="text-warning-500"
              bgColor="bg-warning-500/10"
            />
            <StatCard
              label="严重"
              value={stats.critical}
              icon={Shield}
              color="text-danger-500"
              bgColor="bg-danger-500/10"
            />
            <StatCard
              label="主要"
              value={stats.major}
              icon={Bug}
              color="text-warning-500"
              bgColor="bg-warning-500/10"
            />
            <StatCard
              label="已修复"
              value={stats.fixed}
              icon={CheckCircle2}
              color="text-success-500"
              bgColor="bg-success-500/10"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Body>
                <h3 className="font-semibold text-white mb-4">严重程度分布</h3>
                <div className="space-y-3">
                  {(['critical', 'major', 'minor', 'info'] as Severity[]).map((sev) => (
                    <div key={sev} className="flex items-center gap-3">
                      <span className={cn('w-20 text-sm', severityColors[sev].split(' ')[0])}>
                        {sev === 'critical' ? '严重' : sev === 'major' ? '主要' : sev === 'minor' ? '次要' : '提示'}
                      </span>
                      <div className="flex-1 h-6 bg-dark-700/50 rounded overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded transition-all duration-500',
                            severityColors[sev].split(' ')[1]
                          )}
                          style={{
                            width: `${stats.total > 0 ? (stats[sev] / stats.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm text-dark-300">
                        {stats[sev]}
                      </span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <h3 className="font-semibold text-white mb-4">问题类型分布</h3>
                <div className="space-y-3">
                  {(['bug', 'vulnerability', 'code_smell', 'duplication'] as IssueType[]).map((type) => {
                    const count = issues.filter((i) => i.type === type).length;
                    const Icon = typeIcons[type];
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <div className="w-20 flex items-center gap-2">
                          <Icon className="w-4 h-4 text-dark-400" />
                          <span className="text-sm text-dark-300">{typeLabels[type]}</span>
                        </div>
                        <div className="flex-1 h-6 bg-dark-700/50 rounded overflow-hidden">
                          <div
                            className="h-full bg-primary-500/30 rounded transition-all duration-500"
                            style={{
                              width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="w-10 text-right text-sm text-dark-300">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-dark-400" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as Severity | 'all')}
                className="px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-primary-500/50"
              >
                <option value="all">全部严重程度</option>
                <option value="critical">严重</option>
                <option value="major">主要</option>
                <option value="minor">次要</option>
                <option value="info">提示</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as IssueType | 'all')}
                className="px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-primary-500/50"
              >
                <option value="all">全部类型</option>
                <option value="bug">Bug</option>
                <option value="vulnerability">漏洞</option>
                <option value="code_smell">代码异味</option>
                <option value="duplication">重复代码</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as IssueStatus | 'all')}
                className="px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-primary-500/50"
              >
                <option value="all">全部状态</option>
                <option value="open">待处理</option>
                <option value="fixed">已修复</option>
                <option value="false_positive">误报</option>
              </select>
            </div>

            <div className="ml-auto text-sm text-dark-400">
              共 {filteredIssues.length} 个问题
            </div>
          </div>

          <Card>
            <div className="divide-y divide-dark-700/50">
              {filteredIssues.map((issue) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  isExpanded={expandedIssue === issue.id}
                  onToggle={() =>
                    setExpandedIssue(expandedIssue === issue.id ? null : issue.id)
                  }
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'quality-gate' && (
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">质量门禁</h3>
                <p className="text-sm text-dark-400 mt-1">
                  根据预设规则评估代码质量是否达标
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success-500" />
                <span className="text-success-500 font-medium">通过</span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { name: '严重缺陷数', metric: 'critical_issues', value: 0, threshold: 0, passed: true },
                { name: '主要缺陷数', metric: 'major_issues', value: 3, threshold: 10, passed: true },
                { name: '代码覆盖率', metric: 'coverage', value: 85.3, threshold: 80, passed: true, unit: '%' },
                { name: '重复代码率', metric: 'duplication', value: 3.2, threshold: 5, passed: true, unit: '%' },
              ].map((item) => (
                <div
                  key={item.metric}
                  className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {item.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-success-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-danger-500" />
                    )}
                    <div>
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-xs text-dark-400">{item.metric}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-dark-400">当前值</p>
                      <p className={cn('font-medium', item.passed ? 'text-success-400' : 'text-danger-400')}>
                        {item.value}{item.unit || ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-dark-400">阈值</p>
                      <p className="font-medium text-dark-200">
                        {item.threshold}{item.unit || ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: typeof AlertTriangle;
  color: string;
  bgColor: string;
}

function StatCard({ label, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <Card>
      <Card.Body>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-dark-400">{label}</p>
            <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
          </div>
          <div className={cn('p-3 rounded-xl', bgColor)}>
            <Icon className={cn('w-6 h-6', color)} />
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

interface IssueRowProps {
  issue: CodeIssue;
  isExpanded: boolean;
  onToggle: () => void;
}

function IssueRow({ issue, isExpanded, onToggle }: IssueRowProps) {
  const Icon = typeIcons[issue.type];
  const severityLabel = issue.severity === 'critical' ? '严重' : issue.severity === 'major' ? '主要' : issue.severity === 'minor' ? '次要' : '提示';

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-dark-700/30 transition-colors text-left"
      >
        <div
          className={cn(
            'p-2 rounded-lg border',
            severityColors[issue.severity]
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <p className="font-medium text-white truncate">{issue.message}</p>
            <span className={cn(
              'px-2 py-0.5 text-xs rounded border flex-shrink-0',
              severityColors[issue.severity]
            )}>
              {severityLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-dark-400">
            <span className="font-mono text-xs">{issue.file}:{issue.line}</span>
            <span>·</span>
            <span>{typeLabels[issue.type]}</span>
            <span>·</span>
            <span>{statusLabels[issue.status]}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-500 font-mono bg-dark-700/50 px-2 py-1 rounded">
            {issue.rule}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-dark-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-dark-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="ml-12 p-4 bg-dark-800/50 rounded-lg border border-dark-700/50">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-dark-500 mb-1">文件</p>
                <p className="text-sm text-dark-300 font-mono">{issue.file}</p>
              </div>
              <div>
                <p className="text-xs text-dark-500 mb-1">行号</p>
                <p className="text-sm text-dark-300">{issue.line}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-dark-500 mb-2">问题描述</p>
              <p className="text-sm text-dark-300">{issue.message}</p>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Button size="sm" variant="secondary">查看详情</Button>
              <Button size="sm" variant="secondary">标记为误报</Button>
              <Button size="sm">创建修复任务</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
