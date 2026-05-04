const cache = {};
let sfxMuted = false;

function get(name) {
  if (!cache[name]) {
    cache[name] = new Audio(`/sounds/${name}.mp3`);
    cache[name].preload = 'auto';
  }
  return cache[name];
}

export function setSfxMuted(val) {
  sfxMuted = val;
}

export function playSound(name) {
  if (sfxMuted) return;
  try {
    const audio = get(name);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (_) {}
}
