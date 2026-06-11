import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CreateProposalForm } from '../components/CreateProposalForm';

export function CreateProposal() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/proposals" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="h-4 w-4" /> All proposals
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Create proposal</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Propose a treasury action. It needs {`>`} the proposal threshold in delegated ZNTH.
        </p>
      </div>
      <CreateProposalForm />
    </div>
  );
}
