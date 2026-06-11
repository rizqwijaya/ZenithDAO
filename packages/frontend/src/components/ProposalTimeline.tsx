import { Check, Circle, X } from 'lucide-react';

const HAPPY_PATH = ['pending', 'active', 'succeeded', 'queued', 'executed'] as const;
const NEGATIVE = new Set(['defeated', 'canceled', 'expired']);

const LABELS: Record<string, string> = {
  pending: 'Pending',
  active: 'Active',
  succeeded: 'Succeeded',
  queued: 'Queued',
  executed: 'Executed',
};

export function ProposalTimeline({ status }: { status: string }) {
  const isNegative = NEGATIVE.has(status);

  // How far along the happy path are we? Active is reached for negative outcomes too.
  let reached = HAPPY_PATH.indexOf(status as (typeof HAPPY_PATH)[number]);
  if (isNegative) reached = 1; // got through voting, then failed

  const steps = HAPPY_PATH.map((key, i) => ({
    key,
    label: LABELS[key],
    done: i <= reached && !(isNegative && i > 1),
    current: i === reached && !isNegative,
  }));

  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${
                  step.done
                    ? 'border-zenith-500 bg-zenith-500/20 text-zenith-200'
                    : 'border-white/15 bg-ink-900 text-zinc-600'
                } ${step.current ? 'ring-4 ring-zenith-500/20' : ''}`}
              >
                {step.done ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
              </div>
              <span
                className={`mt-1.5 text-[11px] font-medium ${
                  step.done ? 'text-zinc-200' : 'text-zinc-600'
                }`}
              >
                {step.label}
              </span>
            </div>
            {!last && (
              <div
                className={`mx-1 h-0.5 flex-1 rounded ${
                  i < reached && !(isNegative && i >= 1) ? 'bg-zenith-500/60' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        );
      })}

      {isNegative && (
        <div className="ml-3 flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300">
          <X className="h-3.5 w-3.5" />
          {LABELS[status] ?? status}
        </div>
      )}
    </div>
  );
}
