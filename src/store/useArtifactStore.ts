import { create } from 'zustand';
import type { Artifact } from '@/types';
import { artifacts as mockArtifacts } from '@/data/artifacts';

interface ArtifactState {
  artifacts: Artifact[];
  addArtifact: (artifact: Omit<Artifact, 'id' | 'uploadTime' | 'downloadUrl'>) => void;
  getArtifactsByProject: (projectId: string) => Artifact[];
  getArtifactById: (id: string) => Artifact | undefined;
  downloadArtifact: (artifactId: string) => void;
}

export const useArtifactStore = create<ArtifactState>((set, get) => ({
  artifacts: mockArtifacts,
  
  addArtifact: (artifactData) => {
    const newArtifact: Artifact = {
      ...artifactData,
      id: `art-${Date.now()}`,
      uploadTime: new Date().toISOString(),
      downloadUrl: `/artifacts/art-${Date.now()}/download`,
    };
    
    set((state) => ({
      artifacts: [newArtifact, ...state.artifacts],
    }));
  },
  
  getArtifactsByProject: (projectId) => {
    return get().artifacts
      .filter((a) => a.projectId === projectId)
      .sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime());
  },
  
  getArtifactById: (id) => {
    return get().artifacts.find((a) => a.id === id);
  },
  
  downloadArtifact: (artifactId) => {
    const artifact = get().artifacts.find((a) => a.id === artifactId);
    if (!artifact) return;
    
    const content = `${artifact.name} v${artifact.version}
Type: ${artifact.type}
Size: ${artifact.size} bytes
Uploaded: ${artifact.uploadTime}

--- Artifact Metadata ---
${Object.entries(artifact.metadata).map(([k, v]) => `${k}: ${v}`).join('\n')}
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.name}-${artifact.version}.${artifact.type === 'jar' ? 'jar' : artifact.type === 'docker' ? 'tar' : artifact.type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
}));
