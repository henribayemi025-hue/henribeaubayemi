// Shared client-side image downscale/compress via canvas. Phone camera photos
// are routinely 3-8MB (and sometimes HEIC, which browsers can't always
// display back) — uploading them raw is a real, avoidable cause of slow
// image loads on mobile data. Every upload path in the app should go through
// compressImage() before hitting Supabase Storage; canvas re-encoding to
// JPEG also sidesteps HEIC display issues as a side effect.
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => resolve(img);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function resizeToCanvas(file, maxDim) {
  const img = await loadImage(file);
  let { width, height } = img;
  if (width > height && width > maxDim) {
    height = Math.round((height * maxDim) / width);
    width = maxDim;
  } else if (height > maxDim) {
    width = Math.round((width * maxDim) / height);
    height = maxDim;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(img, 0, 0, width, height);
  return canvas;
}

// For Supabase Storage uploads (product/shop photos) — returns a JPEG Blob.
export async function compressImage(file, { maxDim = 1600, quality = 0.82 } = {}) {
  const canvas = await resizeToCanvas(file, maxDim);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality));
}

// For inline data: URLs (Finou / Mirror AI payloads to Gemini).
export async function fileToDataUrl(file, maxDim = 1024, quality = 0.8) {
  const canvas = await resizeToCanvas(file, maxDim);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function fileToBase64(file, maxDim = 1024, quality = 0.85) {
  const dataUrl = await fileToDataUrl(file, maxDim, quality);
  return dataUrl.split(',')[1];
}
