import { useUIStore } from "../store/uiStore";

/**
 * Compresses a base64 image string using HTML5 Canvas.
 * This helps stay within LocalStorage and API payload limits.
 */
export async function compressImage(
  base64Str: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.6
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio maintained dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          resolve(base64Str); // Fallback if canvas context fails
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Return compressed JPEG
        const result = canvas.toDataURL("image/jpeg", quality);
        resolve(result);
      } catch (err) {
        console.error("Image compression failed:", err);
        resolve(base64Str); // Fallback to original
      }
    };
    img.onerror = (err) => {
      console.error("Image load failed:", err);
      reject(err);
    };
  });
}

/**
 * Opens a receipt image in the app's lightbox instead of a new tab.
 */
export function openReceiptImage(url: string) {
  if (!url) return;
  useUIStore.getState().setPreviewImage(url);
}

