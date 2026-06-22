import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

const tabs = [
  { to: '/',        icon: '🏠', label: 'Home'    },
  { to: '/apps',    icon: '🧩', label: 'Apps'    },
  { to: '/history', icon: '📅', label: 'History' },
  { to: '/settings',icon: '⚙️', label: 'Settings'},
];

export default function BottomNav() {
  const pomodoroRunning = useAppStore(s => s.pomodoroRunning);
  if (pomodoroRunning) return null;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 z-50">
      <ul className="flex">
        {tabs.map(({ to, icon, label }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 text-xs gap-0.5 transition-colors ${
                  isActive ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-400 dark:text-slate-500'
                }`
              }
            >
              <span className="text-xl leading-none">{icon}</span>
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
