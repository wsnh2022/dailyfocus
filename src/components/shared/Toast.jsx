import { useAppStore } from '../../store/useAppStore';

export default function Toast() {
  const toast = useAppStore(s => s.toast);

  if (!toast) return null;

  const colorClass = toast.type === 'error'
    ? 'bg-red-600'
    : 'bg-slate-800';

  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 ${colorClass} text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg z-50 max-w-xs text-center animate-in`}>
      {toast.message}
    </div>
  );
}
