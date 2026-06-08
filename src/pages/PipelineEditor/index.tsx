import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  GripVertical,
  Plus,
  Settings,
  Trash2,
  ArrowLeft,
  Shield,
  Code,
  TestTube,
  Rocket,
  Terminal,
  ChevronDown,
  ChevronUp,
  Gauge,
} from 'lucide-react';
import { usePipelineStore } from '@/store/usePipelineStore';
import { useBuildStore } from '@/store/useBuildStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Tabs';
import { getProjectById } from '@/data/projects';
import { getUserById } from '@/data/teams';
import { cn } from '@/lib/utils';
import type { PipelineStep, QualityGateRule, PipelineStage } from '@/types';

const stepTypeConfig = {
  build: { icon: Code, label: '构建', color: 'text-primary-400 bg-primary-500/10' },
  test: { icon: TestTube, label: '测试', color: 'text-success-400 bg-success-500/10' },
  lint: { icon: Shield, label: '代码检查', color: 'text-warning-400 bg-warning-500/10' },
  deploy: { icon: Rocket, label: '部署', color: 'text-purple-400 bg-purple-500/10' },
  script: { icon: Terminal, label: '脚本', color: 'text-dark-300 bg-dark-700' },
};

export function PipelineEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentPipeline, setCurrentPipeline, isEditing, setIsEditing, reorderStages, updateQualityGate } = usePipelineStore();
  const { triggerBuild } = useBuildStore();
  const [activeTab, setActiveTab] = useState('stages');
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (projectId) {
      setCurrentPipeline(projectId);
    }
  }, [projectId, setCurrentPipeline]);

  const project = projectId ? getProjectById(projectId) : undefined;
  const owner = project ? getUserById(project.ownerId) : undefined;

  const handleTriggerBuild = () => {
    if (projectId) {
      const newBuildId = triggerBuild(projectId);
      navigate(`/build/${newBuildId}`);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderStages(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleQualityGateChange = (ruleId: string, threshold: number) => {
    if (!currentPipeline) return;
    const updatedRules = currentPipeline.qualityGate.rules.map((rule) =>
      rule.id === ruleId ? { ...rule, threshold } : rule
    );
    updateQualityGate(updatedRules);
  };

  const tabs = [
    { key: 'stages', label: '阶段编排', icon: <GripVertical className="w-4 h-4" /> },
    { key: 'quality-gate', label: '质量门禁', icon: <Shield className="w-4 h-4" /> },
    { key: 'settings', label: '设置', icon: <Settings className="w-4 h-4" /> },
  ];

  if (!currentPipeline || !project) {
    return <div className="text-dark-400">加载中...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">{currentPipeline.name}</h2>
              <span className="px-2 py-0.5 text-xs bg-dark-700 text-dark-300 rounded">
                {project.name}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-dark-400">
              {owner && (
                <span>负责人: {owner.name}</span>
              )}
              <span>{currentPipeline.stages.length} 个阶段</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? '完成编辑' : '编辑流水线'}
          </Button>
          <Button leftIcon={<Play className="w-4 h-4" />} onClick={handleTriggerBuild}>
            运行流水线
          </Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'stages' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">流水线阶段</h3>
              {isEditing && (
                <Button size="sm" variant="secondary" leftIcon={<Plus className="w-4 h-4" />}>
                  添加阶段
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {currentPipeline.stages.map((stage, index) => (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  index={index}
                  isEditing={isEditing}
                  isExpanded={expandedStage === stage.id}
                  onToggleExpand={() =>
                    setExpandedStage(expandedStage === stage.id ? null : stage.id)
                  }
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedIndex === index}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <Card.Body>
                <h4 className="font-semibold text-white mb-4">可用步骤</h4>
                <div className="space-y-2">
                  {Object.entries(stepTypeConfig).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <div
                        key={type}
                        className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 cursor-pointer transition-colors"
                        draggable
                      >
                        <div className={cn('p-2 rounded-lg', config.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-dark-200">{config.label}步骤</span>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <h4 className="font-semibold text-white mb-3">执行顺序</h4>
                <div className="space-y-2">
                  {currentPipeline.stages.map((stage, index) => (
                    <div
                      key={stage.id}
                      className="flex items-center gap-2 text-sm text-dark-300"
                    >
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-dark-700 text-xs">
                        {index + 1}
                      </span>
                      <span>{stage.name}</span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'quality-gate' && (
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">质量门禁</h3>
                <p className="text-sm text-dark-400 mt-1">
                  设置质量标准，构建结果将根据这些规则进行评估
                </p>
              </div>
              <Button size="sm" variant="secondary" leftIcon={<Plus className="w-4 h-4" />}>
                添加规则
              </Button>
            </div>

            <div className="grid gap-4">
              {currentPipeline.qualityGate.rules.map((rule) => (
                <QualityGateRuleItem
                  key={rule.id}
                  rule={rule}
                  isEditing={isEditing}
                  onChange={(value) => handleQualityGateChange(rule.id, value)}
                />
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card>
          <Card.Body>
            <h3 className="text-lg font-semibold text-white mb-6">流水线设置</h3>
            <div className="space-y-6 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">
                  流水线名称
                </label>
                <input
                  type="text"
                  defaultValue={currentPipeline.name}
                  className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-primary-500/50"
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">
                  描述
                </label>
                <textarea
                  rows={3}
                  placeholder="流水线描述"
                  className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 resize-none"
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-dark-200">触发方式</p>
                  <p className="text-xs text-dark-400">配置流水线的自动触发条件</p>
                </div>
                <span className="text-sm text-primary-400">代码推送</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-dark-200">超时时间</p>
                  <p className="text-xs text-dark-400">构建执行超时自动取消</p>
                </div>
                <span className="text-sm text-primary-400">60 分钟</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

interface StageCardProps {
  stage: PipelineStage;
  index: number;
  isEditing: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function StageCard({
  stage,
  index,
  isEditing,
  isExpanded,
  onToggleExpand,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}: StageCardProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isDragging && 'opacity-50 scale-[0.98]'
      )}
      draggable={isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <Card.Body>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEditing && (
              <GripVertical className="w-5 h-5 text-dark-500 cursor-grab" />
            )}
            <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-400">{index + 1}</span>
            </div>
            <div>
              <h4 className="font-medium text-white">{stage.name}</h4>
              <p className="text-xs text-dark-400">{stage.steps.length} 个步骤</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && (
              <button className="p-1.5 rounded-lg text-danger-400 hover:bg-danger-500/10 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-dark-700/50">
            <div className="space-y-2">
              {stage.steps.map((step) => (
                <StepItem key={step.id} step={step} isEditing={isEditing} />
              ))}
              {isEditing && (
                <button className="w-full py-2 border-2 border-dashed border-dark-700 rounded-lg text-dark-500 hover:text-dark-300 hover:border-dark-600 transition-colors text-sm">
                  <Plus className="w-4 h-4 inline mr-1" />
                  添加步骤
                </button>
              )}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

function StepItem({ step, isEditing }: { step: PipelineStep; isEditing: boolean }) {
  const config = stepTypeConfig[step.type] || stepTypeConfig.script;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 p-3 bg-dark-700/30 rounded-lg">
      {isEditing && (
        <GripVertical className="w-4 h-4 text-dark-500 cursor-grab flex-shrink-0" />
      )}
      <div className={cn('p-1.5 rounded', config.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-dark-100 truncate">{step.name}</p>
        <p className="text-xs text-dark-500 truncate">{step.script}</p>
      </div>
      {isEditing && (
        <button className="p-1 text-danger-400 hover:bg-danger-500/10 rounded transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function QualityGateRuleItem({
  rule,
  isEditing,
  onChange,
}: {
  rule: QualityGateRule;
  isEditing: boolean;
  onChange: (value: number) => void;
}) {
  const passed = rule.passed !== false;

  return (
    <div className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            passed ? 'bg-success-500/10' : 'bg-danger-500/10'
          )}
        >
          <Gauge className={cn('w-5 h-5', passed ? 'text-success-500' : 'text-danger-500')} />
        </div>
        <div>
          <p className="font-medium text-white">{rule.name}</p>
          <p className="text-sm text-dark-400">{rule.metric}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {rule.actualValue !== undefined && (
          <span className="text-sm text-dark-300">
            当前: <span className={passed ? 'text-success-400' : 'text-danger-400'}>{rule.actualValue}</span>
          </span>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-dark-400">阈值:</span>
          {isEditing ? (
            <input
              type="number"
              value={rule.threshold}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-16 px-2 py-1 bg-dark-700 border border-dark-600 rounded text-sm text-dark-100 text-right focus:outline-none focus:border-primary-500/50"
            />
          ) : (
            <span className="text-sm font-medium text-white">{rule.threshold}</span>
          )}
        </div>
        {rule.critical && (
          <span className="px-2 py-0.5 text-xs bg-danger-500/10 text-danger-400 rounded">
            关键
          </span>
        )}
      </div>
    </div>
  );
}
