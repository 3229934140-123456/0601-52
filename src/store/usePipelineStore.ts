import { create } from 'zustand';
import type { Pipeline, PipelineStage, QualityGateRule } from '@/types';
import { pipelines as mockPipelines, getPipelineByProject } from '@/data/pipeline';

interface PipelineState {
  pipelines: Pipeline[];
  currentPipeline: Pipeline | null;
  isEditing: boolean;
  setCurrentPipeline: (projectId: string) => void;
  setIsEditing: (editing: boolean) => void;
  addStage: (stage: PipelineStage) => void;
  removeStage: (stageId: string) => void;
  reorderStages: (fromIndex: number, toIndex: number) => void;
  updateQualityGate: (rules: QualityGateRule[]) => void;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  pipelines: mockPipelines,
  currentPipeline: null,
  isEditing: false,
  
  setCurrentPipeline: (projectId) => {
    const pipeline = getPipelineByProject(projectId);
    set({ currentPipeline: pipeline || null });
  },
  
  setIsEditing: (editing) => set({ isEditing: editing }),
  
  addStage: (stage) => {
    set((state) => {
      if (!state.currentPipeline) return state;
      const updatedPipeline = {
        ...state.currentPipeline,
        stages: [...state.currentPipeline.stages, stage].sort((a, b) => a.order - b.order),
      };
      return {
        currentPipeline: updatedPipeline,
        pipelines: state.pipelines.map((p) =>
          p.id === updatedPipeline.id ? updatedPipeline : p
        ),
      };
    });
  },
  
  removeStage: (stageId) => {
    set((state) => {
      if (!state.currentPipeline) return state;
      const updatedPipeline = {
        ...state.currentPipeline,
        stages: state.currentPipeline.stages.filter((s) => s.id !== stageId),
      };
      return {
        currentPipeline: updatedPipeline,
        pipelines: state.pipelines.map((p) =>
          p.id === updatedPipeline.id ? updatedPipeline : p
        ),
      };
    });
  },
  
  reorderStages: (fromIndex, toIndex) => {
    set((state) => {
      if (!state.currentPipeline) return state;
      const stages = [...state.currentPipeline.stages];
      const [removed] = stages.splice(fromIndex, 1);
      stages.splice(toIndex, 0, removed);
      const updatedStages = stages.map((stage, index) => ({
        ...stage,
        order: index + 1,
      }));
      const updatedPipeline = {
        ...state.currentPipeline,
        stages: updatedStages,
      };
      return {
        currentPipeline: updatedPipeline,
        pipelines: state.pipelines.map((p) =>
          p.id === updatedPipeline.id ? updatedPipeline : p
        ),
      };
    });
  },
  
  updateQualityGate: (rules) => {
    set((state) => {
      if (!state.currentPipeline) return state;
      const updatedPipeline = {
        ...state.currentPipeline,
        qualityGate: {
          ...state.currentPipeline.qualityGate,
          rules,
        },
      };
      return {
        currentPipeline: updatedPipeline,
        pipelines: state.pipelines.map((p) =>
          p.id === updatedPipeline.id ? updatedPipeline : p
        ),
      };
    });
  },
}));
