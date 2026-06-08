import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProjectList } from '@/pages/ProjectList';
import { PipelineEditor } from '@/pages/PipelineEditor';
import { BuildDetail } from '@/pages/BuildDetail';
import { CodeReview } from '@/pages/CodeReview';
import { Artifacts } from '@/pages/Artifacts';
import { ReleaseApproval } from '@/pages/ReleaseApproval';
import { Statistics } from '@/pages/Statistics';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/pipeline/:projectId" element={<PipelineEditor />} />
          <Route path="/build/:buildId" element={<BuildDetail />} />
          <Route path="/code-review/:buildId" element={<CodeReview />} />
          <Route path="/artifacts" element={<Artifacts />} />
          <Route path="/release" element={<ReleaseApproval />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
