import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { exportBackup, importBackup, clearAllData } from '../../utils/backupExport';
import Modal from '../shared/Modal';

export default function SettingsScreen() {
  const showToast = useAppStore(s => s.showToast);
  const fileRef   = useRef(null);

  const [importing, setImporting]             = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing]               = useState(false);

  const handleExport = async () => {
    try {
      await exportBackup();
      showToast('Backup downloaded!');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const result = await importBackup(file);
      showToast(`Imported ${result.tasks} tasks, ${result.logs} days`);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      showToast(err.message || 'Import failed', 'error');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearAllData();
      showToast('All data cleared');
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      showToast('Failed to clear data', 'error');
      setClearing(false);
    }
    setShowClearConfirm(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-slate-800 mb-5">Settings</h1>

      {/* Backup */}
      <section className="mb-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
          Data Backup
        </h2>
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50"
          >
            <span className="text-xl">💾</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-800">Export Backup</div>
              <div className="text-xs text-slate-400">Download all data as JSON</div>
            </div>
            <span className="text-slate-300">›</span>
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 disabled:opacity-50"
          >
            <span className="text-xl">📂</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-800">
                {importing ? 'Importing…' : 'Import Backup'}
              </div>
              <div className="text-xs text-slate-400">Restore from a .json backup file</div>
            </div>
            <span className="text-slate-300">›</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </section>

      {/* Danger zone */}
      <section className="mb-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
          Data
        </h2>
        <div className="bg-white rounded-2xl shadow-sm">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50"
          >
            <span className="text-xl">🗑️</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-red-500">Clear All Data</div>
              <div className="text-xs text-slate-400">Permanently delete all tasks and history</div>
            </div>
            <span className="text-slate-300">›</span>
          </button>
        </div>
      </section>

      {/* App info */}
      <section>
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Version</span>
            <span className="text-sm text-slate-400">1.0.0</span>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          DailyFocus · Built for consistency.
        </p>
      </section>

      {showClearConfirm && (
        <Modal onClose={() => !clearing && setShowClearConfirm(false)}>
          <div className="text-center py-2">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Clear all data?</h2>
            <p className="text-sm text-slate-500 mb-6">
              This deletes every task, log, and session. Export a backup first if you want to keep your history.
            </p>
            <div className="space-y-2">
              <button
                onClick={handleClear}
                disabled={clearing}
                className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold text-sm disabled:opacity-50"
              >
                {clearing ? 'Clearing…' : 'Yes, delete everything'}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
