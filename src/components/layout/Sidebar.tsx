import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  GitBranch,
  PlayCircle,
  Code2,
  Package,
  Rocket,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

const menuItems = [
  {
    key: 'projects',
    label: '项目列表',
    icon: LayoutDashboard,
    path: '/projects',
  },
  {
    key: 'pipeline',
    label: '流水线编排',
    icon: GitBranch,
    path: '/pipeline/proj-1',
  },
  {
    key: 'builds',
    label: '构建详情',
    icon: PlayCircle,
    path: '/build/build-1',
  },
  {
    key: 'code-review',
    label: '代码检查',
    icon: Code2,
    path: '/code-review/build-1',
  },
  {
    key: 'artifacts',
    label: '制品库',
    icon: Package,
    path: '/artifacts',
  },
  {
    key: 'release',
    label: '发布审批',
    icon: Rocket,
    path: '/release',
  },
  {
    key: 'statistics',
    label: '统计报表',
    icon: BarChart3,
    path: '/statistics',
  },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  const isActive = (path: string) => {
    if (path === '/projects') {
      return location.pathname === '/' || location.pathname === '/projects';
    }
    return location.pathname.startsWith(path.split('/').slice(0, 3).join('/'));
  };

  return (
    <aside
      className={cn(
        'h-screen bg-dark-900/80 backdrop-blur-xl border-r border-dark-700/50 flex flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-dark-700/50">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gradient">CI Platform</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors',
            sidebarCollapsed && 'hidden'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors absolute -right-3 top-5 bg-dark-800 border border-dark-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                active
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                  : 'text-dark-400 hover:text-white hover:bg-dark-800/50',
                sidebarCollapsed && 'justify-center px-0'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-primary-400')} />
              {!sidebarCollapsed && <span className="font-medium text-sm">{item.label}</span>}
              {active && !sidebarCollapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-dark-700/50">
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800/50 transition-colors',
            sidebarCollapsed && 'justify-center px-0'
          )}
          title={sidebarCollapsed ? '设置' : undefined}
        >
          <Settings className="w-5 h-5" />
          {!sidebarCollapsed && <span className="font-medium text-sm">设置</span>}
        </button>
      </div>
    </aside>
  );
}
