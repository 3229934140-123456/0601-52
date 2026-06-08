import { useState } from 'react';
import {
  Rocket,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Plus,
  Calendar,
  Bell,
  Settings,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  CalendarClock,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tabs } from '@/components/common/Tabs';
import { Modal } from '@/components/common/Modal';
import { useReleaseStore } from '@/store/useReleaseStore';
import { getProjectById } from '@/data/projects';
import { getArtifactById, getArtifactsByProject } from '@/data/artifacts';
import { getUserById } from '@/data/teams';
import { projects } from '@/data/projects';
import { formatDateTime, formatRelativeTime } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { Release, ReleaseStatus, NotificationSubscription } from '@/types';

export function ReleaseApproval() {
  const {
    releases,
    releaseWindows,
    subscriptions,
    submitRelease,
    approveRelease,
    rejectRelease,
    toggleSubscription,
    addSubscription,
    removeSubscription,
  } = useReleaseStore();

  const [activeTab, setActiveTab] = useState('list');
  const [filterStatus, setFilterStatus] = useState<ReleaseStatus | 'all'>('all');
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAddSubModal, setShowAddSubModal] = useState(false);

  const [applyTitle, setApplyTitle] = useState('');
  const [applyProject, setApplyProject] = useState('');
  const [applyArtifact, setApplyArtifact] = useState('');
  const [applyWindow, setApplyWindow] = useState('');
  const [applyDesc, setApplyDesc] = useState('');

  const [approveComment, setApproveComment] = useState('');
  const [rejectComment, setRejectComment] = useState('');

  const [newSubEventType, setNewSubEventType] = useState<'build_failed' | 'release_approved' | 'release_rejected'>('build_failed');
  const [newSubChannel, setNewSubChannel] = useState<'email' | 'webhook' | 'in_app'>('email');
  const [newSubTarget, setNewSubTarget] = useState('');

  const tabs = [
    { key: 'list', label: '发布列表' },
    { key: 'windows', label: '发布窗口' },
    { key: 'subscriptions', label: '通知订阅' },
  ];

  const filteredReleases = releases
    .filter((r) => filterStatus === 'all' || r.status === filterStatus)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const projectArtifacts = applyProject ? getArtifactsByProject(applyProject) : [];

  const handleSubmitRelease = () => {
    if (!applyTitle || !applyProject || !applyArtifact) return;

    submitRelease({
      projectId: applyProject,
      artifactId: applyArtifact,
      title: applyTitle,
      description: applyDesc,
      releaseWindowId: applyWindow || undefined,
    });

    setShowApplyModal(false);
    setApplyTitle('');
    setApplyProject('');
    setApplyArtifact('');
    setApplyWindow('');
    setApplyDesc('');
  };

  const handleApprove = () => {
    if (!selectedRelease) return;

    const pendingApproval = selectedRelease.approvals.find((a) => a.status === 'pending');
    if (!pendingApproval) return;

    approveRelease(selectedRelease.id, pendingApproval.level, approveComment);

    const updated = releases.find((r) => r.id === selectedRelease.id);
    if (updated) {
      setSelectedRelease({ ...updated });
    }

    setApproveComment('');
  };

  const handleReject = () => {
    if (!selectedRelease) return;

    const pendingApproval = selectedRelease.approvals.find((a) => a.status === 'pending');
    if (!pendingApproval) return;

    rejectRelease(selectedRelease.id, pendingApproval.level, rejectComment);

    const updated = releases.find((r) => r.id === selectedRelease.id);
    if (updated) {
      setSelectedRelease({ ...updated });
    }

    setRejectComment('');
  };

  const handleAddSubscription = () => {
    if (!newSubTarget && newSubChannel !== 'in_app') return;

    addSubscription({
      userId: 'user-1',
      eventType: newSubEventType,
      channel: newSubChannel,
      target: newSubChannel === 'in_app' ? 'in_app' : newSubTarget,
    });

    setShowAddSubModal(false);
    setNewSubEventType('build_failed');
    setNewSubChannel('email');
    setNewSubTarget('');
  };

  const currentSelectedRelease = selectedRelease
    ? releases.find((r) => r.id === selectedRelease.id) || selectedRelease
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">发布审批</h2>
          <p className="text-dark-400 mt-1">管理发布申请和审批流程</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<Bell className="w-4 h-4" />}
            onClick={() => setShowSubscriptionModal(true)}
          >
            通知订阅
          </Button>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowApplyModal(true)}>
            提交发布
          </Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected', 'released'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                    filterStatus === status
                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800'
                  )}
                >
                  {status === 'all'
                    ? '全部'
                    : status === 'pending'
                    ? '待审批'
                    : status === 'approved'
                    ? '已通过'
                    : status === 'rejected'
                    ? '已驳回'
                    : '已发布'}
                </button>
              ))}
            </div>
            <div className="ml-auto text-sm text-dark-400">
              共 {filteredReleases.length} 条申请
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              {filteredReleases.map((release) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  isSelected={currentSelectedRelease?.id === release.id}
                  onClick={() => setSelectedRelease(release)}
                />
              ))}
              {filteredReleases.length === 0 && (
                <Card>
                  <Card.Body className="text-center py-12 text-dark-400">
                    <Rocket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无发布申请</p>
                  </Card.Body>
                </Card>
              )}
            </div>

            <div className="lg:col-span-2">
              {currentSelectedRelease ? (
                <ReleaseDetail
                  release={currentSelectedRelease}
                  approveComment={approveComment}
                  setApproveComment={setApproveComment}
                  rejectComment={rejectComment}
                  setRejectComment={setRejectComment}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ) : (
                <Card>
                  <Card.Body className="text-center py-16 text-dark-400">
                    <Rocket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>选择一个发布申请查看详情</p>
                  </Card.Body>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'windows' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {releaseWindows.map((window) => (
              <Card key={window.id}>
                <Card.Body>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary-500/10 rounded-lg">
                        <CalendarClock className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{window.name}</h3>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-dark-500" />
                      <span className="text-dark-300">
                        {formatDateTime(window.startTime)} - {formatDateTime(window.endTime)}
                      </span>
                    </div>
                    <p className="text-sm text-dark-400">{window.description}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dark-700/50">
                    <Button size="sm" variant="secondary" className="w-full">
                      查看详情
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">通知订阅</h3>
                <p className="text-sm text-dark-400 mt-1">
                  订阅发布相关的通知事件
                </p>
              </div>
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddSubModal(true)}>
                添加订阅
              </Button>
            </div>

            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <SubscriptionItem
                  key={sub.id}
                  subscription={sub}
                  onToggle={() => toggleSubscription(sub.id)}
                  onRemove={() => removeSubscription(sub.id)}
                />
              ))}
              {subscriptions.length === 0 && (
                <div className="text-center py-8 text-dark-400">
                  <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>暂无订阅</p>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      )}

      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="提交发布申请"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowApplyModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmitRelease}
              disabled={!applyTitle || !applyProject || !applyArtifact}
            >
              提交申请
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              发布标题
            </label>
            <input
              type="text"
              value={applyTitle}
              onChange={(e) => setApplyTitle(e.target.value)}
              placeholder="请输入发布标题"
              className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                选择项目
              </label>
              <select
                value={applyProject}
                onChange={(e) => {
                  setApplyProject(e.target.value);
                  setApplyArtifact('');
                }}
                className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50"
              >
                <option value="">请选择项目</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                选择制品
              </label>
              <select
                value={applyArtifact}
                onChange={(e) => setApplyArtifact(e.target.value)}
                className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50"
                disabled={!applyProject}
              >
                <option value="">请选择制品</option>
                {projectArtifacts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} - {a.version}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              发布窗口
            </label>
            <select
              value={applyWindow}
              onChange={(e) => setApplyWindow(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50"
            >
              <option value="">不指定发布窗口</option>
              {releaseWindows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} - {formatDateTime(w.startTime)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              发布说明
            </label>
            <textarea
              rows={4}
              value={applyDesc}
              onChange={(e) => setApplyDesc(e.target.value)}
              placeholder="请描述本次发布的内容..."
              className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        title="通知订阅"
        size="md"
      >
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <SubscriptionItem
              key={sub.id}
              subscription={sub}
              onToggle={() => toggleSubscription(sub.id)}
              onRemove={() => removeSubscription(sub.id)}
            />
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showAddSubModal}
        onClose={() => setShowAddSubModal(false)}
        title="添加订阅"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddSubModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleAddSubscription}
              disabled={newSubChannel !== 'in_app' && !newSubTarget}
            >
              添加
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              事件类型
            </label>
            <div className="space-y-2">
              {(['build_failed', 'release_approved', 'release_rejected'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setNewSubEventType(type)}
                  className={cn(
                    'w-full p-3 rounded-lg text-left transition-colors border',
                    newSubEventType === type
                      ? 'bg-primary-500/10 border-primary-500/30'
                      : 'bg-dark-700/30 border-transparent hover:bg-dark-700/50'
                  )}
                >
                  <span className="text-sm text-dark-200">
                    {type === 'build_failed' ? '构建失败' : type === 'release_approved' ? '发布通过' : '发布驳回'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              通知渠道
            </label>
            <div className="flex gap-2">
              {(['email', 'webhook', 'in_app'] as const).map((channel) => (
                <button
                  key={channel}
                  onClick={() => setNewSubChannel(channel)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg border text-sm transition-colors',
                    newSubChannel === channel
                      ? 'bg-primary-500/10 border-primary-500/30 text-primary-400'
                      : 'bg-dark-700/30 border-dark-600 text-dark-300 hover:bg-dark-700/50'
                  )}
                >
                  {channel === 'email' ? '邮件' : channel === 'webhook' ? 'Webhook' : '站内通知'}
                </button>
              ))}
            </div>
          </div>

          {newSubChannel !== 'in_app' && (
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                {newSubChannel === 'email' ? '邮箱地址' : 'Webhook URL'}
              </label>
              <input
                type="text"
                value={newSubTarget}
                onChange={(e) => setNewSubTarget(e.target.value)}
                placeholder={newSubChannel === 'email' ? '请输入邮箱地址' : '请输入 Webhook URL'}
                className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

interface ReleaseCardProps {
  release: Release;
  isSelected: boolean;
  onClick: () => void;
}

function ReleaseCard({ release, isSelected, onClick }: ReleaseCardProps) {
  const project = getProjectById(release.projectId);
  const applicant = getUserById(release.applicantId);

  return (
    <Card
      className={cn('cursor-pointer transition-all', isSelected && 'ring-2 ring-primary-500/50')}
      onClick={onClick}
    >
      <Card.Body>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white truncate">{release.title}</h4>
          </div>
          <StatusBadge status={release.status} size="sm" />
        </div>

        <p className="text-sm text-dark-400 mb-3">{project?.name}</p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {applicant && (
              <>
                <img
                  src={applicant.avatar}
                  alt={applicant.name}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-dark-400">{applicant.name}</span>
              </>
            )}
          </div>
          <span className="text-dark-500">{formatRelativeTime(release.createdAt)}</span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {release.approvals.map((approval, index) => (
            <div key={approval.id} className="flex items-center">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                  approval.status === 'approved'
                    ? 'bg-success-500/20 text-success-500'
                    : approval.status === 'rejected'
                    ? 'bg-danger-500/20 text-danger-500'
                    : 'bg-dark-700 text-dark-500'
                )}
              >
                {approval.status === 'approved' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : approval.status === 'rejected' ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
              </div>
              {index < release.approvals.length - 1 && (
                <ChevronRight className="w-3 h-3 text-dark-600" />
              )}
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}

interface ReleaseDetailProps {
  release: Release;
  approveComment: string;
  setApproveComment: (value: string) => void;
  rejectComment: string;
  setRejectComment: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}

function ReleaseDetail({
  release,
  approveComment,
  setApproveComment,
  rejectComment,
  setRejectComment,
  onApprove,
  onReject,
}: ReleaseDetailProps) {
  const project = getProjectById(release.projectId);
  const artifact = getArtifactById(release.artifactId);
  const applicant = getUserById(release.applicantId);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const hasPendingApproval = release.approvals.some((a) => a.status === 'pending');

  const handleConfirmApprove = () => {
    onApprove();
    setShowApprove(false);
  };

  const handleConfirmReject = () => {
    onReject();
    setShowReject(false);
  };

  return (
    <Card>
      <Card.Body className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">{release.title}</h3>
            <StatusBadge status={release.status} />
          </div>
          <p className="text-sm text-dark-400 mt-1">{project?.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-dark-700/30 rounded-lg">
            <p className="text-xs text-dark-500 mb-1">申请人</p>
            <div className="flex items-center gap-2">
              {applicant && (
                <>
                  <img
                    src={applicant.avatar}
                    alt={applicant.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-dark-200">{applicant.name}</span>
                </>
              )}
            </div>
          </div>
          <div className="p-3 bg-dark-700/30 rounded-lg">
            <p className="text-xs text-dark-500 mb-1">申请时间</p>
            <p className="text-sm text-dark-200">{formatDateTime(release.createdAt)}</p>
          </div>
          <div className="p-3 bg-dark-700/30 rounded-lg">
            <p className="text-xs text-dark-500 mb-1">关联制品</p>
            <p className="text-sm text-dark-200">{artifact?.version || '-'}</p>
          </div>
        </div>

        {release.releaseWindow && (
          <div className="p-4 bg-primary-500/5 border border-primary-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CalendarClock className="w-5 h-5 text-primary-400" />
              <span className="font-medium text-primary-400">发布窗口</span>
            </div>
            <p className="text-sm text-dark-300">{release.releaseWindow.name}</p>
            <p className="text-xs text-dark-500 mt-1">
              {formatDateTime(release.releaseWindow.startTime)} - {formatDateTime(release.releaseWindow.endTime)}
            </p>
          </div>
        )}

        <div>
          <h4 className="font-medium text-white mb-3">发布说明</h4>
          <p className="text-sm text-dark-300 leading-relaxed">{release.description}</p>
        </div>

        <div>
          <h4 className="font-medium text-white mb-3">审批流程</h4>
          <div className="space-y-3">
            {release.approvals.map((approval, index) => {
              const approver = getUserById(approval.approverId);
              const isLast = index === release.approvals.length - 1;
              return (
                <div key={approval.id} className="relative">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        approval.status === 'approved'
                          ? 'bg-success-500/20'
                          : approval.status === 'rejected'
                          ? 'bg-danger-500/20'
                          : 'bg-dark-700'
                      )}
                    >
                      {approval.status === 'approved' ? (
                        <CheckCircle2 className="w-4 h-4 text-success-500" />
                      ) : approval.status === 'rejected' ? (
                        <XCircle className="w-4 h-4 text-danger-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-dark-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {approver?.name || '审批人'}
                          </span>
                          <span className="text-xs text-dark-500">
                            第{index + 1}级审批
                          </span>
                        </div>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded',
                            approval.status === 'approved'
                              ? 'bg-success-500/10 text-success-400'
                              : approval.status === 'rejected'
                              ? 'bg-danger-500/10 text-danger-400'
                              : 'bg-dark-700 text-dark-400'
                          )}
                        >
                          {approval.status === 'approved'
                            ? '已通过'
                            : approval.status === 'rejected'
                            ? '已驳回'
                            : '待审批'}
                        </span>
                      </div>
                      {approval.comment && (
                        <p className="text-sm text-dark-400 mt-1">{approval.comment}</p>
                      )}
                      {approval.approvedAt && (
                        <p className="text-xs text-dark-500 mt-1">
                          {formatDateTime(approval.approvedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  {!isLast && (
                    <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-dark-700" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {release.status === 'pending' && hasPendingApproval && (
          <div className="flex gap-3 pt-4 border-t border-dark-700/50">
            <Button variant="secondary" className="flex-1" onClick={() => {
              setShowReject(true);
              setShowApprove(false);
            }}>
              驳回
            </Button>
            <Button className="flex-1" onClick={() => {
              setShowApprove(true);
              setShowReject(false);
            }}>
              通过
            </Button>
          </div>
        )}

        {showApprove && (
          <div className="p-4 bg-success-500/5 border border-success-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-success-500" />
              <span className="font-medium text-success-400">审批通过</span>
            </div>
            <textarea
              value={approveComment}
              onChange={(e) => setApproveComment(e.target.value)}
              placeholder="请输入审批意见（可选）"
              rows={3}
              className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-success-500/50 resize-none mb-3"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShowApprove(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleConfirmApprove}>
                确认通过
              </Button>
            </div>
          </div>
        )}

        {showReject && (
          <div className="p-4 bg-danger-500/5 border border-danger-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-5 h-5 text-danger-500" />
              <span className="font-medium text-danger-400">驳回申请</span>
            </div>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="请输入驳回原因"
              rows={3}
              className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-danger-500/50 resize-none mb-3"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShowReject(false)}>
                取消
              </Button>
              <Button size="sm" variant="danger" onClick={handleConfirmReject}>
                确认驳回
              </Button>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

interface SubscriptionItemProps {
  subscription: NotificationSubscription;
  onToggle: () => void;
  onRemove: () => void;
}

function SubscriptionItem({ subscription, onToggle, onRemove }: SubscriptionItemProps) {
  const eventLabels: Record<string, string> = {
    build_failed: '构建失败',
    release_approved: '发布通过',
    release_rejected: '发布驳回',
  };

  const channelLabels: Record<string, string> = {
    email: '邮件',
    webhook: 'Webhook',
    in_app: '站内通知',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-500/10 rounded-lg">
          <Bell className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <p className="font-medium text-white">
            {eventLabels[subscription.eventType] || subscription.eventType}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-dark-400">
              {channelLabels[subscription.channel] || subscription.channel}
            </span>
            <span className="text-xs text-dark-500">·</span>
            <span className="text-xs text-dark-500 truncate max-w-48">
              {subscription.target}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors flex-shrink-0',
            subscription.enabled ? 'bg-primary-500' : 'bg-dark-600'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all',
              subscription.enabled ? 'left-[22px]' : 'left-0.5'
            )}
          />
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 text-dark-500 hover:text-danger-400 hover:bg-danger-500/10 rounded transition-colors"
          title="删除订阅"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
