let ctx = null;

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, vol = 0.28) {
  try {
    const a = audio();
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.connect(gain);
    gain.connect(a.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, a.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
    osc.start(a.currentTime);
    osc.stop(a.currentTime + dur);
  } catch {}
}

// Work set done → break starting (two descending notes: "wind down")
export function soundBreakStart() {
  tone(880, 0.35);
  setTimeout(() => tone(660, 0.4), 380);
}

// Break done → work resuming (two ascending notes: "ramp up")
export function soundWorkResume() {
  tone(660, 0.2);
  setTimeout(() => tone(880, 0.25), 230);
}

// All sets complete (ascending triad: celebratory)
export function soundAllDone() {
  tone(523, 0.2);
  setTimeout(() => tone(659, 0.2), 220);
  setTimeout(() => tone(784, 0.55), 440);
}
