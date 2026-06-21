import { useCallback, useEffect, useState } from 'react';

const KEY = 'df_python_lvl1_learned';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function usePythonProgress() {
  const [learned, setLearned] = useState(read);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY) setLearned(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setSectionLearned = useCallback((id, value) => {
    setLearned((prev) => {
      const next = { ...prev };
      if (value) next[id] = true;
      else delete next[id];
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const toggleSection = useCallback((id) => {
    setSectionLearned(id, !learned[id]);
  }, [learned, setSectionLearned]);

  const count = Object.keys(learned).length;

  return { learned, count, setSectionLearned, toggleSection };
}
