export const ASSET_MANIFEST = {
  images: {
    backgroundFar: './assets/windPark_bg.webp',
    backgroundMid: './assets/windPark2.webp',
    backgroundNear: './assets/windPark_retro.webp',
    player: './assets/buoyRendering.ico',
    collectible: './assets/collectible_6.png',
    specialCollectible: './assets/collectible_7.png',
    hazards: [
      './assets/obstacle_1.png',
      './assets/obstacle_2.png',
      './assets/obstacle_3.png',
      './assets/obstacle_4.png',
    ],
  },
  audio: {
    soundtrack: './assets/soundtrack.mp3',
    collectible: './assets/pickupCoin.wav',
    special: './assets/powerUp.wav',
    jump: './assets/jumpSound.mp3',
    gameOver: './assets/game-over.mp3',
  },
};

export async function loadAssets(manifest = ASSET_MANIFEST) {
  const images = {};
  const imageEntries = Object.entries(manifest.images).filter(
    ([, value]) => !Array.isArray(value),
  );

  await Promise.all(
    imageEntries.map(async ([key, src]) => {
      images[key] = await loadImage(src);
    }),
  );

  images.hazards = await Promise.all(manifest.images.hazards.map(loadImage));

  return {
    images,
    audio: manifest.audio,
  };
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ image, loaded: true, src });
    image.onerror = () => resolve({ image: null, loaded: false, src });
    image.src = src;
  });
}
