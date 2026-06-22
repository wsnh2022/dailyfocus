export default function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[60] pb-16 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 dark:border-t dark:border-white/10 w-full max-w-md rounded-t-3xl p-6 pb-10 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
