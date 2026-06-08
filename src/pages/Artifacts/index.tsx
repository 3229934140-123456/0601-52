import { useState, useRef } from 'react';
import {
  Package,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  HardDrive,
  Tag,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/SearchInput';
import { Modal } from '@/components/common/Modal';
import { Tabs } from '@/components/common/Tabs';
import { useArtifactStore } from '@/store/useArtifactStore';
import { getProjectById } from '@/data/projects';
import { getUserById } from '@/data/teams';
import { formatRelativeTime } from '@/utils/date';
import { formatFileSize } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Artifact } from '@/types';

const typeIcons: Record<string, typeof Package> = {
  docker: Package,
  jar: FileText,
  ipa: Package,
  apk: Package,
  npm: Package,
};

const artifactTypes = ['all', 'docker', 'jar', 'ipa', 'apk', 'npm'];

export function Artifacts() {
  const { artifacts, addArtifact, downloadArtifact } = useArtifactStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [expandedArtifact, setExpandedArtifact] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadProject, setUploadProject] = useState('');
  const [uploadVersion, setUploadVersion] = useState('');
  const [uploadType, setUploadType] = useState('docker');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const tabs = [
    { key: 'all', label: '全部制品' },
    { key: 'recent', label: '最近上传' },
    { key: 'my', label: '我的上传' },
  ];

  const filteredArtifacts = artifacts.filter((artifact) => {
    if (searchKeyword) {
      const lower = searchKeyword.toLowerCase();
      if (
        !artifact.name.toLowerCase().includes(lower) &&
        !artifact.version.toLowerCase().includes(lower)
      ) {
        return false;
      }
    }
    if (filterType !== 'all' && artifact.type !== filterType) return false;
    if (filterProject !== 'all' && artifact.projectId !== filterProject) return false;
    if (activeTab === 'my' && artifact.uploader !== 'user-1') return false;
    return true;
  }).sort((a, b) => {
    if (activeTab === 'recent') {
      return new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime();
    }
    return 0;
  });

  const projects = Array.from(new Set(artifacts.map((a) => a.projectId)));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUpload = () => {
    if (!uploadProject || !uploadVersion || !selectedFile) return;

    setUploading(true);

    setTimeout(() => {
      const ext = selectedFile.name.split('.').pop() || '';
      const type = uploadType || ext;

      addArtifact({
        buildId: 'build-manual',
        projectId: uploadProject,
        name: selectedFile.name.replace(/\.[^/.]+$/, ''),
        version: uploadVersion,
        size: selectedFile.size,
        type,
        uploader: 'user-1',
        metadata: {
          fileName: selectedFile.name,
          fileType: selectedFile.type || 'application/octet-stream',
          uploadedBy: '手动上传',
        },
      });

      setUploading(false);
      setShowUploadModal(false);
      setUploadProject('');
      setUploadVersion('');
      setSelectedFile(null);
      setUploadType('docker');
    }, 500);
  };

  const handleDownload = (artifact: Artifact, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadArtifact(artifact.id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">制品库</h2>
          <p className="text-dark-400 mt-1">管理和下载构建产物</p>
        </div>
        <Button leftIcon={<Upload className="w-4 h-4" />} onClick={() => setShowUploadModal(true)}>
          上传制品
        </Button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput
          value={searchKeyword}
          onChange={setSearchKeyword}
          placeholder="搜索制品名称或版本..."
          className="w-80"
        />

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dark-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-primary-500/50"
          >
            {artifactTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? '全部类型' : type.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-sm text-dark-100 focus:outline-none focus:border-primary-500/50"
          >
            <option value="all">全部项目</option>
            {projects.map((projectId) => {
              const project = getProjectById(projectId);
              return (
                <option key={projectId} value={projectId}>
                  {project?.name || projectId}
                </option>
              );
            })}
          </select>
        </div>

        <div className="ml-auto text-sm text-dark-400">
          共 {filteredArtifacts.length} 个制品
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArtifacts.map((artifact, index) => (
          <ArtifactCard
            key={artifact.id}
            artifact={artifact}
            index={index}
            isExpanded={expandedArtifact === artifact.id}
            onToggle={() =>
              setExpandedArtifact(expandedArtifact === artifact.id ? null : artifact.id)
            }
            onDownload={(e) => handleDownload(artifact, e)}
          />
        ))}
      </div>

      {filteredArtifacts.length === 0 && (
        <Card>
          <Card.Body className="text-center py-12 text-dark-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无匹配的制品</p>
        </Card.Body>
        </Card>
      )}

      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
        }}
        title="上传制品"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowUploadModal(false);
              setSelectedFile(null);
            }}>
              取消
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadProject || !uploadVersion || !selectedFile || uploading}
            >
              {uploading ? '上传中...' : '上传'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              选择项目
            </label>
            <select
              value={uploadProject}
              onChange={(e) => setUploadProject(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50"
            >
              <option value="">请选择项目</option>
              {projects.map((projectId) => {
                const project = getProjectById(projectId);
                return (
                  <option key={projectId} value={projectId}>
                    {project?.name || projectId}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                版本号
              </label>
              <input
                type="text"
                value={uploadVersion}
                onChange={(e) => setUploadVersion(e.target.value)}
                placeholder="例如: v1.0.0"
                className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                类型
              </label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50"
              >
                {['docker', 'jar', 'ipa', 'apk', 'npm'].map((type) => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">
              选择文件
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-dark-600 rounded-lg p-6 text-center hover:border-primary-500/50 transition-colors cursor-pointer"
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-primary-400" />
                <div className="text-left">
                  <p className="text-sm text-dark-200 font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-dark-400">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="p-1 text-dark-400 hover:text-danger-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto text-dark-500 mb-2" />
                  <p className="text-sm text-dark-400">点击或拖拽文件到此处上传</p>
                  <p className="text-xs text-dark-500 mt-1">支持 .jar, .apk, .ipa, .zip 等格式</p>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface ArtifactCardProps {
  artifact: Artifact;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onDownload: (e: React.MouseEvent) => void;
}

function ArtifactCard({ artifact, index, isExpanded, onToggle, onDownload }: ArtifactCardProps) {
  const project = getProjectById(artifact.projectId);
  const uploader = getUserById(artifact.uploader);
  const TypeIcon = typeIcons[artifact.type] || Package;

  return (
    <Card
      className="animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div onClick={onToggle} className="cursor-pointer">
        <Card.Body>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-500/10 rounded-xl border border-primary-500/20">
                <TypeIcon className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{artifact.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Tag className="w-3 h-3 text-dark-500" />
                  <span className="text-sm text-dark-400">{artifact.version}</span>
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 text-xs bg-dark-700 text-dark-300 rounded uppercase">
              {artifact.type}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-dark-400">
              <HardDrive className="w-4 h-4" />
              <span>{formatFileSize(artifact.size)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-400">
              <Calendar className="w-4 h-4" />
              <span>{formatRelativeTime(artifact.uploadTime)}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {uploader && (
                <>
                  <img
                    src={uploader.avatar}
                    alt={uploader.name}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-xs text-dark-400">{uploader.name}</span>
                </>
              )}
            </div>
            <button
              className="p-1.5 text-dark-400 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </Card.Body>
      </div>

      {isExpanded && (
        <div className="px-6 pb-4">
          <div className="pt-4 border-t border-dark-700/50 space-y-3">
            <div>
              <p className="text-xs text-dark-500 mb-1">所属项目</p>
              <p className="text-sm text-dark-200">{project?.name}</p>
            </div>

            <div>
              <p className="text-xs text-dark-500 mb-2">元数据</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(artifact.metadata).map(([key, value]) => (
                  <div
                    key={key}
                    className="p-2 bg-dark-700/30 rounded text-xs"
                  >
                    <span className="text-dark-500">{key}: </span>
                    <span className="text-dark-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" leftIcon={<Download className="w-4 h-4" />} className="flex-1" onClick={onDownload}>
                下载
              </Button>
              <Button size="sm" variant="secondary" className="flex-1">
                详情
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
