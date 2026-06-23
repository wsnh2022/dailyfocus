import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pencil, FileEdit, FolderInput, Copy, Download, Upload, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import CompletionRatingSheet from './CompletionRatingSheet';

const PASSAGES_KEY = 'df_english_passages';
const FOLDERS_KEY  = 'df_english_folders';
const GOAL_KEY     = 'df_english_goal';
const dayKey = () => `df_english_words_${new Date().toISOString().split('T')[0]}`;

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function parseContent(text) {
  const clean = text.replace(/^﻿/, ''); // strip Windows BOM
  const BULLET = /^[-•*]\s/;
  return clean.split(/\n{2,}/).flatMap(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    if (!lines.some(l => BULLET.test(l))) return [{ type: 'para', text: lines.join(' ') }];
    // Split mixed blocks (title line + bullets) into separate para/list segments
    const out = [];
    let bullets = [], textLines = [];
    for (const line of lines) {
      if (BULLET.test(line)) {
        if (textLines.length) { out.push({ type: 'para', text: textLines.join(' ') }); textLines = []; }
        bullets.push(line.replace(/^[-•*]\s+/, ''));
      } else {
        if (bullets.length) { out.push({ type: 'list', items: [...bullets] }); bullets = []; }
        textLines.push(line);
      }
    }
    if (bullets.length) out.push({ type: 'list', items: bullets });
    if (textLines.length) out.push({ type: 'para', text: textLines.join(' ') });
    return out;
  });
}

function generateTitle() {
  const now = new Date();
  return `Reading – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
}

function downloadTxt(title, content) {
  const safe = title.replace(/[^\w\s-]/g, '').trim() || 'reading';
  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${safe}.txt`; a.click();
  URL.revokeObjectURL(url);
}

