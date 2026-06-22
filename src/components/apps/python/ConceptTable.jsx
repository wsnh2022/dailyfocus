import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const escapeHTML = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const renderCellHTML = (cell) =>
  cell.split('`').map((part, i) => {
    const safe = escapeHTML(part);
    return i % 2 === 1
      ? `<code class="bg-white/5 px-1.5 py-0.5 rounded text-emerald-200/90 font-mono whitespace-nowrap">${safe}</code>`
      : safe;
  }).join('');

const STICKY_BG = '#0f172a';

export default function ConceptTable({ headers, rows }) {
  const wrapRef = useRef(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const check = () => {
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      el.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  return (
    <div className="relative rounded-xl border border-white/5 overflow-hidden" style={{ background: STICKY_BG }}>
      <style>{`
        .df-table-scroll::-webkit-scrollbar { height: 4px; }
        .df-table-scroll::-webkit-scrollbar-track { background: transparent; }
        .df-table-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 999px; }
        .df-table-scroll:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.20); }
        .df-table-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.14) transparent; -webkit-overflow-scrolling: touch; }
        .df-sticky-col {
          position: sticky;
          left: 0;
          z-index: 1;
          background: ${STICKY_BG};
          box-shadow: 6px 0 10px -6px rgba(0,0,0,0.55);
        }
      `}</style>

      <div ref={wrapRef} className="df-table-scroll overflow-x-auto">
        <table
          className="text-[12.5px]"
          style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: '100%' }}
        >
          <thead>
            <tr>
              {headers.map((h, j) => {
                const isFirst = j === 0;
                return (
                  <th
                    key={j}
                    className={`px-3 py-2.5 text-left font-semibold text-white/75 whitespace-nowrap border-b border-white/10 ${
                      isFirst ? 'df-sticky-col' : ''
                    }`}
                    style={!isFirst ? { background: 'rgba(255,255,255,0.035)' } : undefined}
                  >
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => {
                  const isFirst = ci === 0;
                  return (
                    <td
                      key={ci}
                      className={`px-3 py-2.5 align-top text-white/80 whitespace-nowrap ${
                        ri > 0 ? 'border-t border-white/5' : ''
                      } ${isFirst ? 'df-sticky-col font-medium text-white/90' : ''}`}
                      dangerouslySetInnerHTML={{ __html: renderCellHTML(cell) }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 transition-opacity duration-200"
        style={{
          opacity: canScrollRight ? 1 : 0,
          background: `linear-gradient(to left, ${STICKY_BG} 0%, ${STICKY_BG}cc 40%, transparent 100%)`,
        }}
      />
    </div>
  );
}
