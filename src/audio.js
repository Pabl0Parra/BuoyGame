import { loadMuted, saveMuted } from './storage.js';

const EFFECT_VOLUMES = {
  collectible: 0.32,
  special: 0.34,
  jump: 0.22,
  gameOver: 0.38,
};

export function createAudioController(assetManifest) {
  const mutedFromStorage = loadMuted();
  const music = createAudio(assetManifest.audio.soundtrack, 0.14, true);
  const effects = Object.fromEntries(
    Object.entries(assetManifest.audio)
      .filter(([key]) => key !== 'soundtrack')
      .map(([key, src]) => [key, createAudio(src, EFFECT_VOLUMES[key] ?? 0.3)]),
  );
  let muted = mutedFromStorage;

  setAllMuted(music, effects, muted);

  return {
    get muted() {
      return muted;
    },
    async startMusic() {
      if (muted || !music) return;
      try {
        await music.play();
      } catch {
        // Browsers can reject autoplay until a direct user gesture.
      }
    },
    stopMusic() {
      music?.pause();
    },
    playEffect(name) {
      if (muted || !effects[name]) return;
      const effect = effects[name].cloneNode();
      effect.volume = effects[name].volume;
      effect.play().catch(() => {});
    },
    setMuted(value) {
      muted = Boolean(value);
      setAllMuted(music, effects, muted);
      saveMuted(muted);
    },
    toggleMuted() {
      this.setMuted(!muted);
      return muted;
    },
  };
}

function createAudio(src, volume, loop = false) {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.loop = loop;
  return audio;
}

function setAllMuted(music, effects, muted) {
  if (music) music.muted = muted;
  for (const effect of Object.values(effects)) {
    effect.muted = muted;
  }
}
