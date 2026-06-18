import { PRESET_COLORS } from '../../constants/colors';

export default function ColorPicker({ selected, onChange }) {
  return (
    <div className="grid grid-cols-6 gap-2 mt-2">
      {PRESET_COLORS.map(({ id, hex }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform active:scale-95"
          style={{ backgroundColor: hex }}
          aria-label={id}
        >
          {selected === id && (
            <span className="text-white text-base font-bold drop-shadow">✓</span>
          )}
        </button>
      ))}
    </div>
  );
}
