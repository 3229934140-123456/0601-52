import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, GitBranch, Clock, User, Filter } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/SearchInput';
import { Modal } from '@/components/common/Modal';
import { teams } from '@/data/teams';
import { getUserById, getTeamById } from '@/data/teams';
import { formatRelativeTime } from '@/utils/date';
import type { BuildStatus, Project } from '@/types';

const statusOptions: { value: BuildStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失败' },
  { value: 'running', label: '运行中' },
  { value: 'pending', label: '等待中' },
];

export function ProjectList() {
  const navigate = useNavigate();
  const {
    projects,
    searchKeyword,
    filterStatus,
    filterTeam,
    setSearchKeyword,
    setFilterStatus,
    setFilterTeam,
    getFilteredProjects,
    addProject,
  } = useProjectStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    teamId: 'team-1',
    repoUrl: '',
  });

  const filteredProjects = getFilteredProjects();

  const handleCreateProject = () => {
    const project: Project = {
      id: `proj-${Date.now()}`,
      name: newProject.name,
      description: newProject.description,
      teamId: newProject.teamId,
      ownerId: 'user-1',
      repoUrl: newProject.repoUrl,
      buildCount: 0,
      lastBuildStatus: 'pending',
      lastBuildTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    addProject(project);
    setShowCreateModal(false);
    setNewProject({ name: '', description: '', teamId: 'team-1', repoUrl: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">项目列表</h2>
          <p className="text-dark-400 mt-1">共 {projects.length} 个项目</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
          创建项目
        </Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput
          value={searchKeyword}
          onChange={setSearchKeyword}
          placeholder="搜索项目名称或描述..."
          className="w-80"
        />

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dark-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as BuildStatus | 'all')}
            className="px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-primary-500/50"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-primary-500/50"
          >
            <option value="all">全部团队</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProjects.map((project, index) => {
          const owner = getUserById(project.ownerId);
          const team = getTeamById(project.teamId);
          return (
            <Card
              key={project.id}
              hover
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
              onClick={() => navigate(`/pipeline/${project.id}`)}
            >
              <Card.Body className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/30 flex items-center justify-center">
                      <GitBranch className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{project.name}</h3>
                      <p className="text-xs text-dark-400">{team?.name}</p>
                    </div>
                  </div>
                  <StatusBadge status={project.lastBuildStatus} size="sm" />
                </div>

                <p className="text-sm text-dark-400 line-clamp-2">
                  {project.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-dark-400">
                    <Clock className="w-4 h-4" />
                    <span>{formatRelativeTime(project.lastBuildTime)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-dark-400">
                    <GitBranch className="w-4 h-4" />
                    <span>{project.buildCount} 次构建</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-dark-700/50">
                  {owner && (
                    <>
                      <img
                        src={owner.avatar}
                        alt={owner.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-xs text-dark-400">
                        负责人: {owner.name}
                      </span>
                    </>
                  )}
                </div>
              </Card.Body>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建新项目"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProject.name}>
              创建
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              项目名称
            </label>
            <input
              type="text"
              value={newProject.name}
              onChange={(e) =>
                setNewProject({ ...newProject, name: e.target.value })
              }
              placeholder="请输入项目名称"
              className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              项目描述
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
              placeholder="请输入项目描述"
              rows={3}
              className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              所属团队
            </label>
            <select
              value={newProject.teamId}
              onChange={(e) =>
                setNewProject({ ...newProject, teamId: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              代码仓库地址
            </label>
            <input
              type="text"
              value={newProject.repoUrl}
              onChange={(e) =>
                setNewProject({ ...newProject, repoUrl: e.target.value })
              }
              placeholder="https://git.example.com/..."
              className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
