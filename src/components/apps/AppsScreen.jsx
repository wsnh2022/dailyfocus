import { useNavigate } from 'react-router-dom';

const APPS = [
  {
    id:    'pomodoro',
    name:  'Pomodoro',
    icon:  `${import.meta.env.BASE_URL}icons/pomodoro.png`,
    route: '/apps/pomodoro',
  },
  {
    id:    'english',
    name:  'English Reader',
    emoji: '📖',
    route: '/apps/english',
  },
];

export default function AppsScreen() {
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-slate-800 mb-4">Apps</h1>
      <div className="grid grid-cols-2 gap-3">
        {APPS.map(app => (
          <button
            key={app.id}
            onClick={() => navigate(app.route)}
            className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center gap-3 active:scale-95 transition-transform"
          >
            {app.icon
              ? <img src={app.icon} alt={app.name} className="w-16 h-16 rounded-2xl object-cover" />
              : <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-4xl">{app.emoji}</div>
            }
            <span className="text-sm font-semibold text-slate-700">{app.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
