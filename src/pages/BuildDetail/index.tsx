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
  FileText,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XOctagon,
  History,
  Zap,
  Flag,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { useBuildStore } from '@/store/useBuildStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tabs } from '@/components/common/Tabs';
import { Modal } from '@/components/common/Modal';
import { getProjectById } from '@/data/projects';
import { getUserById, users } from '@/data/teams';
import { formatDateTime, formatRelativeTime } from '@/utils/date';
import { formatDuration, truncateHash } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { BuildStage, BuildLog, Build, TestConclusion, BuildTimelineEvent } from '@/types';

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
    getBuild,
    saveTestConclusion,
    getTestConclusion,
    getTimeline,
    getStageLogsByVersion,
    getStageRerunCount,
  } = useBuildStore();

  const [activeTab, setActiveTab] = useState('stages');
  const [logSearch, setLogSearch] = useState('');
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareBuildId, setCompareBuildId] = useState('');
  const [compareBuildId2, setCompareBuildId2] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const errorLogRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [logVersion, setLogVersion] = useState(0);
  const [highlightedLogId, setHighlightedLogId] = useState<string | null>(null);

  const [testResult, setTestResult] = useState<'pass' | 'fail' | 'block'>('pass');
  const [testSummary, setTestSummary] = useState('');
  const [testCases, setTestCases] = useState(0);
  const [passedCases, setPassedCases] = useState(0);
  const [failedCases, setFailedCases] = useState(0);
  const [testTesterId, setTestTesterId] = useState('user-1');

  useEffect(() => {
    if (buildId) {
      setCurrentBuild(buildId);
      setCompareBuildId(buildId);
    }
  }, [buildId, setCurrentBuild]);

  useEffect(() => {
    if (currentBuild) {
      const conclusion = getTestConclusion(currentBuild.id);
      if (conclusion) {
        setTestResult(conclusion.result);
        setTestSummary(conclusion.summary);
        setTestCases(conclusion.testCases);
        setPassedCases(conclusion.passedCases);
        setFailedCases(conclusion.failedCases);
        setTestTesterId(conclusion.testerId);
      }
    }
  }, [currentBuild?.id, getTestConclusion]);

  if (!currentBuild) {
    return <div className="text-dark-400">加载中...</div>;
  }

  const project = getProjectById(currentBuild.projectId);
  const triggeredBy = getUserById(currentBuild.triggeredBy);
  const builds = getBuilds(currentBuild.projectId);
  const otherBuilds = builds.filter((b) => b.id !== currentBuild.id);
  const testConclusion = currentBuild ? getTestConclusion(currentBuild.id) : undefined;
  const timeline = buildId ? getTimeline(buildId) : [];

  const handleRerunStage = (stageId: string) => {
    if (buildId) {
      rerunStage(buildId, stageId);
      setLogVersion(0);
      setHighlightedLogId(null);
    }
  };

  const handleSaveTestConclusion = () => {
    if (!currentBuild) return;
    const conclusion: TestConclusion = {
      buildId: currentBuild.id,
      result: testResult,
      summary: testSummary,
      testerId: testTesterId,
      testCases,
      passedCases,
      failedCases,
      createdAt: new Date().toISOString(),
    };
    saveTestConclusion(currentBuild.id, conclusion);
    setShowTestModal(false);
  };

  const handleTimelineClick = (event: BuildTimelineEvent) => {
    if (event.stageId && currentBuild) {
      const stage = currentBuild.stages.find((s) => s.id === event.stageId);
      if (stage) {
        setSelectedStage(stage);
        setHighlightedLogId(null);

        let version = 0;
        const rerunMatch = event.id.match(/-rerun-(\d+)$/);
        const failedBeforeRerunMatch = event.id.match(/-failed-before-rerun-(\d+)/);
        const endBeforeRerunMatch = event.id.match(/-end-before-rerun-(\d+)/);
        const restartBeforeRerunMatch = event.id.match(/-restart-(\d+)/);

        if (rerunMatch) {
          const rerunIdx = parseInt(rerunMatch[1], 10);
          version = rerunIdx + 1;
        } else if (failedBeforeRerunMatch) {
          const rerunIdx = parseInt(failedBeforeRerunMatch[1], 10);
          version = rerunIdx + 1;
        } else if (endBeforeRerunMatch) {
          const rerunIdx = parseInt(endBeforeRerunMatch[1], 10);
          version = rerunIdx + 1;
        } else if (restartBeforeRerunMatch) {
          const rerunIdx = parseInt(restartBeforeRerunMatch[1], 10);
          version = rerunIdx + 1;
        }

        setLogVersion(version);

        if (event.type === 'failed' || event.type === 'stage_end') {
          setActiveTab('logs');
          if (event.type === 'failed') {
            setTimeout(() => {
              const logs = buildId ? getStageLogsByVersion(buildId, event.stageId!, version) : [];
              const firstError = logs.find((l) => l.level === 'error');
              if (firstError) {
                setHighlightedLogId(firstError.id);
              }
            }, 100);
          }
        } else {
          setActiveTab('stages');
        }
      }
    }
    if (event.type === 'test_conclusion') {
      setActiveTab('test');
    }
  };

  const tabs = [
    { key: 'stages', label: '阶段' },
    { key: 'timeline', label: '时间线' },
    { key: 'logs', label: '日志' },
    { key: 'artifacts', label: '制品' },
    { key: 'compare', label: '对比' },
    { key: 'test', label: '测试结论' },
  ];

  const currentLogs = buildId && selectedStage
    ? getStageLogsByVersion(buildId, selectedStage.id, logVersion)
    : selectedStage?.logs || [];

  const filteredLogs = currentLogs.filter((log) =>
    log.message.toLowerCase().includes(logSearch.toLowerCase())
  ) || [];

  const stageRerunCount = buildId && selectedStage
    ? getStageRerunCount(buildId, selectedStage.id)
    : 0;

  const firstErrorLogIndex = filteredLogs.findIndex((log) => log.level === 'error');

  useEffect(() => {
    if (highlightedLogId && errorLogRef.current && logContainerRef.current) {
      const container = logContainerRef.current;
      const errorElement = errorLogRef.current;
      const containerHeight = container.clientHeight;
      const elementTop = errorElement.offsetTop;
      const elementHeight = errorElement.clientHeight;
      container.scrollTop = elementTop - containerHeight / 2 + elementHeight / 2;
    }
  }, [highlightedLogId, filteredLogs.length]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current && !highlightedLogId) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [currentLogs, autoScroll, highlightedLogId]);

  const compareBuild1 = compareBuildId ? getBuild(compareBuildId) : undefined;
  const compareBuild2 = compareBuildId2 ? getBuild(compareBuildId2) : undefined;
  const hasBothBuilds = compareBuild1 && compareBuild2;

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
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={() => setShowTestModal(true)}
          >
            登记测试结论
          </Button>
          <Button
            variant="secondary"
            leftIcon={<GitCompare className="w-4 h-4" />}
            onClick={() => {
              setCompareBuildId(currentBuild.id);
              setCompareBuildId2('');
              setShowCompareModal(true);
            }}
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
                  setLogVersion(0);
                  setHighlightedLogId(null);
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

      {activeTab === 'timeline' && (
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">执行时间线</h3>
                <p className="text-sm text-dark-400 mt-1">查看构建执行的完整时间线</p>
              </div>
              <span className="text-sm text-dark-400">共 {timeline.length} 个事件</span>
            </div>
            <div className="relative">
              {timeline.map((event, index) => (
                <TimelineItem
                  key={event.id}
                  event={event}
                  isLast={index === timeline.length - 1}
                  onClick={() => handleTimelineClick(event)}
                />
              ))}
            </div>
          </Card.Body>
        </Card>
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
                {stageRerunCount > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded">
                    当前查看：{logVersion === 0 ? '最新执行' : `第${logVersion}次执行`}日志
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {stageRerunCount > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setLogVersion(Math.max(0, logVersion - 1));
                        setHighlightedLogId(null);
                      }}
                      disabled={logVersion === 0}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        logVersion === 0
                          ? 'text-dark-600 cursor-not-allowed'
                          : 'text-dark-400 hover:bg-dark-700'
                      )}
                      title="上一版日志"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    <span className="text-xs text-dark-400 w-20 text-center">
                      {logVersion === 0 ? '最新' : `第${logVersion}次`}
                    </span>
                    <button
                      onClick={() => {
                        setLogVersion(Math.min(stageRerunCount, logVersion + 1));
                        setHighlightedLogId(null);
                      }}
                      disabled={logVersion >= stageRerunCount}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        logVersion >= stageRerunCount
                          ? 'text-dark-600 cursor-not-allowed'
                          : 'text-dark-400 hover:bg-dark-700'
                      )}
                      title="下一版日志"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
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
                  onClick={() => {
                    setAutoScroll(!autoScroll);
                    if (autoScroll) {
                      setHighlightedLogId(null);
                    }
                  }}
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
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => (
                  <LogLine
                    key={log.id}
                    log={log}
                    index={index}
                    highlight={highlightedLogId === log.id}
                    setErrorRef={highlightedLogId === log.id ? (el) => { errorLogRef.current = el; } : undefined}
                  />
                ))
              ) : (
                <div className="text-center text-dark-500 py-8">
                  暂无日志数据
                </div>
              )}
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
                  value={compareBuildId}
                  onChange={(e) => setCompareBuildId(e.target.value)}
                >
                  <option value="">选择构建</option>
                  {builds.map((b) => (
                    <option key={b.id} value={b.id}>
                      构建 #{b.id.split('-')[1]} - {b.commitMessage}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-dark-400 pt-6">VS</div>
              <div className="flex-1">
                <label className="block text-sm text-dark-400 mb-2">构建 2</label>
                <select
                  className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50"
                  value={compareBuildId2}
                  onChange={(e) => setCompareBuildId2(e.target.value)}
                >
                  <option value="">选择要对比的构建</option>
                  {otherBuilds.map((b) => (
                    <option key={b.id} value={b.id}>
                      构建 #{b.id.split('-')[1]} - {b.commitMessage}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasBothBuilds ? (
              <CompareResult build1={compareBuild1!} build2={compareBuild2!} />
            ) : (
              <p className="text-center text-dark-400 py-8">
                选择两个构建进行对比
              </p>
            )}
          </Card.Body>
        </Card>
      )}

      {activeTab === 'test' && (
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">测试结论</h3>
                <p className="text-sm text-dark-400 mt-1">查看和管理本次构建的测试结果</p>
              </div>
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowTestModal(true)}>
                {testConclusion ? '编辑结论' : '登记结论'}
              </Button>
            </div>

            {testConclusion ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-dark-700/30 rounded-lg">
                    <p className="text-xs text-dark-400 mb-1">测试结果</p>
                    <div className="flex items-center gap-2">
                      {testConclusion.result === 'pass' && (
                        <CheckCircle2 className="w-5 h-5 text-success-500" />
                      )}
                      {testConclusion.result === 'fail' && (
                        <XOctagon className="w-5 h-5 text-danger-500" />
                      )}
                      {testConclusion.result === 'block' && (
                        <AlertTriangle className="w-5 h-5 text-warning-500" />
                      )}
                      <span className="text-lg font-semibold text-white">
                        {testConclusion.result === 'pass' ? '通过' : testConclusion.result === 'fail' ? '失败' : '阻塞'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-dark-700/30 rounded-lg">
                    <p className="text-xs text-dark-400 mb-1">用例总数</p>
                    <p className="text-lg font-semibold text-white">{testConclusion.testCases}</p>
                  </div>
                  <div className="p-4 bg-dark-700/30 rounded-lg">
                    <p className="text-xs text-dark-400 mb-1">通过用例</p>
                    <p className="text-lg font-semibold text-success-400">{testConclusion.passedCases}</p>
                  </div>
                  <div className="p-4 bg-dark-700/30 rounded-lg">
                    <p className="text-xs text-dark-400 mb-1">失败用例</p>
                    <p className="text-lg font-semibold text-danger-400">{testConclusion.failedCases}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-dark-400 mb-2">结论说明</p>
                  <p className="text-dark-200 whitespace-pre-wrap">{testConclusion.summary || '无'}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-dark-400">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>测试负责人: {getUserById(testConclusion.testerId)?.name || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>登记时间: {formatDateTime(testConclusion.createdAt)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-dark-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无测试结论</p>
                <p className="text-sm mt-1">点击上方按钮登记测试结论</p>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <Modal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        title="对比构建"
        size="md"
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
              disabled={!compareBuildId2}
            >
              查看对比
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-2">构建 1</label>
            <select
              className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50"
              value={compareBuildId}
              onChange={(e) => setCompareBuildId(e.target.value)}
            >
              {builds.map((b) => (
                <option key={b.id} value={b.id}>
                  构建 #{b.id.split('-')[1]} - {b.commitMessage}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-2">构建 2</label>
            {otherBuilds.slice(0, 6).map((build) => (
              <button
                key={build.id}
                onClick={() => setCompareBuildId2(build.id)}
                className={cn(
                  'w-full p-3 rounded-lg text-left transition-colors mt-2',
                  compareBuildId2 === build.id
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
        </div>
      </Modal>

      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="登记测试结论"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowTestModal(false)}>
              取消
            </Button>
            <Button onClick={handleSaveTestConclusion}>保存</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              测试结果
            </label>
            <div className="flex gap-3">
              {(['pass', 'fail', 'block'] as const).map((result) => (
                <button
                  key={result}
                  onClick={() => setTestResult(result)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg border transition-colors text-sm font-medium',
                    testResult === result
                      ? result === 'pass'
                        ? 'bg-success-500/10 border-success-500/30 text-success-400'
                        : result === 'fail'
                        ? 'bg-danger-500/10 border-danger-500/30 text-danger-400'
                        : 'bg-warning-500/10 border-warning-500/30 text-warning-400'
                      : 'bg-dark-700/30 border-dark-600 text-dark-300 hover:bg-dark-700/50'
                  )}
                >
                  {result === 'pass' ? '通过' : result === 'fail' ? '失败' : '阻塞'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              测试负责人
            </label>
            <select
              value={testTesterId}
              onChange={(e) => setTestTesterId(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} - {u.role === 'tester' ? '测试' : u.role === 'developer' ? '开发' : u.role === 'ops' ? '运维' : '管理'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-dark-400 mb-1">用例总数</label>
              <input
                type="number"
                value={testCases}
                onChange={(e) => setTestCases(Number(e.target.value))}
                className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">通过用例</label>
              <input
                type="number"
                value={passedCases}
                onChange={(e) => setPassedCases(Number(e.target.value))}
                className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-success-400 focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">失败用例</label>
              <input
                type="number"
                value={failedCases}
                onChange={(e) => setFailedCases(Number(e.target.value))}
                className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-danger-400 focus:outline-none focus:border-primary-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              结论说明
            </label>
            <textarea
              rows={4}
              value={testSummary}
              onChange={(e) => setTestSummary(e.target.value)}
              placeholder="请输入测试结论说明..."
              className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TimelineItem({ event, isLast, onClick }: { event: BuildTimelineEvent; isLast: boolean; onClick: () => void }) {
  const typeIcons: Record<string, any> = {
    triggered: Zap,
    queued: Clock,
    stage_start: Play,
    stage_end: CheckCircle,
    stage_rerun: RotateCcw,
    failed: XCircle,
    test_conclusion: FileText,
    completed: Flag,
  };

  const typeColors: Record<string, string> = {
    triggered: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
    queued: 'bg-dark-700 text-dark-400 border-dark-600',
    stage_start: 'bg-info-500/20 text-info-400 border-info-500/30',
    stage_end: 'bg-success-500/20 text-success-400 border-success-500/30',
    stage_rerun: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
    failed: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
    test_conclusion: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    completed: 'bg-success-500/20 text-success-400 border-success-500/30',
  };

  const Icon = typeIcons[event.type] || History;
  const hasAction = !!event.stageId || event.type === 'test_conclusion';

  return (
    <div className="relative pl-10 pb-6 last:pb-0">
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-dark-700" />
      )}
      <div
        className={cn(
          'absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border transition-all',
          typeColors[event.type] || 'bg-dark-700 text-dark-400 border-dark-600',
          hasAction && 'cursor-pointer hover:scale-110'
        )}
        onClick={hasAction ? onClick : undefined}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div
        className={cn(
          'bg-dark-700/30 rounded-lg p-4 border border-transparent transition-all',
          hasAction && 'cursor-pointer hover:bg-dark-700/50 hover:border-dark-600'
        )}
        onClick={hasAction ? onClick : undefined}
      >
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-white">{event.title}</h4>
          <span className="text-xs text-dark-500">
            {formatDateTime(event.timestamp)}
          </span>
        </div>
        {event.description && (
          <p className="text-sm text-dark-400">{event.description}</p>
        )}
        {event.userId && (
          <div className="flex items-center gap-2 mt-2 text-xs text-dark-500">
            <User className="w-3 h-3" />
            <span>{getUserById(event.userId)?.name || '-'}</span>
          </div>
        )}
        {hasAction && (
          <div className="flex items-center gap-1 mt-2 text-xs text-primary-400">
            <span>点击查看详情</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  );
}

function CompareResult({ build1, build2 }: { build1: Build; build2: Build }) {
  const statusColors: Record<string, string> = {
    success: 'text-success-400',
    failed: 'text-danger-400',
    running: 'text-primary-400',
    pending: 'text-dark-400',
    cancelled: 'text-dark-400',
  };

  const statusLabels: Record<string, string> = {
    success: '成功',
    failed: '失败',
    running: '运行中',
    pending: '待执行',
    cancelled: '已取消',
  };

  const durationDiff = (build1.duration || 0) - (build2.duration || 0);
  const diffPercent = build2.duration ? ((durationDiff / build2.duration) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 bg-dark-700/20 rounded-lg border border-dark-600">
          <p className="text-xs text-dark-400 mb-1">构建 1</p>
          <p className="text-lg font-semibold text-white">构建 #{build1.id.split('-')[1]}</p>
          <div className={cn('mt-2 font-medium', statusColors[build1.status])}>
            {statusLabels[build1.status]}
          </div>
        </div>
        <div className="p-4 bg-dark-700/20 rounded-lg border border-dark-600">
          <p className="text-xs text-dark-400 mb-1">构建 2</p>
          <p className="text-lg font-semibold text-white">构建 #{build2.id.split('-')[1]}</p>
          <div className={cn('mt-2 font-medium', statusColors[build2.status])}>
            {statusLabels[build2.status]}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-white">基本信息对比</h4>
        <div className="overflow-hidden rounded-lg border border-dark-700">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-dark-700">
              <tr>
                <td className="px-4 py-3 text-dark-400 bg-dark-800/30 w-32">状态</td>
                <td className={`px-4 py-3 ${statusColors[build1.status]}`}>{statusLabels[build1.status]}</td>
                <td className={`px-4 py-3 ${statusColors[build2.status]}`}>{statusLabels[build2.status]}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-dark-400 bg-dark-800/30">触发方式</td>
                <td className="px-4 py-3 text-dark-200">
                  {build1.triggerType === 'manual' ? '手动触发' : build1.triggerType === 'push' ? '代码推送' : '定时触发'}
                </td>
                <td className="px-4 py-3 text-dark-200">
                  {build2.triggerType === 'manual' ? '手动触发' : build2.triggerType === 'push' ? '代码推送' : '定时触发'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-dark-400 bg-dark-800/30">总耗时</td>
                <td className="px-4 py-3 text-dark-200">
                  {build1.duration ? formatDuration(build1.duration) : '-'}
                </td>
                <td className="px-4 py-3 text-dark-200">
                  {build2.duration ? formatDuration(build2.duration) : '-'}
                  {durationDiff !== 0 && (
                    <span className={cn('ml-2 text-xs', durationDiff > 0 ? 'text-danger-400' : 'text-success-400')}>
                      {durationDiff > 0 ? '+' : ''}{diffPercent}%
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-dark-400 bg-dark-800/30">提交</td>
                <td className="px-4 py-3 text-dark-200 font-mono text-xs">{truncateHash(build1.commitHash)}</td>
                <td className="px-4 py-3 text-dark-200 font-mono text-xs">{truncateHash(build2.commitHash)}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-dark-400 bg-dark-800/30">提交信息</td>
                <td className="px-4 py-3 text-dark-200">{build1.commitMessage}</td>
                <td className="px-4 py-3 text-dark-200">{build2.commitMessage}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-white">各阶段耗时对比</h4>
        <div className="space-y-2">
          {build1.stages.map((stage1, index) => {
            const stage2 = build2.stages[index];
            const d1 = stage1.duration || 0;
            const d2 = stage2?.duration || 0;
            const diff = d1 - d2;
            const pct = d2 > 0 ? ((diff / d2) * 100).toFixed(1) : '0';

            return (
              <div key={stage1.id} className="p-3 bg-dark-700/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-dark-200">{stage1.stageName}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={statusColors[stage1.status]}>
                      {statusLabels[stage1.status] || stage1.status}
                    </span>
                    <span className="text-dark-500">vs</span>
                    <span className={statusColors[stage2?.status || 'pending']}>
                      {statusLabels[stage2?.status || 'pending'] || stage2?.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-dark-400">构建 1</span>
                    <span className="text-dark-200">{d1 ? formatDuration(d1) : '-'}</span>
                  </div>
                  {d1 > 0 && d2 > 0 && (
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs',
                      diff > 0 ? 'bg-danger-500/10 text-danger-400' : diff < 0 ? 'bg-success-500/10 text-success-400' : 'text-dark-500'
                    )}>
                      {diff > 0 ? '+' : ''}{pct}%
                    </span>
                  )}
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-dark-400">构建 2</span>
                    <span className="text-dark-200">{d2 ? formatDuration(d2) : '-'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(build1.status === 'failed' || build2.status === 'failed') && (
        <div className="space-y-3">
          <h4 className="font-medium text-danger-400">失败阶段</h4>
          <div className="p-4 bg-danger-500/5 border border-danger-500/20 rounded-lg">
            {build1.status === 'failed' && build1.stages.filter((s) => s.status === 'failed').length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-dark-400 mb-1">构建 1 失败阶段:</p>
                {build1.stages.filter((s) => s.status === 'failed').map((s) => (
                  <span key={s.id} className="inline-block px-2 py-1 bg-danger-500/10 text-danger-400 rounded text-sm mr-2">
                    {s.stageName}
                  </span>
                ))}
              </div>
            )}
            {build2.status === 'failed' && build2.stages.filter((s) => s.status === 'failed').length > 0 && (
              <div>
                <p className="text-sm text-dark-400 mb-1">构建 2 失败阶段:</p>
                {build2.stages.filter((s) => s.status === 'failed').map((s) => (
                  <span key={s.id} className="inline-block px-2 py-1 bg-danger-500/10 text-danger-400 rounded text-sm mr-2">
                    {s.stageName}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
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
                {stage.duration ? formatDuration(stage.duration) : stage.status === 'running' ? '运行中' : '等待中'}
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
            {stage.logs.length > 0 ? (
              stage.logs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-2 p-2 bg-dark-700/30 rounded"
                >
                  <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />
                  <span className="text-sm text-dark-300 truncate">{log.message}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-dark-500 py-4 text-sm">
                暂无步骤数据
              </div>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

function LogLine({ log, index, highlight, setErrorRef }: { log: BuildLog; index: number; highlight?: boolean; setErrorRef?: (el: HTMLDivElement | null) => void }) {
  const levelColors = {
    info: 'text-dark-300',
    warn: 'text-warning-400',
    error: 'text-danger-400',
    debug: 'text-dark-500',
  };

  return (
    <div
      ref={setErrorRef}
      data-highlight={highlight ? 'true' : 'false'}
      className={cn(
        'flex gap-4 py-0.5 transition-colors animate-fade-in',
        highlight ? 'bg-danger-500/20 border-l-2 border-danger-500' : 'hover:bg-dark-800/50'
      )}
      style={{ animationDelay: `${index * 10}ms` }}
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
