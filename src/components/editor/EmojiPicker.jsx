import { useState } from 'react';
import { EMOJI_CATEGORIES } from '../../constants/emojiCategories';
import Modal from '../shared/Modal';

export default function EmojiPicker({ selected, onSelect, onClose }) {
  const categories = Object.keys(EMOJI_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Pick an Emoji</h2>
        <button onClick={onClose} className="text-slate-400 dark:text-slate-500 text-xl leading-none">✕</button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 flex-shrink-0">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto flex-1 min-h-0">
        <div className="grid grid-cols-5 gap-2">
          {EMOJI_CATEGORIES[activeCategory].map(e => (
            <button
              key={e}
              onClick={() => onSelect(e)}
              className={`text-2xl p-2 rounded-xl transition-colors ${
                selected === e ? 'bg-slate-200 dark:bg-white/15' : 'active:bg-slate-100 dark:active:bg-white/10'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
