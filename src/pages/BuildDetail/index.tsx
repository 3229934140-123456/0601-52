import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  GitCommit,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  Clock as ClockIcon,
  Copy,
  Search,
  Download,
  GitCompare,
} from 'lucide-react';
import { useBuildStore } from '@/store/useBuildStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tabs } from '@/components/common/Tabs';
import { Modal } from '@/components/common/Modal';
import { getProjectById } from '@/data/projects';
import { getUserById } from '@/data/teams';
import { getBuildsByProject } from '@/data/builds';
import { formatDateTime, formatRelativeTime } from '@/utils/date';
import { formatDuration, truncateHash } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { BuildStage, BuildLog, Build } from '@/types';

export function BuildDetail() {
  const { buildId } = useParams<{ buildId: string }>();
  const navigate = useNavigate();
  const {
    currentBuild,
    selectedStage,
    setCurrentBuild,
    setSelectedStage,
    rerunStage,
    getBuildsByProject: getBuilds,
  } = useBuildStore();

  const [activeTab, setActiveTab] = useState('stages');
  const [logSearch, setLogSearch] = useState('');
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareBuildId, setCompareBuildId] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (buildId) {
      setCurrentBuild(buildId);
    }
  }, [buildId, setCurrentBuild]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [selectedStage?.logs, autoScroll]);

  if (!currentBuild) {
    return <div className="text-dark-400">加载中...</div>;
  }

  const project = getProjectById(currentBuild.projectId);
  const triggeredBy = getUserById(currentBuild.triggeredBy);
  const builds = getBuilds(currentBuild.projectId);
  const otherBuilds = builds.filter((b) => b.id !== currentBuild.id);

  const handleRerunStage = (stageId: string) => {
    if (buildId) {
      rerunStage(buildId, stageId);
    }
  };

  const tabs = [
    { key: 'stages', label: '阶段' },
    { key: 'logs', label: '日志' },
    { key: 'artifacts', label: '制品' },
    { key: 'compare', label: '对比' },
  ];

  const filteredLogs = selectedStage?.logs.filter((log) =>
    log.message.toLowerCase().includes(logSearch.toLowerCase())
  ) || [];

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
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">
                构建 #{currentBuild.id.split('-')[1]}
              </h2>
              <StatusBadge status={currentBuild.status} />
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-dark-400">
              <span>{project?.name}</span>
              <span>·</span>
              <span>{formatRelativeTime(currentBuild.startTime)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<GitCompare className="w-4 h-4" />}
            onClick={() => setShowCompareModal(true)}
          >
            对比构建
          </Button>
          <Button
            variant="secondary"
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            重新构建
          </Button>
          <Button leftIcon={<Play className="w-4 h-4" />}>
            立即构建
          </Button>
        </div>
      </div>

      <Card>
        <Card.Body>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-dark-400 mb-1">触发方式</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs bg-dark-700 text-dark-300 rounded">
                  {currentBuild.triggerType === 'manual'
                    ? '手动触发'
                    : currentBuild.triggerType === 'push'
                    ? '代码推送'
                    : '定时触发'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-dark-400 mb-1">触发人</p>
              <div className="flex items-center gap-2">
                {triggeredBy && (
                  <>
                    <img
                      src={triggeredBy.avatar}
                      alt={triggeredBy.name}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-dark-200">{triggeredBy.name}</span>
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-dark-400 mb-1">构建耗时</p>
              <p className="text-dark-200 font-medium">
                {currentBuild.duration
                  ? formatDuration(currentBuild.duration)
                  : '进行中'}
              </p>
            </div>
            <div>
              <p className="text-sm text-dark-400 mb-1">代码提交</p>
              <div className="flex items-center gap-1">
                <GitCommit className="w-4 h-4 text-dark-400" />
                <span className="text-dark-200 font-mono text-sm">
                  {truncateHash(currentBuild.commitHash)}
                </span>
                <button className="text-dark-500 hover:text-dark-300">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-dark-700/50">
            <p className="text-sm text-dark-400 mb-1">提交信息</p>
            <p className="text-dark-200">{currentBuild.commitMessage}</p>
          </div>
        </Card.Body>
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'stages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {currentBuild.stages.map((stage) => (
              <StageCard
                key={stage.id}
                stage={stage}
                isSelected={selectedStage?.id === stage.id}
                onClick={() => {
                  setSelectedStage(stage);
                  setActiveTab('logs');
                }}
                onRerun={() => handleRerunStage(stage.id)}
              />
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedStage ? (
              <StageDetail stage={selectedStage} />
            ) : (
              <Card>
                <Card.Body className="text-center py-12 text-dark-400">
                  <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>选择一个阶段查看详情</p>
                </Card.Body>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <Card>
          <Card.Body className="p-0">
            <div className="flex items-center justify-between p-4 border-b border-dark-700/50">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-white">
                  {selectedStage?.stageName || '构建日志'}
                </h3>
                <span className="text-sm text-dark-400">
                  {filteredLogs.length} 条日志
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="搜索日志..."
                    className="pl-9 pr-3 py-1.5 w-60 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50"
                  />
                </div>
                <button
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    autoScroll
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-dark-400 hover:bg-dark-700'
                  )}
                  title={autoScroll ? '自动滚动已开启' : '自动滚动已关闭'}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              ref={logContainerRef}
              className="h-96 overflow-y-auto bg-dark-900 p-4 font-mono text-sm"
            >
              {filteredLogs.map((log, index) => (
                <LogLine key={log.id} log={log} index={index} />
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {activeTab === 'artifacts' && (
        <Card>
          <Card.Body>
            <div className="text-center py-12 text-dark-400">
              <p>暂无制品</p>
            </div>
          </Card.Body>
        </Card>
      )}

      {activeTab === 'compare' && (
        <Card>
          <Card.Body>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm text-dark-400 mb-2">构建 1</label>
                <select
                  className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50"
                  defaultValue={currentBuild.id}
                >
                  <option value={currentBuild.id}>
                    构建 #{currentBuild.id.split('-')[1]}
                  </option>
                </select>
              </div>
              <div className="text-dark-400 pt-6">VS</div>
              <div className="flex-1">
                <label className="block text-sm text-dark-400 mb-2">构建 2</label>
                <select
                  className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50"
                  defaultValue=""
                >
                  <option value="">选择要对比的构建</option>
                  {otherBuilds.slice(0, 5).map((b) => (
                    <option key={b.id} value={b.id}>
                      构建 #{b.id.split('-')[1]} - {b.commitMessage}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-center text-dark-400 py-8">
              选择两个构建进行对比
            </p>
          </Card.Body>
        </Card>
      )}

      <Modal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        title="对比构建"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCompareModal(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                setShowCompareModal(false);
                setActiveTab('compare');
              }}
              disabled={!compareBuildId}
            >
              对比
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-dark-400 mb-3">选择要对比的构建</p>
          {otherBuilds.slice(0, 5).map((build) => (
            <button
              key={build.id}
              onClick={() => setCompareBuildId(build.id)}
              className={cn(
                'w-full p-3 rounded-lg text-left transition-colors',
                compareBuildId === build.id
                  ? 'bg-primary-500/10 border border-primary-500/30'
                  : 'bg-dark-700/30 hover:bg-dark-700/50 border border-transparent'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">
                  构建 #{build.id.split('-')[1]}
                </span>
                <StatusBadge status={build.status} size="sm" />
              </div>
              <p className="text-sm text-dark-400 mt-1 truncate">
                {build.commitMessage}
              </p>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

interface StageCardProps {
  stage: BuildStage;
  isSelected: boolean;
  onClick: () => void;
  onRerun: () => void;
}

function StageCard({ stage, isSelected, onClick, onRerun }: StageCardProps) {
  const statusIcon = {
    success: <CheckCircle className="w-5 h-5 text-success-500" />,
    failed: <XCircle className="w-5 h-5 text-danger-500" />,
    running: <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />,
    pending: <Clock className="w-5 h-5 text-dark-500" />,
    skipped: <Clock className="w-5 h-5 text-dark-500" />,
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all',
        isSelected && 'ring-2 ring-primary-500/50'
      )}
      onClick={onClick}
    >
      <Card.Body>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusIcon[stage.status]}
            <div>
              <h4 className="font-medium text-white">{stage.stageName}</h4>
              <p className="text-xs text-dark-400">
                {stage.duration ? formatDuration(stage.duration) : '等待中'}
              </p>
            </div>
          </div>
          {stage.status === 'failed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRerun();
              }}
              className="p-1.5 rounded-lg text-primary-400 hover:bg-primary-500/10 transition-colors"
              title="重跑阶段"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

function StageDetail({ stage }: { stage: BuildStage }) {
  return (
    <Card>
      <Card.Body>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">{stage.stageName}</h3>
          <StatusBadge status={stage.status} />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-dark-700/30 rounded-lg">
            <p className="text-xs text-dark-400 mb-1">开始时间</p>
            <p className="text-sm text-dark-200">{formatDateTime(stage.startTime)}</p>
          </div>
          <div className="p-3 bg-dark-700/30 rounded-lg">
            <p className="text-xs text-dark-400 mb-1">结束时间</p>
            <p className="text-sm text-dark-200">
              {stage.endTime ? formatDateTime(stage.endTime) : '-'}
            </p>
          </div>
          <div className="p-3 bg-dark-700/30 rounded-lg">
            <p className="text-xs text-dark-400 mb-1">耗时</p>
            <p className="text-sm text-dark-200">
              {stage.duration ? formatDuration(stage.duration) : '-'}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-dark-300 mb-3">步骤</h4>
          <div className="space-y-2">
            {stage.logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-2 p-2 bg-dark-700/30 rounded"
              >
                <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />
                <span className="text-sm text-dark-300 truncate">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

function LogLine({ log, index }: { log: BuildLog; index: number }) {
  const levelColors = {
    info: 'text-dark-300',
    warn: 'text-warning-400',
    error: 'text-danger-400',
    debug: 'text-dark-500',
  };

  return (
    <div
      className={cn(
        'flex gap-4 py-0.5 hover:bg-dark-800/50 transition-colors',
        'animate-fade-in'
      )}
      style={{ animationDelay: `${index * 10}ms` } as React.CSSProperties}
    >
      <span className="text-dark-600 flex-shrink-0 w-8 text-right">
        {index + 1}
      </span>
      <span className="text-dark-600 flex-shrink-0 w-20">
        {log.timestamp.split('T')[1]?.split('.')[0]}
      </span>
      <span
        className={cn(
          'flex-shrink-0 w-12 uppercase text-xs font-medium',
          levelColors[log.level]
        )}
      >
        {log.level}
      </span>
      <span className={cn('flex-1 break-all', levelColors[log.level])}>
        {log.message}
      </span>
    </div>
  );
}