export default function EnglishApp() {
  const navigate   = useNavigate();
  const showToast  = useAppStore(s => s.showToast);

  const [view,         setView]         = useState('home');
  const [content,      setContent]      = useState('');
  const [readingTitle, setReadingTitle] = useState('');

  const [inputText,    setInputText]    = useState('');
  const [inputTitle,   setInputTitle]   = useState('');
  const [saveFolderId, setSaveFolderId] = useState(null);

  const [speed,          setSpeed]          = useState(1.0);
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [fontSize,       setFontSize]       = useState(() => Number(localStorage.getItem('df_english_font_size') || 28));
  const [sortOrder,      setSortOrder]      = useState(() => localStorage.getItem('df_english_sort') || 'asc');

  const changeFontSize = (delta) => {
    setFontSize(prev => {
      const next = Math.min(48, Math.max(16, prev + delta));
      localStorage.setItem('df_english_font_size', String(next));
      return next;
    });
  };

  const [wordsToday,     setWordsToday]     = useState(0);
  const [passages,       setPassages]       = useState([]);
  const [folders,        setFolders]        = useState([]);
  const [importing,         setImporting]         = useState(false);
  const [importingCount,    setImportingCount]    = useState(0);
  const [importingProgress, setImportingProgress] = useState(0);
  const [selectMode,     setSelectMode]     = useState(false);
  const [selectedIds,    setSelectedIds]    = useState(() => new Set());

  const [expandedFolders, setExpandedFolders] = useState(() => new Set(['uncategorized']));
  const [showNewFolder,   setShowNewFolder]   = useState(false);
  const [newFolderName,   setNewFolderName]   = useState('');

  const [libraryMenuOpen,  setLibraryMenuOpen]  = useState(false);
  const [librarySheetOpen, setLibrarySheetOpen] = useState(false);
  const [confirmClearAll,  setConfirmClearAll]  = useState(false);
  const [clearAllInput,    setClearAllInput]    = useState('');

  const [menuPassageId,       setMenuPassageId]       = useState(null);
  const [sheetOpen,           setSheetOpen]           = useState(false);
  const [movingId,            setMovingId]            = useState(null);
  const [copyingId,           setCopyingId]           = useState(null);
  const [editingId,           setEditingId]           = useState(null);
  const [editingTitle,        setEditingTitle]        = useState('');
  const [editingPassageId,    setEditingPassageId]    = useState(null);
  const [readingPassageId,    setReadingPassageId]    = useState(null);
  const readingPassageIdRef                            = useRef(null);
  const [ratingSheetOpen,     setRatingSheetOpen]     = useState(false);
  const [reviewFilter,        setReviewFilter]        = useState('all');
  const [addViewNewFolder,    setAddViewNewFolder]    = useState(false);
  const [addViewFolderName,   setAddViewFolderName]   = useState('');

  const [goal,        setGoal]        = useState(() => Number(localStorage.getItem(GOAL_KEY) || 100));
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput,   setGoalInput]   = useState('');

  const scrollRef       = useRef(null);
  const posRef          = useRef(0);
  const speedRef        = useRef(speed);
  const folderInputRef  = useRef(null);
  const backupInputRef  = useRef(null);
  const txtFilesInputRef = useRef(null);
  const exitCalledRef   = useRef(false);
  const longPressRef    = useRef(null);
  const pausePointsRef  = useRef([]);
  const nextPauseIdxRef = useRef(0);
  const pauseUntilRef   = useRef(0);
  const touchActiveRef  = useRef(false);
  const lastTouchYRef   = useRef(0);

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { readingPassageIdRef.current = readingPassageId; }, [readingPassageId]);
  useEffect(() => { if (folderInputRef.current) folderInputRef.current.setAttribute('webkitdirectory', ''); }, [view]);

  // Hardware back button interception in reading view
  useEffect(() => {
    if (view !== 'reading') return;
    exitCalledRef.current = false;
    window.history.pushState({ englishReading: true }, '');
    const handler = () => {
      if (exitCalledRef.current) return;
      exitCalledRef.current = true;
      setIsPlaying(false);
      posRef.current = 0; setScrollProgress(0);
      setView('home');
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [view]);

  // Calculate paragraph pause points after reading view renders
  useEffect(() => {
    if (view !== 'reading') return;
    pausePointsRef.current = [];
    nextPauseIdxRef.current = 0;
    pauseUntilRef.current = 0;
    const timer = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const containerTop = el.getBoundingClientRect().top;
      const centerY = el.clientHeight / 2;
      const blocks = el.querySelectorAll('[data-block]');
      const points = [];
      blocks.forEach(block => {
        const pauseAt = block.getBoundingClientRect().bottom - containerTop + el.scrollTop - centerY;
        if (pauseAt > 0) points.push(pauseAt);
      });
      pausePointsRef.current = points.sort((a, b) => a - b);
    }, 200);
    return () => clearTimeout(timer);
  }, [view, content]);

  // Swipe-to-rewind touch handlers
  const handleTouchStart = useCallback((e) => {
    touchActiveRef.current = true;
    lastTouchYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const currentY = e.touches[0].clientY;
    const deltaY = lastTouchYRef.current - currentY;
    lastTouchYRef.current = currentY;
    posRef.current = Math.max(0, posRef.current + deltaY * 1.2);
    if (scrollRef.current) scrollRef.current.scrollTop = posRef.current;
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchActiveRef.current = false;
    pauseUntilRef.current = 0;
    const points = pausePointsRef.current;
    const idx = points.findIndex(p => p > posRef.current);
    nextPauseIdxRef.current = idx === -1 ? points.length : idx;
  }, []);

  // Attach non-passive touchmove listener (required for e.preventDefault on Android)
  useEffect(() => {
    if (view !== 'reading') return;
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [view, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Sheet animation
  useEffect(() => {
    if (menuPassageId) {
      const raf = requestAnimationFrame(() => setSheetOpen(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [menuPassageId]);

  const closeSheet = () => {
    setSheetOpen(false);
    setTimeout(() => { setMenuPassageId(null); setMovingId(null); setCopyingId(null); }, 280);
  };

  const openLibraryMenu = () => {
    setLibraryMenuOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setLibrarySheetOpen(true)));
  };
  const closeLibraryMenu = () => {
    setLibrarySheetOpen(false);
    setTimeout(() => { setLibraryMenuOpen(false); setConfirmClearAll(false); setClearAllInput(''); }, 280);
  };

  const clearAllData = () => {
    persistPassages([]);
    persistFolders([]);
    closeLibraryMenu();
    showToast('All files and folders deleted', 'success');
  };

  // Hydrate
  useEffect(() => {
    const stored = localStorage.getItem(dayKey());
    if (stored) setWordsToday(Number(stored));
    try { setPassages(JSON.parse(localStorage.getItem(PASSAGES_KEY) || '[]')); } catch {}
    try { setFolders(JSON.parse(localStorage.getItem(FOLDERS_KEY)  || '[]')); } catch {}
  }, []);

  const addWords = useCallback((words) => {
    if (words <= 0) return;
    setWordsToday(prev => {
      const next = prev + words;
      localStorage.setItem(dayKey(), String(next));
      return next;
    });
  }, []);

  const persistPassages = (updated) => {
    setPassages(updated);
    localStorage.setItem(PASSAGES_KEY, JSON.stringify(updated));
  };
  const persistFolders = (updated) => {
    setFolders(updated);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(updated));
  };

  const autoSavePassage = (text, rawTitle, folderId) => {
    const title = rawTitle.trim() || generateTitle();
    const targetFolder = folderId ?? null;
    const idx = passages.findIndex(p =>
      p.title.toLowerCase() === title.toLowerCase() &&
      (p.folderId ?? null) === targetFolder
    );
    if (idx >= 0) {
      const existing = passages[idx];
      const updated = [...passages];
      updated[idx] = { ...existing, content: text.trim(), folderId: targetFolder };
      persistPassages(updated);
      return existing.id;
    }
    const newId = Date.now();
    const newPassage = { id: newId, title, content: text.trim(), folderId: targetFolder, createdAt: new Date().toISOString() };
    persistPassages([newPassage, ...passages]);
    return newId;
  };

  const ratePassage = (passageId, rating) => {
    if (!passageId) return;
    setPassages(prev => {
      const updated = prev.map(p =>
        p.id === passageId ? { ...p, review: { rating, ratedAt: Date.now() } } : p
      );
      localStorage.setItem(PASSAGES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleRatePassage = (rating) => {
    ratePassage(readingPassageId, rating);
    setRatingSheetOpen(false);
    showToast(rating === 'got-it' ? 'Marked as got it' : 'Marked to read again', 'success');
    setTimeout(exitReader, 280);
  };

  const handleSkipRating = () => {
    setRatingSheetOpen(false);
    setTimeout(exitReader, 280);
  };

  // RAF scroll loop with paragraph auto-pause and swipe override
  useEffect(() => {
    if (!isPlaying || view !== 'reading') return;
    let rafId, frame = 0;
    let completionFired = false;

    const finishReading = () => {
      if (completionFired) return;
      completionFired = true;
      setIsPlaying(false);
      setScrollProgress(1);
      addWords(countWords(content));
      if (readingPassageIdRef.current) setRatingSheetOpen(true);
    };

    const step = (timestamp) => {
      const el = scrollRef.current;
      if (!el) return;
      if (touchActiveRef.current) { rafId = requestAnimationFrame(step); return; }
      if (timestamp < pauseUntilRef.current) { rafId = requestAnimationFrame(step); return; }

      const points = pausePointsRef.current;
      // Finish right after the last paragraph's pause settles, no need to scroll
      // through the trailing 85vh padding.
      if (points.length > 0 && nextPauseIdxRef.current >= points.length) {
        finishReading();
        return;
      }

      posRef.current += speedRef.current * 0.7;
      el.scrollTop = posRef.current;
      if (nextPauseIdxRef.current < points.length && posRef.current >= points[nextPauseIdxRef.current]) {
        pauseUntilRef.current = timestamp + 1500;
        nextPauseIdxRef.current++;
      }
      const maxScroll = el.scrollHeight - el.clientHeight;
      const progress  = maxScroll > 0 ? Math.min(posRef.current / maxScroll, 1) : 0;
      if (++frame % 10 === 0) setScrollProgress(progress);
      if (posRef.current >= maxScroll) {
        finishReading();
        return;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, view, content, addWords]);

  // Actions
  const startReading = (text, title, folderId) => {
    const passageId = autoSavePassage(text, title ?? inputTitle, folderId ?? saveFolderId);
    setReadingPassageId(passageId);
    readingPassageIdRef.current = passageId;
    setRatingSheetOpen(false);
    setContent(text);
    setReadingTitle(title ?? inputTitle ?? '');
    posRef.current = 0; setScrollProgress(0); setIsPlaying(false);
    nextPauseIdxRef.current = 0;
    pauseUntilRef.current = 0;
    setMenuPassageId(null);
    setView('reading');
    setTimeout(() => { if (scrollRef.current) { scrollRef.current.scrollTop = 0; posRef.current = 0; } }, 50);
  };

  const exitReader = () => {
    if (exitCalledRef.current) return;
    exitCalledRef.current = true;
    setIsPlaying(false);
    if (scrollProgress > 0.05) addWords(Math.round(countWords(content) * scrollProgress));
    posRef.current = 0; setScrollProgress(0);
    setRatingSheetOpen(false);
    setReadingPassageId(null);
    setView('home');
    window.history.back();
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    persistFolders([...folders, { id: Date.now(), name: newFolderName.trim() }]);
    setNewFolderName(''); setShowNewFolder(false);
  };

  const createFolderInAddView = () => {
    const name = addViewFolderName.trim();
    if (!name) return;
    const newId = Date.now();
    persistFolders([...folders, { id: newId, name }]);
    setSaveFolderId(newId);
    setAddViewFolderName(''); setAddViewNewFolder(false);
  };

  const deletePassage = (id) => {
    const remaining = passages.filter(p => p.id !== id);
    const usedFolderIds = new Set(remaining.map(p => p.folderId).filter(Boolean));
    const cleanedFolders = folders.filter(f => usedFolderIds.has(f.id));
    if (cleanedFolders.length !== folders.length) persistFolders(cleanedFolders);
    persistPassages(remaining);
    closeSheet();
  };

  const startLongPress = (id) => {
    longPressRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      setSelectMode(true);
      setSelectedIds(new Set([id]));
    }, 400);
  };
  const cancelLongPress = () => clearTimeout(longPressRef.current);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };
  const selectAll = () => setSelectedIds(new Set(passages.map(p => p.id)));
  const deleteSelected = () => {
    const count = selectedIds.size;
    const remaining = passages.filter(p => !selectedIds.has(p.id));
    const usedFolderIds = new Set(remaining.map(p => p.folderId).filter(Boolean));
    const cleanedFolders = folders.filter(f => usedFolderIds.has(f.id));
    if (cleanedFolders.length !== folders.length) persistFolders(cleanedFolders);
    persistPassages(remaining);
    exitSelectMode();
    showToast(`Deleted ${count} passage${count !== 1 ? 's' : ''}`, 'success');
  };

  const saveRename = (id) => {
    if (!editingTitle.trim()) { setEditingId(null); return; }
    setPassages(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, title: editingTitle.trim() } : p);
      localStorage.setItem(PASSAGES_KEY, JSON.stringify(updated));
      return updated;
    });
    setEditingId(null);
  };

  const movePassage = (passageId, targetFolderId) => {
    setPassages(prev => {
      const updated = prev.map(p => p.id === passageId ? { ...p, folderId: targetFolderId } : p);
      localStorage.setItem(PASSAGES_KEY, JSON.stringify(updated));
      return updated;
    });
    closeSheet();
  };

  const copyPassage = (passageId, targetFolderId) => {
    const src = passages.find(p => p.id === passageId);
    if (!src) return;
    const copy = { ...src, id: Date.now(), folderId: targetFolderId, createdAt: new Date().toISOString() };
    persistPassages([copy, ...passages]);
    closeSheet();
  };

  const toggleFolder = (id) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const saveGoal = () => {
    const val = Math.max(1, Number(goalInput) || goal);
    setGoal(val); localStorage.setItem(GOAL_KEY, String(val)); setEditingGoal(false);
  };

  const importFolder = async (files) => {
    const txtFiles = Array.from(files).filter(f => /\.(txt|text)$/i.test(f.name));
    if (txtFiles.length === 0) { showToast('No .txt files found in folder', 'error'); return; }
    setImportingCount(txtFiles.length);
    setImportingProgress(0);
    let idCounter = Date.now();
    const newFolders = [...folders];
    const folderIdByName = {};
    folders.forEach(f => { folderIdByName[f.name.toLowerCase()] = f.id; });

    const hasWebkitPaths = txtFiles.some(f => f.webkitRelativePath?.includes('/'));

    // Compute app folder key per file based on path depth:
    //   depth 2 (Root/file.txt)           → "Root" (the selected folder itself)
    //   depth 3 (Root/Sub/file.txt)        → "Sub"
    //   depth 4+ (Root/Phase/Day/file.txt) → "Phase › Day" (preserves uniqueness across phases)
    const getFolderKey = (file) => {
      if (!file.webkitRelativePath?.includes('/')) return null;
      const segs = file.webkitRelativePath.split('/');
      if (segs.length === 2) return segs[0];
      if (segs.length === 3) return segs[1];
      return `${segs[segs.length - 3]} › ${segs[segs.length - 2]}`;
    };

    if (hasWebkitPaths) {
      const keys = [...new Set(txtFiles.map(getFolderKey).filter(Boolean))];
      for (const key of keys) {
        if (!folderIdByName[key.toLowerCase()]) {
          const id = idCounter++;
          newFolders.push({ id, name: key });
          folderIdByName[key.toLowerCase()] = id;
        }
      }
    }

    // Deduplicate by title+folderId so same filename in different folders is allowed
    const existingKeys = new Set(passages.map(p => `${p.title.toLowerCase()}|${p.folderId}`));
    const newPassages = [];
    let done = 0;
    const contents = await Promise.all(
      txtFiles.map(f => f.text().then(t => { setImportingProgress(++done); return t.replace(/^﻿/, ''); }))
    );
    for (let i = 0; i < txtFiles.length; i++) {
      const file = txtFiles[i];
      const text = contents[i];
      const title = file.name.replace(/\.[^/.]+$/, '').trim();
      const key = getFolderKey(file);
      const folderId = key ? (folderIdByName[key.toLowerCase()] ?? null) : null;
      if (existingKeys.has(`${title.toLowerCase()}|${folderId}`)) continue;
      newPassages.push({ id: idCounter++, title, content: text.trim(), folderId, createdAt: new Date().toISOString() });
    }
    if (newFolders.length !== folders.length) persistFolders(newFolders);
    persistPassages([...newPassages, ...passages]);
    showToast(`Imported ${newPassages.length} of ${txtFiles.length} files`, 'success');
  };

  const exportEnglishBackup = () => {
    const backup = { version: 1, exportedAt: new Date().toISOString(), passages, folders, goal };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `english-reader-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast(`Backed up ${passages.length} passages`, 'success');
  };

  const importEnglishBackup = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.version !== 1 || !Array.isArray(data.passages)) { showToast('Invalid backup file', 'error'); return; }
        persistPassages(data.passages);
        persistFolders(Array.isArray(data.folders) ? data.folders : []);
        if (data.goal) { setGoal(data.goal); localStorage.setItem(GOAL_KEY, String(data.goal)); }
        showToast(`Restored ${data.passages.length} passages`, 'success');
      } catch { showToast('Could not read backup file', 'error'); }
    };
    reader.readAsText(file);
  };

  const goalPct     = Math.min((wordsToday / goal) * 100, 100);
  const menuPassage = menuPassageId ? passages.find(p => p.id === menuPassageId) : null;

  const toggleSort = () => setSortOrder(prev => {
    const next = prev === 'asc' ? 'desc' : 'asc';
    localStorage.setItem('df_english_sort', next);
    return next;
  });

  const sortItems = (items) => [...items].sort((a, b) =>
    sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
  );

  const sortedFolders = [...folders].sort((a, b) =>
    sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
  );

  const matchesReviewFilter = (p) => {
    if (reviewFilter === 'all')        return true;
    if (reviewFilter === 'got-it')     return p.review?.rating === 'got-it';
    if (reviewFilter === 'read-again') return p.review?.rating === 'read-again';
    return true;
  };

  const rawSections = [
    { id: 'uncategorized', name: 'Uncategorized', items: sortItems(passages.filter(p => !p.folderId && matchesReviewFilter(p))) },
    ...sortedFolders.map(f => ({ id: f.id, name: f.name, items: sortItems(passages.filter(p => p.folderId === f.id && matchesReviewFilter(p))) })),
  ];

  const sections = reviewFilter === 'all'
    ? rawSections.filter(s => s.id === 'uncategorized' ? s.items.length > 0 || folders.length === 0 : true)
    : rawSections.filter(s => s.items.length > 0);

  const gotItTotal     = passages.filter(p => p.review?.rating === 'got-it').length;
  const readAgainTotal = passages.filter(p => p.review?.rating === 'read-again').length;

  // ── Reading view ───────────────────────────────────────────
  if (view === 'reading') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 100 }}>
        {/* Top bar */}
        <div className="shrink-0 px-4 pt-3 pb-1 flex items-center gap-3">
          <button onClick={exitReader} className="text-white/40 hover:text-white/70 transition-colors text-xl shrink-0">✕</button>
          <p className="flex-1 text-white/50 text-sm font-medium truncate">{readingTitle}</p>
          <div className="text-white/30 text-xs shrink-0">{Math.round(scrollProgress * 100)}%</div>
        </div>

        {/* Scroll area + spotlight overlay */}
        <div className="flex-1 relative min-h-0">
          <div ref={scrollRef} className="absolute inset-0 overflow-hidden" style={{ touchAction: 'none', userSelect: 'none' }}>
            <div style={{ paddingTop: '85vh', paddingBottom: '85vh', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
              {parseContent(content).map((block, i) =>
                block.type === 'list' ? (
                  <ul key={i} data-block="true" className="list-none mb-10 w-full" style={{ fontSize: `${fontSize}px` }}>
                    {block.items.map((item, j) => (
                      <li key={j} className="text-white font-bold leading-relaxed tracking-wide text-center mb-4">
                        <span className="text-white/30 mr-2">•</span>{item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p key={i} data-block="true" style={{ fontSize: `${fontSize}px` }} className="text-white font-bold text-center leading-relaxed mb-10 tracking-wide">
                    {block.text}
                  </p>
                )
              )}
            </div>
          </div>

          {/* Spotlight gradient - fades text above and below reading zone */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 15%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 68%, rgba(0,0,0,0.9) 85%, rgba(0,0,0,1) 100%)',
            zIndex: 2,
          }} />
        </div>

        {/* Bottom controls */}
        <div className="shrink-0 px-4 pb-10 pt-3 flex flex-col items-center gap-3">
          <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white/60 rounded-full" style={{ width: `${scrollProgress * 100}%`, transition: 'width 0.2s linear' }} />
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => changeFontSize(-2)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white/60 font-bold transition-colors select-none"
              style={{ fontSize: '15px' }}>A−</button>
            <button onClick={() => setIsPlaying(p => !p)}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform">
              <span className="text-black text-xl select-none">{isPlaying ? '⏸' : '▶'}</span>
            </button>
            <button onClick={() => changeFontSize(2)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white/60 font-bold transition-colors select-none"
              style={{ fontSize: '17px' }}>A+</button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setSpeed(s => Math.max(0.1, +(s - 0.1).toFixed(1)))}
              className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 active:bg-white/20 flex items-center justify-center text-white/40 hover:text-white/70 text-lg transition-colors select-none">−</button>
            <span className="text-white/35 text-xs w-16 text-center">{speed.toFixed(1)}× speed</span>
            <button onClick={() => setSpeed(s => Math.min(2.0, +(s + 0.1).toFixed(1)))}
              className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 active:bg-white/20 flex items-center justify-center text-white/40 hover:text-white/70 text-lg transition-colors select-none">+</button>
          </div>
          <p className="text-white/25 text-xs">{wordsToday} / {goal} words today · {fontSize}px</p>
        </div>
        <CompletionRatingSheet
          open={ratingSheetOpen}
          onRate={handleRatePassage}
          onSkip={handleSkipRating}
        />
      </div>
    );
  }

  // ── Add Content view ───────────────────────────────────────
  if (view === 'add') {
    return (
      <div className="min-h-screen bg-gray-950 text-white pb-10">
        <div className="px-4 pt-6 pb-4 flex items-center gap-3">
          <button onClick={() => { setView('home'); setEditingPassageId(null); }} className="text-white/50 hover:text-white/80 transition-colors text-lg">←</button>
          <h1 className="text-lg font-bold">{editingPassageId ? 'Edit Content' : 'Add Content'}</h1>
        </div>
        <div className="px-4 space-y-3">
          <input value={inputTitle} onChange={e => setInputTitle(e.target.value)}
            placeholder="Passage title (optional, auto-fills from filename)"
            className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white/90 placeholder-white/20 border border-white/5 focus:outline-none focus:border-white/25 transition-colors" />
          <textarea value={inputText} onChange={e => setInputText(e.target.value)}
            placeholder="Paste your English text here..."
            className="w-full bg-white/5 rounded-xl p-3 text-sm text-white/80 placeholder-white/25 resize-none border border-white/5 focus:outline-none focus:border-white/20 transition-colors"
            rows={10} autoFocus />
          <div className="space-y-1.5">
            <p className="text-white/30 text-xs">Save to folder:</p>
            <div className="flex flex-wrap gap-1.5 items-center">
              <button onClick={() => setSaveFolderId(null)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${saveFolderId === null ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                Uncategorized</button>
              {folders.map(f => (
                <button key={f.id} onClick={() => setSaveFolderId(f.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${saveFolderId === f.id ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                  {f.name}</button>
              ))}
              {addViewNewFolder ? (
                <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-0.5">
                  <input autoFocus value={addViewFolderName}
                    onChange={e => setAddViewFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') createFolderInAddView(); if (e.key === 'Escape') { setAddViewNewFolder(false); setAddViewFolderName(''); } }}
                    placeholder="Folder name"
                    className="bg-transparent text-xs text-white placeholder-white/25 focus:outline-none w-24" />
                  <button onClick={createFolderInAddView} className="text-emerald-400 font-bold text-xs px-1">✓</button>
                  <button onClick={() => { setAddViewNewFolder(false); setAddViewFolderName(''); }} className="text-white/30 text-xs">✕</button>
                </div>
              ) : (
                <button onClick={() => setAddViewNewFolder(true)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors">
                  + New folder</button>
              )}
            </div>
          </div>
          {inputText.trim() && (
            <div className="flex gap-2">
              <button onClick={() => { autoSavePassage(inputText, inputTitle, saveFolderId); setEditingPassageId(null); setInputTitle(''); setInputText(''); setView('home'); }}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl font-bold text-sm text-white transition-colors">
                {editingPassageId ? 'Save changes' : 'Save'}
              </button>
              <button onClick={() => { startReading(inputText, inputTitle, saveFolderId); setInputTitle(''); setEditingPassageId(null); }}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 rounded-xl font-bold text-sm transition-colors">
                ▶ Read · {countWords(inputText)} words
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Home / Library view ────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white pb-40">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/apps')} className="text-white/50 hover:text-white/80 transition-colors text-lg">←</button>
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-tight">English Reader</h1>
          <p className="text-white/40 text-xs">Teleprompter reading practice</p>
        </div>
        <button onClick={toggleSort}
          className="w-9 h-9 flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 rounded-xl transition-colors text-xs font-bold"
          title={sortOrder === 'asc' ? 'Sort A→Z (tap for Z→A)' : 'Sort Z→A (tap for A→Z)'}>
          {sortOrder === 'asc' ? 'A↑' : 'A↓'}
        </button>
        <button onClick={openLibraryMenu}
          className="w-9 h-9 flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 rounded-xl transition-colors text-lg tracking-widest">
          ···
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* Goal bar */}
        <div className="bg-white/5 rounded-2xl px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/60 text-sm">Today's Goal</span>
            <span className="text-sm font-bold flex items-center gap-0.5">
              <span className={goalPct >= 100 ? 'text-emerald-400' : 'text-white'}>{wordsToday}</span>
              <span className="text-white/30"> / </span>
              {editingGoal ? (
                <input autoFocus type="number" min="1" value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onBlur={saveGoal}
                  onKeyDown={e => { if (e.key === 'Enter') saveGoal(); if (e.key === 'Escape') setEditingGoal(false); }}
                  className="w-16 bg-white/10 rounded px-1 text-white text-sm font-bold border border-white/25 focus:outline-none text-center" />
              ) : (
                <button onClick={() => { setEditingGoal(true); setGoalInput(String(goal)); }}
                  className="text-white/50 hover:text-white underline decoration-dotted underline-offset-2 transition-colors"
                  title="Tap to change goal">{goal}</button>
              )}
              <span className="text-white/30"> words</span>
              {!editingGoal && <span className="text-white/20 text-xs ml-0.5">✏</span>}
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${goalPct}%` }} />
          </div>
          {goalPct >= 100 && <p className="text-emerald-400 text-xs text-center mt-1.5 font-medium">Goal reached today!</p>}
        </div>

        {/* Empty state */}
        {passages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-white/20 text-sm">No passages yet</p>
            <button onClick={() => setView('add')}
              className="px-5 py-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-500/30 transition-colors">
              + Add your first passage
            </button>
          </div>
        )}

        {/* Review filter chips */}
        {passages.length > 0 && (gotItTotal > 0 || readAgainTotal > 0) && (
          <div className="flex items-center gap-1.5 mb-2.5">
            {[
              { id: 'all',        label: 'All',        count: passages.length, dot: null },
              { id: 'read-again', label: 'Read again', count: readAgainTotal,  dot: 'bg-amber-400' },
              { id: 'got-it',     label: 'Got it',     count: gotItTotal,      dot: 'bg-emerald-400' },
            ].map(chip => {
              const active = reviewFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setReviewFilter(chip.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-colors ${
                    active
                      ? chip.id === 'got-it'
                        ? 'bg-emerald-400/15 text-emerald-200'
                        : chip.id === 'read-again'
                          ? 'bg-amber-400/15 text-amber-200'
                          : 'bg-white/12 text-white/85'
                      : 'bg-white/5 text-white/45 hover:bg-white/8'
                  }`}
                >
                  {chip.dot && <span className={`w-1.5 h-1.5 rounded-full ${chip.dot}`} />}
                  <span>{chip.label}</span>
                  <span className="text-[10px] opacity-60">{chip.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Folder tree */}
        {passages.length > 0 && (
          <div className="bg-white/5 rounded-2xl overflow-hidden">
            {sections.map((section, sIdx) => {
              const isOpen = expandedFolders.has(section.id);
              return (
                <div key={section.id} className={sIdx > 0 ? 'border-t border-white/5' : ''}>
                  <button onClick={() => toggleFolder(section.id)}
                    className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors min-w-0">
                    <span className="text-white/30 text-[10px] w-3 shrink-0">{isOpen ? '▼' : '▶'}</span>
                    <span className="text-base">📁</span>
                    <span className="flex-1 text-left text-sm text-white/70 font-medium line-clamp-2 break-words">{section.name}</span>
                    {(() => {
                      const got      = section.items.filter(p => p.review?.rating === 'got-it').length;
                      const again    = section.items.filter(p => p.review?.rating === 'read-again').length;
                      const unrated  = section.items.length - got - again;
                      if (got === 0 && again === 0) {
                        return <span className="text-xs text-white/25 ml-1 shrink-0">{section.items.length}</span>;
                      }
                      return (
                        <div className="flex items-center gap-2 ml-1 text-[11px] shrink-0">
                          {got > 0 && (
                            <span className="flex items-center gap-1 text-emerald-300/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {got}
                            </span>
                          )}
                          {again > 0 && (
                            <span className="flex items-center gap-1 text-amber-300/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              {again}
                            </span>
                          )}
                          {unrated > 0 && (
                            <span className="text-white/30">{unrated}</span>
                          )}
                        </div>
                      );
                    })()}
                  </button>

                  {isOpen && section.items.length === 0 && (
                    <p className="pl-10 pr-4 py-2.5 text-xs text-white/20 border-t border-white/5 italic">Empty folder</p>
                  )}
                  {isOpen && section.items.map(p => {
                    const isSelected = selectedIds.has(p.id);
                    return (
                      <div key={p.id}
                        className={`flex items-center gap-2 pr-3 py-2.5 border-t border-white/5 transition-colors ${selectMode ? 'pl-4 cursor-pointer' : 'pl-10'} ${isSelected ? 'bg-red-400/8' : ''} ${p.review?.rating === 'read-again' ? 'border-l-2 border-l-amber-400/35 bg-amber-400/[0.025]' : ''}`}
                        onTouchStart={() => !selectMode && startLongPress(p.id)}
                        onTouchEnd={cancelLongPress}
                        onTouchMove={cancelLongPress}
                        onClick={selectMode ? () => toggleSelect(p.id) : undefined}
                      >
                        {selectMode && (
                          <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mr-1 transition-colors ${isSelected ? 'bg-red-400 border-red-400' : 'border-white/30'}`}>
                            {isSelected && <span className="text-white font-bold" style={{ fontSize: '9px' }}>✓</span>}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {!selectMode && editingId === p.id ? (
                            <input autoFocus value={editingTitle}
                              onChange={e => setEditingTitle(e.target.value)}
                              onBlur={() => saveRename(p.id)}
                              onKeyDown={e => { if (e.key === 'Enter') saveRename(p.id); if (e.key === 'Escape') setEditingId(null); }}
                              className="w-full bg-white/10 rounded px-2 py-0.5 text-sm text-white border border-white/20 focus:outline-none" />
                          ) : (
                            <div className="flex items-center gap-2 min-w-0">
                              {p.review && (
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    p.review.rating === 'got-it' ? 'bg-emerald-400' : 'bg-amber-400'
                                  }`}
                                  aria-label={p.review.rating === 'got-it' ? 'Got it' : 'Read again'}
                                />
                              )}
                              <p className={`text-sm truncate ${p.review?.rating === 'got-it' ? 'text-white/55' : 'text-white/80'}`}>{p.title}</p>
                            </div>
                          )}
                          <p className="text-xs text-white/25 mt-0.5">{countWords(p.content)} words</p>
                        </div>
                        {!selectMode && (
                          <>
                            <button onClick={e => { e.stopPropagation(); startReading(p.content, p.title, p.folderId); }}
                              className="shrink-0 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-semibold transition-colors">▶</button>
                            <button onClick={e => { e.stopPropagation(); setSheetOpen(false); setMovingId(null); setMenuPassageId(p.id); }}
                              className="shrink-0 w-7 h-7 flex items-center justify-center text-white/25 hover:text-white/60 rounded-lg hover:bg-white/5 transition-colors text-sm tracking-widest">···</button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* New folder row */}
            <div className="border-t border-white/5">
              {showNewFolder ? (
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <span className="w-3 shrink-0" />
                  <span className="text-base">📁</span>
                  <input autoFocus value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); } }}
                    placeholder="Folder name…"
                    className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/20 focus:outline-none" />
                  <button onClick={createFolder} className="text-emerald-400 font-bold text-sm px-1">✓</button>
                  <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="text-white/30 px-1">✕</button>
                </div>
              ) : (
                <button onClick={() => setShowNewFolder(true)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/25 hover:text-white/50 transition-colors">
                  <span className="w-3 shrink-0" /><span>＋</span><span>New Folder</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FAB - hidden in select mode */}
      {!selectMode && (
        <button onClick={() => setView('add')}
          className="fixed bottom-24 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 shadow-lg flex items-center justify-center transition-colors active:scale-95"
          style={{ zIndex: 50, right: 'max(1.5rem, calc(50vw - 14rem + 1.5rem))' }}>
          <span className="text-white text-2xl font-light leading-none">+</span>
        </button>
      )}

      {/* Multi-select action bar */}
      {selectMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-white/10"
          style={{ zIndex: 90, maxWidth: '448px', margin: '0 auto', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center gap-2 px-4 py-3">
            <button onClick={exitSelectMode}
              className="text-white/50 text-sm font-medium px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button onClick={selectAll}
              className="flex-1 text-white/40 text-xs text-center py-2 hover:text-white/60 transition-colors">
              Select all ({passages.length})
            </button>
            <button onClick={deleteSelected} disabled={selectedIds.size === 0}
              className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${selectedIds.size > 0 ? 'text-red-400 bg-red-400/10 active:bg-red-400/20' : 'text-white/20 bg-white/5'}`}>
              Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
            </button>
          </div>
        </div>
      )}

      {/* Passage ··· bottom sheet */}
      {menuPassage && (
        <>
          <div className="fixed inset-0 bg-black/60 transition-opacity duration-300"
            style={{ zIndex: 60, opacity: sheetOpen ? 1 : 0 }}
            onClick={closeSheet} />
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl pb-8 transition-transform duration-300 ease-out"
            style={{ zIndex: 70, maxWidth: '448px', margin: '0 auto', transform: sheetOpen ? 'translateY(0)' : 'translateY(100%)' }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="px-5 py-3 border-b border-white/10">
              <p className="text-white/40 text-xs">Passage</p>
              <p className="text-white font-semibold text-sm truncate mt-0.5">{menuPassage.title}</p>
              <p className="text-white/25 text-xs mt-0.5">{countWords(menuPassage.content)} words</p>
            </div>
            {movingId === menuPassage.id ? (
              <div className="px-4 pt-3">
                <p className="text-white/40 text-xs mb-3 px-1">Move to folder:</p>
                {[{ id: null, name: 'Uncategorized' }, ...folders.map(f => ({ id: f.id, name: f.name }))].map(f => {
                  const isCurrent = menuPassage.folderId === f.id;
                  return (
                    <button key={String(f.id)} onClick={() => movePassage(menuPassage.id, f.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm mb-1 transition-colors ${isCurrent ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'}`}>
                      <span>📁</span><span className="flex-1 text-left">{f.name}</span>
                      {isCurrent && <span className="text-emerald-400 text-xs">✓</span>}
                    </button>
                  );
                })}
                <button onClick={() => setMovingId(null)} className="w-full text-white/30 text-xs mt-1 py-2.5 hover:text-white/50 transition-colors">← Back to actions</button>
              </div>
            ) : copyingId === menuPassage.id ? (
              <div className="px-4 pt-3">
                <p className="text-white/40 text-xs mb-3 px-1">Copy to folder:</p>
                {[{ id: null, name: 'Uncategorized' }, ...folders.map(f => ({ id: f.id, name: f.name }))].map(f => (
                  <button key={String(f.id)} onClick={() => copyPassage(menuPassage.id, f.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm mb-1 text-white/60 hover:bg-white/5 transition-colors">
                    <span>📁</span><span className="flex-1 text-left">{f.name}</span>
                  </button>
                ))}
                <button onClick={() => setCopyingId(null)} className="w-full text-white/30 text-xs mt-1 py-2.5 hover:text-white/50 transition-colors">← Back to actions</button>
              </div>
            ) : (
              <div className="px-4 pt-2">
                {[
                  { icon: <Play size={16} />,       label: 'Read',           color: 'text-white',    action: () => startReading(menuPassage.content, menuPassage.title, menuPassage.folderId) },
                  { icon: <Pencil size={16} />,      label: 'Rename',         color: 'text-white/70', action: () => { setEditingId(menuPassage.id); setEditingTitle(menuPassage.title); closeSheet(); } },
                  { icon: <FileEdit size={16} />,    label: 'Edit content',   color: 'text-white/70', action: () => { setInputTitle(menuPassage.title); setInputText(menuPassage.content); setSaveFolderId(menuPassage.folderId ?? null); setEditingPassageId(menuPassage.id); closeSheet(); setView('add'); } },
                  { icon: <FolderInput size={16} />, label: 'Move to folder', color: 'text-white/70', action: () => setMovingId(menuPassage.id) },
                  { icon: <Copy size={16} />,        label: 'Copy to folder', color: 'text-white/70', action: () => setCopyingId(menuPassage.id) },
                  { icon: <Download size={16} />,    label: 'Download .txt',  color: 'text-white/70', action: () => { downloadTxt(menuPassage.title, menuPassage.content); closeSheet(); showToast('Saved to Downloads folder', 'success'); } },
                  { icon: <Trash2 size={16} />,      label: 'Delete',         color: 'text-red-400',  action: () => deletePassage(menuPassage.id) },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm ${item.color} hover:bg-white/5 active:bg-white/10 transition-colors`}>
                    <span className="w-5 flex items-center justify-center shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Hidden file inputs */}
      <input ref={folderInputRef} type="file" multiple className="hidden" onChange={async e => {
        if (!e.target.files?.length) return;
        setImporting(true); setImportingProgress(0); setImportingCount(e.target.files.length);
        await importFolder(e.target.files); e.target.value = '';
        setImporting(false);
      }} />
      <input ref={txtFilesInputRef} type="file" accept=".txt,.text" multiple className="hidden" onChange={async e => {
        if (!e.target.files?.length) return;
        setImporting(true); setImportingProgress(0); setImportingCount(e.target.files.length);
        await importFolder(e.target.files); e.target.value = '';
        setImporting(false);
      }} />
      <input ref={backupInputRef} type="file" accept=".json" className="hidden" onChange={e => {
        const file = e.target.files[0]; if (!file) return;
        importEnglishBackup(file); e.target.value = '';
      }} />

      {/* Import loading overlay */}
      {importing && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 200, background: 'rgba(0,0,0,0.75)' }}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl px-8 py-6 flex flex-col items-center gap-4 mx-6 w-64">
            <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <div className="w-full flex flex-col items-center gap-2">
              <p className="text-white text-sm font-semibold">
                Reading {importingProgress} of {importingCount}…
              </p>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all duration-150"
                  style={{ width: `${importingCount > 0 ? (importingProgress / importingCount) * 100 : 0}%` }} />
              </div>
              <p className="text-white/30 text-xs">{importingCount} file{importingCount !== 1 ? 's' : ''} selected</p>
            </div>
          </div>
        </div>
      )}

      {/* Library ··· bottom sheet */}
      {libraryMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 transition-opacity duration-300"
            style={{ zIndex: 60, opacity: librarySheetOpen ? 1 : 0 }}
            onClick={closeLibraryMenu} />
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl pb-10 transition-transform duration-300 ease-out"
            style={{ zIndex: 70, maxWidth: '448px', margin: '0 auto', transform: librarySheetOpen ? 'translateY(0)' : 'translateY(100%)' }}>
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="px-5 py-2 border-b border-white/10">
              <p className="text-white/40 text-xs font-medium">Library options</p>
            </div>
            <div className="px-4 pt-2">
              {[
                { icon: <FileEdit size={16} />,    label: 'Import .txt files',  sub: 'Pick .txt files, works on Android',              color: 'text-emerald-400', action: () => { closeLibraryMenu(); setTimeout(() => txtFilesInputRef.current?.click(), 320); } },
                { icon: <FolderInput size={16} />, label: 'Import folder',      sub: 'Subfolders become app folders (desktop only)',    color: 'text-white/70',    action: () => { closeLibraryMenu(); setTimeout(() => folderInputRef.current?.click(), 320); } },
                { icon: <Download size={16} />,    label: 'Export backup',               sub: 'Save all passages & folders to a JSON file',             color: 'text-white/70',    action: () => { closeLibraryMenu(); setTimeout(exportEnglishBackup, 320); } },
                { icon: <Upload size={16} />,      label: 'Import backup',               sub: 'Restore passages from a previously exported JSON',        color: 'text-white/70',    action: () => { closeLibraryMenu(); setTimeout(() => backupInputRef.current?.click(), 320); } },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors">
                  <span className={`w-5 flex items-center justify-center shrink-0 ${item.color}`}>{item.icon}</span>
                  <span className="flex flex-col items-start gap-0.5">
                    <span className={`text-sm ${item.color}`}>{item.label}</span>
                    <span className="text-xs text-white/30">{item.sub}</span>
                  </span>
                </button>
              ))}
              <div className="border-t border-white/8 mt-2 pt-2">
                {confirmClearAll ? (
                  <div className="px-3 py-3 space-y-3">
                    <p className="text-red-400 text-sm font-semibold">Delete all {passages.length} passage{passages.length !== 1 ? 's' : ''} and {folders.length} folder{folders.length !== 1 ? 's' : ''}?</p>
                    <p className="text-white/30 text-xs">Type <span className="text-white/60 font-bold">DELETE</span> to confirm. This cannot be undone.</p>
                    <input
                      autoFocus
                      value={clearAllInput}
                      onChange={e => setClearAllInput(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-400/50 transition-colors"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => { setConfirmClearAll(false); setClearAllInput(''); }}
                        className="flex-1 py-2 rounded-xl text-sm text-white/50 bg-white/5 hover:bg-white/10 transition-colors">Cancel</button>
                      <button onClick={clearAllData} disabled={clearAllInput !== 'DELETE'}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${clearAllInput === 'DELETE' ? 'text-red-400 bg-red-400/15 hover:bg-red-400/25 active:bg-red-400/35' : 'text-white/20 bg-white/5 cursor-not-allowed'}`}>
                        Delete all
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirmClearAll(true)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-400/5 active:bg-red-400/10 transition-colors">
                    <span className="w-5 flex items-center justify-center shrink-0 text-red-400"><Trash2 size={16} /></span>
                    <span className="flex flex-col items-start gap-0.5">
                      <span className="text-sm text-red-400">Delete all files &amp; folders</span>
                      <span className="text-xs text-white/30">Permanently removes all passages and folders</span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <CompletionRatingSheet
        open={ratingSheetOpen}
        onRate={handleRatePassage}
        onSkip={handleSkipRating}
      />
    </div>
  );
}
