import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/',        icon: '🏠', label: 'Home'     },
  { to: '/editor',  icon: '📋', label: 'Tasks'     },
  { to: '/history', icon: '📅', label: 'History'   },
  { to: '/settings',icon: '⚙️', label: 'Settings'  },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 z-50">
      <ul className="flex">
        {tabs.map(({ to, icon, label }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 text-xs gap-0.5 transition-colors ${
                  isActive
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400'
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
