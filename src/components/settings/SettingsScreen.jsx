import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { exportBackup, exportCsv, importBackup, clearAllData } from '../../utils/backupExport';
import { SOUND_PROFILES, getSoundProfile, setSoundProfile, soundBreakStart, getVoiceEnabled, setVoiceEnabled } from '../../utils/sound';
import Modal from '../shared/Modal';

export default function SettingsScreen() {
  const showToast      = useAppStore(s => s.showToast);
  const heroSubtitle   = useAppStore(s => s.heroSubtitle);
  const setHeroSubtitle = useAppStore(s => s.setHeroSubtitle);
  const fileRef        = useRef(null);
  const [soundProfile, setSoundProfileState] = useState(getSoundProfile);
  const [voiceOn, setVoiceOn]               = useState(getVoiceEnabled);
  const [subtitleDraft, setSubtitleDraft]   = useState(heroSubtitle);

  const handleSoundChange = (id) => {
    setSoundProfile(id);
    setSoundProfileState(id);
    if (id !== 'silent') soundBreakStart('Sample task', 5); // preview
  };

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

  const handleExportCsv = async () => {
    try {
      await exportCsv();
      showToast('CSV downloaded!');
    } catch {
      showToast('CSV export failed', 'error');
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

      {/* Dashboard */}
      <section className="mb-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
          Dashboard
        </h2>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Subtitle
          </label>
          <div className="flex gap-2 mt-1.5">
            <input
              type="text"
              value={subtitleDraft}
              onChange={e => setSubtitleDraft(e.target.value)}
              maxLength={40}
              placeholder="datacraft by yogi"
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-slate-400 bg-white"
            />
            <button
              onClick={() => { setHeroSubtitle(subtitleDraft.trim() || 'datacraft by yogi'); showToast('Dashboard updated'); }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold"
            >
              Save
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-1.5">Shown below "DailyFocus" on the home screen</p>
        </div>
      </section>

      {/* Pomodoro sound */}
      <section className="mb-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
          Pomodoro Sound
        </h2>
        <div className="bg-white rounded-2xl shadow-sm p-3">
          <div className="grid grid-cols-4 gap-2">
            {SOUND_PROFILES.map(p => (
              <button
                key={p.id}
                onClick={() => handleSoundChange(p.id)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  soundProfile === p.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                }`}
              >
                <span className="text-lg leading-none">{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">Tap to preview</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Voice announcements</p>
              <p className="text-xs text-slate-400">Speaks task name &amp; break duration</p>
            </div>
            <button
              onClick={() => { const next = !voiceOn; setVoiceEnabled(next); setVoiceOn(next); }}
              className={`w-12 h-6 rounded-full transition-colors relative ${voiceOn ? 'bg-slate-800' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${voiceOn ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </section>

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
            onClick={handleExportCsv}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50"
          >
            <span className="text-xl">📊</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-800">Export CSV</div>
              <div className="text-xs text-slate-400">Download history as spreadsheet</div>
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
