import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Proposals } from './pages/Proposals';
import { ProposalDetail } from './pages/ProposalDetail';
import { CreateProposal } from './pages/CreateProposal';
import { Delegate } from './pages/Delegate';
import { Claim } from './pages/Claim';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="/proposals/:id" element={<ProposalDetail />} />
        <Route path="/create" element={<CreateProposal />} />
        <Route path="/delegate" element={<Delegate />} />
        <Route path="/claim" element={<Claim />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
}
