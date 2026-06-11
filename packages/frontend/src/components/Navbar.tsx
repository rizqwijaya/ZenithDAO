import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, Users, Gift } from 'lucide-react';
import { ConnectWallet } from './ConnectWallet';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/proposals', label: 'Proposals', icon: FileText, end: false },
  { to: '/create', label: 'Create', icon: PlusCircle, end: false },
  { to: '/delegate', label: 'Delegate', icon: Users, end: false },
  { to: '/claim', label: 'Claim', icon: Gift, end: false },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <NavLink to="/" className="flex items-center gap-2.5">
          <img src="/zenith.svg" alt="ZenithDAO" className="h-9 w-9" />
          <div className="leading-tight">
            <div className="text-base font-bold tracking-tight text-white">ZenithDAO</div>
            <div className="hidden text-[10px] uppercase tracking-[0.2em] text-zenith-400 sm:block">
              Govern without limits
            </div>
          </div>
        </NavLink>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <ConnectWallet />
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-white/5 px-3 py-2 md:hidden">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5'
              }`
            }
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
