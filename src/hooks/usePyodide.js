import { useCallback, useEffect, useState } from 'react';

const PYODIDE_VERSION = '0.26.4';
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_JS = `${PYODIDE_CDN}pyodide.js`;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-pyodide="${src}"]`)) {
      if (window.loadPyodide) return resolve();
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.setAttribute('data-pyodide', src);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Pyodide script'));
    document.head.appendChild(s);
  });
}

async function bootPyodide() {
  if (window.__pyodideInstance) return window.__pyodideInstance;
  if (window.__pyodideBoot) return window.__pyodideBoot;

  window.__pyodideBoot = (async () => {
    if (!window.loadPyodide) await loadScript(PYODIDE_JS);
    const py = await window.loadPyodide({ indexURL: PYODIDE_CDN });
    window.__pyodideInstance = py;
    return py;
  })();

  return window.__pyodideBoot;
}

function buildInputsPrelude(values) {
  const json = JSON.stringify(values);
  return `
import builtins as _b
import json as _j
_df_inputs = _j.loads(${JSON.stringify(json)})
_df_idx = [0]
def _df_input(prompt=""):
    if prompt:
        print(prompt, end="")
    i = _df_idx[0]
    _df_idx[0] += 1
    if i < len(_df_inputs):
        print(_df_inputs[i])
        return _df_inputs[i]
    raise EOFError("no input provided")
_b.input = _df_input
`;
}

export function extractInputPrompts(code) {
  const re = /\binput\s*\(\s*(?:(["'])((?:\\.|(?!\1).)*)\1)?\s*\)/g;
  const prompts = [];
  let m;
  while ((m = re.exec(code)) !== null) {
    prompts.push(m[2] || '');
  }
  return prompts;
}

export function usePyodide({ autoLoad = true } = {}) {
  const [status, setStatus] = useState(() => (window.__pyodideInstance ? 'ready' : 'idle'));
  const [error, setError]   = useState(null);

  const ensureLoaded = useCallback(async () => {
    if (window.__pyodideInstance) {
      setStatus('ready');
      return window.__pyodideInstance;
    }
    setStatus('loading');
    try {
      const py = await bootPyodide();
      setStatus('ready');
      return py;
    } catch (e) {
      setError(e.message || 'Failed to load Pyodide');
      setStatus('error');
      throw e;
    }
  }, []);

  useEffect(() => {
    if (autoLoad) ensureLoaded().catch(() => {});
  }, [autoLoad, ensureLoaded]);

  const runCode = useCallback(async (code, inputs) => {
    const py = await ensureLoaded();
    let out = '';
    let err = '';
    py.setStdout({ batched: (s) => { out += s + '\n'; } });
    py.setStderr({ batched: (s) => { err += s + '\n'; } });
    try {
      if (Array.isArray(inputs) && inputs.length > 0) {
        await py.runPythonAsync(buildInputsPrelude(inputs));
      } else {
        await py.runPythonAsync('import builtins as _b\ndef _df_no_input(p=""): raise EOFError("input requires values")\n_b.input = _df_no_input');
      }
      await py.runPythonAsync(code);
      return { ok: true, output: out.trimEnd(), error: err.trimEnd() };
    } catch (e) {
      return { ok: false, output: out.trimEnd(), error: (err + (e.message || String(e))).trimEnd() };
    }
  }, [ensureLoaded]);

  return { status, error, ensureLoaded, runCode };
}
