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
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tabs } from '@/components/common/Tabs';
import { Modal } from '@/components/common/Modal';
import { releases, releaseWindows, notificationSubscriptions } from '@/data/releases';
import { getProjectById } from '@/data/projects';
import { getArtifactById } from '@/data/artifacts';
import { getUserById } from '@/data/teams';
import { formatDateTime, formatRelativeTime } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { Release, ReleaseStatus, NotificationSubscription } from '@/types';

export function ReleaseApproval() {
  const [activeTab, setActiveTab] = useState('list');
  const [filterStatus, setFilterStatus] = useState<ReleaseStatus | 'all'>('all');
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [approveComment, setApproveComment] = useState('');
  const [rejectComment, setRejectComment] = useState('');

  const tabs = [
    { key: 'list', label: '发布列表' },
    { key: 'windows', label: '发布窗口' },
    { key: 'subscriptions', label: '通知订阅' },
  ];

  const filteredReleases = releases
    .filter((r) => filterStatus === 'all' || r.status === filterStatus)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
                  isSelected={selectedRelease?.id === release.id}
                  onClick={() => setSelectedRelease(release)}
                />
              ))}
            </div>

            <div className="lg:col-span-2">
              {selectedRelease ? (
                <ReleaseDetail
                  release={selectedRelease}
                  approveComment={approveComment}
                  setApproveComment={setApproveComment}
                  rejectComment={rejectComment}
                  setRejectComment={setRejectComment}
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
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                添加订阅
              </Button>
            </div>

            <div className="space-y-3">
              {notificationSubscriptions.map((sub) => (
                <SubscriptionItem key={sub.id} subscription={sub} />
              ))}
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
            <Button onClick={() => setShowApplyModal(false)}>提交申请</Button>
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
              placeholder="请输入发布标题"
              className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                选择项目
              </label>
              <select className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50">
                {releases.map((r) => {
                  const project = getProjectById(r.projectId);
                  return (
                    <option key={r.projectId} value={r.projectId}>
                      {project?.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                选择制品
              </label>
              <select className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50">
                <option value="">请选择制品</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              发布窗口
            </label>
            <select className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50">
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
              placeholder="请描述本次发布的内容..."
              className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              审批人
            </label>
            <div className="flex flex-wrap gap-2">
              {['赵强', '刘伟'].map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-dark-700/50 rounded-lg text-sm text-dark-200"
                >
                  <User className="w-4 h-4" />
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        title="通知订阅"
        size="md"
      >
        <div className="space-y-4">
          {notificationSubscriptions.map((sub) => (
            <SubscriptionItem key={sub.id} subscription={sub} />
          ))}
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
}

function ReleaseDetail({
  release,
  approveComment,
  setApproveComment,
  rejectComment,
  setRejectComment,
}: ReleaseDetailProps) {
  const project = getProjectById(release.projectId);
  const artifact = getArtifactById(release.artifactId);
  const applicant = getUserById(release.applicantId);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

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

        {release.status === 'pending' && (
          <div className="flex gap-3 pt-4 border-t border-dark-700/50">
            <Button variant="secondary" className="flex-1" onClick={() => setShowReject(true)}>
              驳回
            </Button>
            <Button className="flex-1" onClick={() => setShowApprove(true)}>
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
              <Button size="sm" onClick={() => setShowApprove(false)}>
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
              <Button size="sm" variant="danger" onClick={() => setShowReject(false)}>
                确认驳回
              </Button>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

function SubscriptionItem({ subscription }: { subscription: NotificationSubscription }) {
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

      <div className="flex items-center gap-2">
        <button
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors',
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
      </div>
    </div>
  );
}
