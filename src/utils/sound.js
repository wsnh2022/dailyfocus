const STORAGE_KEY = 'df_pomo_sound';

export const SOUND_PROFILES = [
  { id: 'tones',  label: 'Tones',  emoji: '🎵', desc: 'Smooth sine waves' },
  { id: 'bell',   label: 'Bell',   emoji: '🔔', desc: 'Warm metallic bell' },
  { id: 'chime',  label: 'Chime',  emoji: '✨', desc: 'Light airy chime' },
  { id: 'silent', label: 'Silent', emoji: '🔇', desc: 'No sound' },
];

export const getSoundProfile = () => localStorage.getItem(STORAGE_KEY) || 'tones';
export const setSoundProfile  = (id) => localStorage.setItem(STORAGE_KEY, id);

// ── Audio engine ───────────────────────────────────────────────────────────
let ctx = null;

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, vol = 0.28, type = 'sine') {
  try {
    const a = audio();
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.connect(gain);
    gain.connect(a.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(vol, a.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
    osc.start(a.currentTime);
    osc.stop(a.currentTime + dur);
  } catch {}
}

// Bell: fundamental + inharmonic partials for warm metallic ring
function bell(freq, dur, vol = 0.25) {
  tone(freq,        dur,        vol,       'sine');
  tone(freq * 2.76, dur * 0.6,  vol * 0.3, 'sine');
  tone(freq * 5.4,  dur * 0.35, vol * 0.1, 'sine');
}

// Chime: triangle wave, soft and airy
function chime(freq, dur, vol = 0.22) {
  tone(freq,     dur,        vol,       'triangle');
  tone(freq * 2, dur * 0.45, vol * 0.2, 'triangle');
}

// ── Tones profile ──────────────────────────────────────────────────────────
const T = {
  breakStart: () => { tone(880, 0.35); setTimeout(() => tone(660, 0.4), 380); },
  workResume: () => { tone(660, 0.2);  setTimeout(() => tone(880, 0.25), 230); },
  allDone:    () => { tone(523, 0.2);  setTimeout(() => tone(659, 0.2), 220); setTimeout(() => tone(784, 0.55), 440); },
};

// ── Bell profile ───────────────────────────────────────────────────────────
const B = {
  breakStart: () => { bell(440, 0.8); setTimeout(() => bell(330, 0.8), 460); },
  workResume: () => { bell(330, 0.5); setTimeout(() => bell(440, 0.8), 360); },
  allDone:    () => { bell(392, 0.6); setTimeout(() => bell(494, 0.6), 310); setTimeout(() => bell(587, 1.0), 620); },
};

// ── Chime profile ──────────────────────────────────────────────────────────
const C = {
  breakStart: () => { chime(1046, 0.3); setTimeout(() => chime(880, 0.3), 200); setTimeout(() => chime(784, 0.4), 400); },
  workResume: () => { chime(784, 0.25); setTimeout(() => chime(988, 0.25), 180); setTimeout(() => chime(1174, 0.3), 360); },
  allDone:    () => { chime(1046, 0.25); setTimeout(() => chime(1174, 0.25), 170); setTimeout(() => chime(1318, 0.25), 340); setTimeout(() => chime(1568, 0.5), 510); },
};

// ── Public API ─────────────────────────────────────────────────────────────
function play(key) {
  const p = getSoundProfile();
  if (p === 'bell')        B[key]();
  else if (p === 'chime')  C[key]();
  else if (p !== 'silent') T[key]();
}

// ── Voice ──────────────────────────────────────────────────────────────────
const VOICE_KEY = 'df_pomo_voice';

export const getVoiceEnabled = () => localStorage.getItem(VOICE_KEY) !== 'false';
export const setVoiceEnabled = (on) => localStorage.setItem(VOICE_KEY, String(on));

function stripEmoji(str) {
  return str.replace(/\p{Emoji_Presentation}/gu, '').replace(/\s+/g, ' ').trim();
}

function speak(text) {
  if (!getVoiceEnabled()) return;
  if (!window.speechSynthesis) return;
  setTimeout(() => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  }, 400);
}

export const soundBreakStart = (taskName, breakMin) => {
  play('breakStart');
  speak(`${stripEmoji(taskName ?? '')} completed. ${breakMin ?? 5} minute break.`);
};
export const soundWorkResume = (taskName) => {
  play('workResume');
  speak(`Time to ${stripEmoji(taskName ?? '')}.`);
};
export const soundAllDone = (taskName) => {
  play('allDone');
  speak(`${stripEmoji(taskName ?? '')} complete. All sets done!`);
};
