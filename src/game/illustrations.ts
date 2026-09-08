export type SpriteName = "explorer" | "explorerPush" | "rock" | "bridge" | "gate" | "spring" | "tree" | "ball" | "clay" | "door" | "chest" | "chestOpen";
export type Sprites = Partial<Record<SpriteName, HTMLCanvasElement>>;

const imageCache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(src: string) {
  let promise = imageCache.get(src);
  if (!promise) {
    promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Tidak dapat memuat ilustrasi: ${src}`));
      image.src = src;
    });
    imageCache.set(src, promise);
  }
  return promise;
}

// Key and trim the illustrations once, not inside the animation loop.
function prepareSprite(image: HTMLImageElement, col = 0, row = 0, columns = 1, rows = 1) {
  const canvas = document.createElement("canvas");
  const width = Math.floor(image.naturalWidth / columns);
  const height = Math.floor(image.naturalHeight / rows);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, col * width, row * height, width, height, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height);
  const data = pixels.data;
  let left = width, right = 0, top = height, bottom = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const red = data[index], green = data[index + 1], blue = data[index + 2];
      const magenta = Math.min(red, blue) - green;
      if (magenta > 24 && red > green * 1.15 && blue > green * 1.15) {
        const alpha = Math.max(0, 1 - (magenta - 24) / 58);
        data[index + 3] = Math.round(data[index + 3] * alpha);
        if (alpha > 0) {
          data[index] = Math.min(red, green + 24);
          data[index + 2] = Math.min(blue, green + 28);
        }
      }
      if (data[index + 3] > 48) {
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
  }
  ctx.putImageData(pixels, 0, 0);
  if (right <= left || bottom <= top) return canvas;
  const trimmed = document.createElement("canvas");
  trimmed.width = right - left + 1;
  trimmed.height = bottom - top + 1;
  trimmed.getContext("2d")!.drawImage(canvas, left, top, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
  return trimmed;
}

let spritePromise: Promise<Sprites> | undefined;

export function loadIllustrations(): Promise<Sprites> {
  if (!spritePromise) {
    spritePromise = (async () => {
      const sprites: Sprites = {};
      await Promise.allSettled([
        loadImage("/images/explorer-sprite.png").then(image => { sprites.explorer = prepareSprite(image); }),
        loadImage("/images/boulder-sprite.png").then(image => { sprites.rock = prepareSprite(image); }),
        loadImage("/images/explorer-pushing.png").then(image => { sprites.explorerPush = prepareSprite(image); }),
        loadImage("/images/chest-open.png").then(image => { sprites.chestOpen = prepareSprite(image); }),
        loadImage("/images/adventure-props.png").then(image => {
          const names: SpriteName[] = ["bridge", "gate", "spring", "tree", "ball", "clay", "door", "chest"];
          names.forEach((name, i) => { sprites[name] = prepareSprite(image, i % 4, Math.floor(i / 4), 4, 2); });
        }),
      ]);
      return sprites;
    })();
  }
  return spritePromise;
}