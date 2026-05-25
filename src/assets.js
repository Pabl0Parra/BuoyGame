export const ASSET_MANIFEST = {
  images: {
    backgroundTiles: [
      "./assets/background_1.png",
      "./assets/background_2.png",
      "./assets/background_3.png",
    ],
    player: "./assets/buoyRendering.ico",
    collectible: "./assets/collectible_6.png",
    specialCollectible: "./assets/collectible_7.png",
    gun: "./assets/gun.png",
    hazards: [
      "./assets/pirate_boat.png",
      "./assets/carrier_boat.png",
      "./assets/jamming_boat.png",
      "./assets/substation.png",
    ],
  },
  audio: {
    soundtrack: "./assets/soundtrack.mp3",
    collectible: "./assets/pickupCoin.wav",
    special: "./assets/powerUp.wav",
    jump: "./assets/jumpSound.mp3",
    gameOver: "./assets/game-over.mp3",
  },
};

export async function loadAssets(manifest = ASSET_MANIFEST) {
  const images = {};
  const imageEntries = Object.entries(manifest.images).filter(
    ([, value]) => !Array.isArray(value),
  );
  const imageListEntries = Object.entries(manifest.images).filter(([, value]) =>
    Array.isArray(value),
  );

  await Promise.all(
    imageEntries.map(async ([key, src]) => {
      images[key] = await loadImage(src);
    }),
  );

  await Promise.all(
    imageListEntries.map(async ([key, srcs]) => {
      images[key] = await Promise.all(srcs.map(loadImage));
    }),
  );

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
