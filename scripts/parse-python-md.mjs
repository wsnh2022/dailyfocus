import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, 'python_fundamentals.md');
const OUT = resolve(__dirname, '..', 'src', 'data', 'python', 'lvl-1.json');

const META = {
  'Variables & Data Types':  { id: 'variables-and-types',  emoji: '📦', intro: 'Python figures out the type automatically. You never declare it.' },
  'Operators':               { id: 'operators',            emoji: '➕', intro: 'Arithmetic, comparison, logical, membership. The grammar of expressions.' },
  'Input / Output':          { id: 'input-output',         emoji: '🔁', intro: 'Read from the user with input(), write with print(), format with f-strings.' },
  'Strings':                 { id: 'strings',              emoji: '🔤', intro: 'Text values. Immutable, so every method returns a new string.' },
  'Numbers':                 { id: 'numbers',              emoji: '🔢', intro: 'Built-in math helpers plus a few surprises around rounding and float precision.' },
  'Lists':                   { id: 'lists',                emoji: '📋', intro: 'Ordered, mutable collections. The most used data structure in Python.' },
  'Tuples':                  { id: 'tuples',               emoji: '📎', intro: 'Ordered and immutable. Use when data should not change after creation.' },
  'Sets':                    { id: 'sets',                 emoji: '🎯', intro: 'Unordered collections with no duplicates. Fast membership checks.' },
  'Dictionaries':            { id: 'dictionaries',         emoji: '🗂️', intro: 'Key-value pairs. The go-to structure for labeled data.' },
  'Conditionals':            { id: 'conditionals',         emoji: '🔀', intro: 'Branching logic with if, elif, else, ternaries, walrus, and match-case.' },
  'Loops':                   { id: 'loops',                emoji: '🔄', intro: 'For loops, while loops, range, enumerate, zip, break, continue, for-else.' },
  'Comprehensions':          { id: 'comprehensions',       emoji: '✨', intro: 'One-line shortcuts for building lists, dicts, sets, and lazy generators.' },
  'Functions':               { id: 'functions',            emoji: '⚙️', intro: 'Reusable blocks of logic. Parameters, defaults, args, kwargs, lambdas, scope.' },
  'None / NoneType':         { id: 'none-nonetype',        emoji: '🕳️', intro: 'The absence-of-value marker. Use is for comparison, not ==.' },
  'Unpacking':               { id: 'unpacking',            emoji: '📤', intro: 'Spread a sequence across variables in one move. Includes star unpacking.' },
  'Mutable vs Immutable':    { id: 'mutable-vs-immutable', emoji: '🔒', intro: 'Some types can change, others cannot. Knowing which prevents subtle bugs.' },
  'Shallow Copy vs Deep Copy': { id: 'shallow-vs-deep-copy', emoji: '🪞', intro: 'Shallow copies share nested data. Deep copies clone everything.' },
  'Imports & Modules':       { id: 'imports-and-modules',  emoji: '📦', intro: 'Bring code from other files. The __name__ trick lets a file act as both script and module.' },
  'Classes':                 { id: 'classes',              emoji: '🏛️', intro: 'Custom types with state and behaviour. Inheritance, properties, dunder methods.' },
  'File Handling':           { id: 'file-handling',        emoji: '📁', intro: 'Read and write files safely with the with statement.' },
  'Error Handling':          { id: 'error-handling',       emoji: '🛡️', intro: 'Catch problems before they crash your program. try, except, else, finally.' },
  'Context Managers':        { id: 'context-managers',     emoji: '🧰', intro: 'The with statement. Automatic setup and cleanup around a block of code.' },
  'Generators':              { id: 'generators',           emoji: '🌱', intro: 'Functions that yield values lazily. Memory-efficient for big sequences.' },
  'Iterators':               { id: 'iterators',            emoji: '➡️', intro: 'The protocol behind every for loop. iter() and next() under the hood.' },
  'Decorators':              { id: 'decorators',           emoji: '🎀', intro: 'Wrap a function to add behaviour without changing its code.' },
  'Type Hints':              { id: 'type-hints',           emoji: '🏷️', intro: 'Optional annotations. Python ignores them, editors and linters use them.' },
  'Built-in Functions':      { id: 'built-in-functions',   emoji: '🧮', intro: 'The standard toolkit. len, type, range, sorted, map, filter, and friends.' },
};

const md = readFileSync(SRC, 'utf-8');
const lines = md.split(/\r?\n/);

const sections = [];
let cur = null;
let i = 0;

const flushParagraph = (buf) => {
  const text = buf.join(' ').trim();
  if (!text) return null;
  return { kind: 'paragraph', text };
};

while (i < lines.length) {
  const line = lines[i];

  if (line.startsWith('## ') && !line.startsWith('### ')) {
    const title = line.slice(3).trim();
    const meta = META[title];
    if (!meta) {
      console.warn(`No META for section: "${title}"`);
      i++;
      continue;
    }
    cur = {
      id: meta.id,
      title,
      emoji: meta.emoji,
      intro: meta.intro,
      concepts: [],
    };
    sections.push(cur);
    i++;
    continue;
  }

  if (!cur) { i++; continue; }

  if (line.startsWith('### ')) {
    cur.concepts.push({ kind: 'subsection', title: line.slice(4).trim() });
    i++;
    continue;
  }

  if (line.startsWith('```python') || line.startsWith('```')) {
    const buf = [];
    i++;
    while (i < lines.length && !lines[i].startsWith('```')) {
      buf.push(lines[i]);
      i++;
    }
    i++;
    cur.concepts.push({ kind: 'code', code: buf.join('\n') });
    continue;
  }

  if (line.startsWith('|')) {
    const tableLines = [];
    while (i < lines.length && lines[i].startsWith('|')) {
      tableLines.push(lines[i]);
      i++;
    }
    if (tableLines.length >= 2) {
      const headers = tableLines[0].split('|').slice(1, -1).map(s => s.trim());
      const rows = tableLines.slice(2).map(r => r.split('|').slice(1, -1).map(s => s.trim()));
      cur.concepts.push({ kind: 'table', headers, rows });
    }
    continue;
  }

  if (line.startsWith('> ')) {
    const buf = [];
    while (i < lines.length && lines[i].startsWith('> ')) {
      buf.push(lines[i].slice(2).trim());
      i++;
    }
    let text = buf.join(' ').trim();
    text = text.replace(/^[⚠️]+\s*/, '').trim();
    cur.concepts.push({ kind: 'warning', text });
    continue;
  }

  if (line.trim() === '' || line.trim() === '---') {
    i++;
    continue;
  }

  const buf = [];
  while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('```') && !lines[i].startsWith('|') && !lines[i].startsWith('> ') && lines[i].trim() !== '---') {
    buf.push(lines[i]);
    i++;
  }
  const p = flushParagraph(buf);
  if (p) cur.concepts.push(p);
}

const compact = (s) => {
  s.concepts = s.concepts.filter(c => {
    if (c.kind === 'paragraph') return c.text.length > 0;
    if (c.kind === 'code')      return c.code.trim().length > 0;
    return true;
  });
  if (s.concepts[0]?.kind === 'paragraph') {
    s.concepts.shift();
  }
  return s;
};

const final = sections.map(compact);

writeFileSync(OUT, JSON.stringify(final, null, 2));

console.log(`Parsed ${final.length} sections.`);
final.forEach(s => {
  const counts = s.concepts.reduce((acc, c) => { acc[c.kind] = (acc[c.kind] || 0) + 1; return acc; }, {});
  console.log(`  ${s.emoji} ${s.title}  ->  ${Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(', ')}`);
});
