import { useCallback, useMemo, useRef, useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { usePyodide, extractInputPrompts } from '../../../hooks/usePyodide';

const SOOTHING_THEME = {
  plain: { color: '#d4e8d4', backgroundColor: 'transparent' },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#6b7d6b', fontStyle: 'italic' } },
    { types: ['string', 'attr-value'],                  style: { color: '#a3d9a5' } },
    { types: ['keyword', 'control', 'directive', 'unit'], style: { color: '#f0b27a' } },
    { types: ['function', 'function-name'],             style: { color: '#94c5e6' } },
    { types: ['builtin', 'class-name'],                 style: { color: '#c5b8e6' } },
    { types: ['number', 'boolean', 'constant'],         style: { color: '#e6b894' } },
    { types: ['operator', 'punctuation'],               style: { color: '#9ab09a' } },
    { types: ['property', 'tag'],                       style: { color: '#f0b27a' } },
    { types: ['variable'],                              style: { color: '#d4e8d4' } },
  ],
};

export default function CodeBlock({ code: initialCode }) {
  const original = useMemo(() => initialCode, [initialCode]);
  const [code, setCode]       = useState(initialCode);
  const [output, setOutput]   = useState(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [pendingInputs, setPendingInputs] = useState(null);
  const taRef = useRef(null);
  const { status, runCode } = usePyodide({ autoLoad: true });

  const lineCount = code.split('\n').length;
  const dirty = code !== original;

  const executeCode = useCallback(async (inputs) => {
    setRunning(true);
    setOutput(null);
    try {
      const result = await runCode(code, inputs);
      setOutput(result);
    } catch (e) {
      setOutput({ ok: false, output: '', error: e.message || 'Run failed' });
    } finally {
      setRunning(false);
    }
  }, [code, runCode]);

  const handleRun = useCallback(async () => {
    const prompts = extractInputPrompts(code);
    if (prompts.length > 0) {
      setPendingInputs(prompts.map((p) => ({ prompt: p, value: '' })));
      setOutput(null);
      return;
    }
    await executeCode();
  }, [code, executeCode]);

  const handleSubmitInputs = useCallback(async () => {
    const values = pendingInputs.map((p) => p.value);
    setPendingInputs(null);
    await executeCode(values);
  }, [pendingInputs, executeCode]);

  const handleCancelInputs = useCallback(() => {
    setPendingInputs(null);
  }, []);

  const handleReset = useCallback(() => {
    setCode(original);
    setOutput(null);
  }, [original]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }, [code]);

  const handleTab = useCallback((e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const before = code.slice(0, start);
    const after  = code.slice(end);
    const indent = '    ';
    const next = before + indent + after;
    setCode(next);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + indent.length;
    });
  }, [code]);

  const runDisabled = running || status === 'loading' || status === 'error';
  const runLabel = status === 'loading'
    ? 'Warming'
    : status === 'error'
      ? 'Unavailable'
      : running
        ? 'Running'
        : 'Run';

  const sharedTypography = {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '12.5px',
    lineHeight: '1.7',
    padding: '12px 14px',
    margin: 0,
    whiteSpace: 'pre',
    tabSize: 4,
    letterSpacing: 0,
  };

  return (
    <div className="rounded-xl bg-black/40 border border-white/5 overflow-hidden">
      <div className="relative">
        <Highlight theme={SOOTHING_THEME} code={code} language="python">
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre
              aria-hidden="true"
              style={{
                ...sharedTypography,
                pointerEvents: 'none',
                overflow: 'auto',
              }}
            >
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line });
                return (
                  <div key={i} {...lineProps}>
                    {line.length === 0 ? '​' : line.map((token, key) => {
                      const tokenProps = getTokenProps({ token });
                      return <span key={key} {...tokenProps} />;
                    })}
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
        <textarea
          ref={taRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleTab}
          spellCheck={false}
          rows={Math.max(2, lineCount)}
          style={{
            ...sharedTypography,
            position: 'absolute',
            inset: 0,
            background: 'transparent',
            color: 'transparent',
            caretColor: '#a7f3d0',
            border: 'none',
            outline: 'none',
            resize: 'none',
            width: '100%',
            height: '100%',
            overflow: 'auto',
          }}
        />
      </div>

      <div className="flex items-center gap-2 px-2.5 py-2 border-t border-white/5 bg-white/[0.015]">
        <button
          onClick={handleRun}
          disabled={runDisabled}
          className="px-3 py-1.5 rounded-md bg-emerald-400/15 text-emerald-200 text-[11.5px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400/20 transition-colors"
        >
          {runLabel}
        </button>
        <button
          onClick={handleCopy}
          className="px-2.5 py-1.5 rounded-md text-white/45 hover:text-white/75 text-[11.5px] transition-colors"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        {dirty && (
          <button
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded-md text-white/45 hover:text-white/75 text-[11.5px] transition-colors"
          >
            Reset
          </button>
        )}
        <span className="ml-auto text-[10px] text-white/25 font-mono">{lineCount} lines</span>
      </div>

      {pendingInputs && (
        <div className="border-t border-white/5 px-3.5 py-3 bg-emerald-400/[0.03]">
          <div className="text-[10px] uppercase tracking-wider text-emerald-200/70 mb-2">
            This code calls input() {pendingInputs.length === 1 ? 'once' : `${pendingInputs.length} times`}. Fill in your values:
          </div>
          <div className="space-y-2">
            {pendingInputs.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[11px] text-white/50 font-mono shrink-0 min-w-[20px]">{idx + 1}.</span>
                <input
                  type="text"
                  value={p.value}
                  onChange={(e) => {
                    const next = [...pendingInputs];
                    next[idx] = { ...next[idx], value: e.target.value };
                    setPendingInputs(next);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && idx === pendingInputs.length - 1) handleSubmitInputs();
                  }}
                  placeholder={p.prompt || `input ${idx + 1}`}
                  autoFocus={idx === 0}
                  className="flex-1 bg-black/30 border border-white/10 rounded-md px-2.5 py-1.5 text-[12.5px] font-mono text-emerald-100/90 outline-none focus:border-emerald-400/40"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleSubmitInputs}
              className="px-3 py-1.5 rounded-md bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-100 text-[11.5px] font-medium transition-colors"
            >
              Run with values
            </button>
            <button
              onClick={handleCancelInputs}
              className="px-2.5 py-1.5 rounded-md text-white/45 hover:text-white/75 text-[11.5px] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {output && (
        <div className="border-t border-white/5">
          <div className="flex items-center gap-2 px-3.5 pt-2.5">
            <span className={`text-[10px] uppercase tracking-wider ${output.ok ? 'text-white/40' : 'text-rose-300/80'}`}>
              {output.ok ? 'Output' : 'Error'}
            </span>
            <button
              onClick={() => setOutput(null)}
              className="ml-auto text-[10px] text-white/30 hover:text-white/60"
            >clear</button>
          </div>
          <pre className="px-3.5 pb-3 pt-1 text-[12px] leading-relaxed font-mono whitespace-pre-wrap break-words">
            {output.output && <span className="text-white/70">{output.output}</span>}
            {output.output && output.error && '\n'}
            {output.error && <span className="text-rose-200/85">{output.error}</span>}
            {!output.output && !output.error && <span className="text-white/35 italic">(no output)</span>}
          </pre>
        </div>
      )}
    </div>
  );
}
