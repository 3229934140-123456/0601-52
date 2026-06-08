import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'success' | 'failed' | 'running' | 'pending' | 'cancelled' | 'skipped' | 'approved' | 'rejected' | 'released' | 'rolled_back';
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  success: {
    label: '成功',
    className: 'bg-success-500/10 text-success-500 border-success-500/20',
    dotColor: 'bg-success-500',
  },
  failed: {
    label: '失败',
    className: 'bg-danger-500/10 text-danger-500 border-danger-500/20',
    dotColor: 'bg-danger-500',
  },
  running: {
    label: '运行中',
    className: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
    dotColor: 'bg-primary-500 animate-pulse',
  },
  pending: {
    label: '等待中',
    className: 'bg-dark-600/50 text-dark-400 border-dark-600',
    dotColor: 'bg-dark-500',
  },
  cancelled: {
    label: '已取消',
    className: 'bg-dark-600/50 text-dark-400 border-dark-600',
    dotColor: 'bg-dark-500',
  },
  skipped: {
    label: '已跳过',
    className: 'bg-dark-600/50 text-dark-400 border-dark-600',
    dotColor: 'bg-dark-500',
  },
  approved: {
    label: '已通过',
    className: 'bg-success-500/10 text-success-500 border-success-500/20',
    dotColor: 'bg-success-500',
  },
  rejected: {
    label: '已驳回',
    className: 'bg-danger-500/10 text-danger-500 border-danger-500/20',
    dotColor: 'bg-danger-500',
  },
  released: {
    label: '已发布',
    className: 'bg-success-500/10 text-success-500 border-success-500/20',
    dotColor: 'bg-success-500',
  },
  rolled_back: {
    label: '已回滚',
    className: 'bg-warning-500/10 text-warning-500 border-warning-500/20',
    dotColor: 'bg-warning-500',
  },
};

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.className,
        sizeClasses,
        className
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', config.dotColor)} />
      {config.label}
    </span>
  );
}
