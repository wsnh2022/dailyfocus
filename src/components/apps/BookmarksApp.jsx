import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Trash2, Pencil, Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const STORE_KEY = 'df_repo_bookmarks';

function parseGithubUrl(raw) {
  try {
    const u = new URL(raw.trim());
    if (!/github\.com$/i.test(u.hostname)) return { ok: false };
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return { ok: false };
    const [owner, repo, , branch, ...path] = parts;
    return {
      ok: true,
      owner,
      repo: repo.replace(/\.git$/, ''),
      branch: branch || 'main',
      path: path.join('/'),
    };
  } catch {
    return { ok: false };
  }
}

function defaultLabel(url) {
  const p = parseGithubUrl(url);
  if (!p.ok) return url;
  return p.path ? `${p.owner}/${p.repo}/${p.path}` : `${p.owner}/${p.repo}`;
}

function formatRelative(ts) {
  if (!ts) return 'never';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)    return 'just now';
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)   return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function BookmarksApp() {
  const navigate  = useNavigate();
  const showToast = useAppStore(s => s.showToast);

  const [bookmarks, setBookmarks] = useState([]);
  const [url,       setUrl]       = useState('');
  const [label,     setLabel]     = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText,  setEditText]  = useState('');
  const urlInputRef = useRef(null);

  useEffect(() => {
    try { setBookmarks(JSON.parse(localStorage.getItem(STORE_KEY) || '[]')); } catch {}
  }, []);

  const persist = (next) => {
    setBookmarks(next);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  };

  const addBookmark = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const parsed = parseGithubUrl(trimmed);
    if (!parsed.ok) {
      showToast('Not a valid GitHub URL', 'error');
      return;
    }
    if (bookmarks.some(b => b.url === trimmed)) {
      showToast('Already bookmarked', 'error');
      return;
    }
    const entry = {
      id:           Date.now(),
      url:          trimmed,
      label:        label.trim() || defaultLabel(trimmed),
      addedAt:      Date.now(),
      lastOpenedAt: null,
    };
    persist([entry, ...bookmarks]);
    setUrl(''); setLabel('');
    showToast('Bookmark saved', 'success');
  };

  const openBookmark = (b) => {
    window.open(b.url, '_blank', 'noopener,noreferrer');
    const next = bookmarks.map(x => x.id === b.id ? { ...x, lastOpenedAt: Date.now() } : x);
    persist(next);
  };

  const deleteBookmark = (id) => {
    persist(bookmarks.filter(b => b.id !== id));
    showToast('Bookmark removed', 'success');
  };

  const startEdit = (b) => {
    setEditingId(b.id);
    setEditText(b.label);
  };

  const saveEdit = (id) => {
    const next = bookmarks.map(b => b.id === id ? { ...b, label: editText.trim() || b.label } : b);
    persist(next);
    setEditingId(null);
  };

  const sorted = [...bookmarks].sort((a, b) =>
    (b.lastOpenedAt || b.addedAt) - (a.lastOpenedAt || a.addedAt)
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-32">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/apps'); }}
          className="w-10 h-10 -ml-2 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors text-xl"
          aria-label="Back"
        >←</button>
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-tight">Repo Bookmarks</h1>
          <p className="text-white/40 text-xs">Quick links to GitHub files & folders</p>
        </div>
      </div>

      <div className="px-4 space-y-2 mb-5">
        <input
          ref={urlInputRef}
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addBookmark(); }}
          placeholder="Paste a github.com URL"
          className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white/90 placeholder-white/25 border border-white/5 focus:outline-none focus:border-white/25 transition-colors"
        />
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addBookmark(); }}
          placeholder="Label (optional)"
          className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white/90 placeholder-white/25 border border-white/5 focus:outline-none focus:border-white/25 transition-colors"
        />
        <button
          onClick={addBookmark}
          disabled={!url.trim()}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
            url.trim()
              ? 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          <Plus size={16} /> Save bookmark
        </button>
      </div>

      <div className="px-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-white/20 text-sm">No bookmarks yet</p>
            <p className="text-white/15 text-xs">Paste a GitHub URL above to start</p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl overflow-hidden">
            {sorted.map((b, i) => (
              <div
                key={b.id}
                className={`flex items-center gap-2 px-3 py-3 ${i > 0 ? 'border-t border-white/5' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  {editingId === b.id ? (
                    <input
                      autoFocus
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onBlur={() => saveEdit(b.id)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(b.id); if (e.key === 'Escape') setEditingId(null); }}
                      className="w-full bg-white/10 rounded px-2 py-1 text-sm text-white border border-white/20 focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => openBookmark(b)}
                      className="block w-full text-left min-w-0"
                    >
                      <p className="text-sm text-white/85 truncate font-medium">{b.label}</p>
                      <p className="text-xs text-white/30 truncate mt-0.5">{b.url.replace(/^https?:\/\//, '')}</p>
                      <p className="text-[10px] text-white/20 mt-0.5">opened {formatRelative(b.lastOpenedAt)}</p>
                    </button>
                  )}
                </div>
                {editingId !== b.id && (
                  <>
                    <button
                      onClick={() => openBookmark(b)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center text-emerald-400/80 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                      aria-label="Open"
                    >
                      <ExternalLink size={15} />
                    </button>
                    <button
                      onClick={() => startEdit(b)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors"
                      aria-label="Rename"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteBookmark(b.id)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
