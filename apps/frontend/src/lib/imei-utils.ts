/**
 * IMEI Validation & Intelligent OCR Extraction Utilities for VerifyFlow
 */

/**
 * Validates a 15-digit IMEI number using the standard Luhn algorithm.
 */
export function validateLuhnIMEI(imeiStr: string): boolean {
  if (!imeiStr) return false;
  const clean = imeiStr.replace(/\D/g, '');
  if (clean.length !== 15) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(clean.charAt(i), 10);
    // Double every second digit from left (0-indexed: 1, 3, 5, 7, 9, 11, 13)
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/**
 * Normalizes common OCR misread characters into numbers.
 */
export function normalizeOcrDigits(text: string): string {
  if (!text) return '';
  return text
    .replace(/[Oo]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[Ss]/g, '5')
    .replace(/B/g, '8')
    .replace(/q/g, '9');
}

/**
 * Extracts ALL unique 15-digit numeric IMEI candidates from raw text that pass Luhn validation.
 */
export function extractAllValidIMEIs(rawText: string): string[] {
  if (!rawText) return [];

  const foundIMEIs = new Set<string>();

  // Helper to add if valid Luhn
  const checkAndAdd = (str: string) => {
    const digits = normalizeOcrDigits(str).replace(/\D/g, '');
    if (digits.length === 15 && validateLuhnIMEI(digits)) {
      foundIMEIs.add(digits);
    } else if (digits.length > 15) {
      // Check all 15-digit sliding windows in longer numeric strings
      for (let i = 0; i <= digits.length - 15; i++) {
        const window = digits.slice(i, i + 15);
        if (validateLuhnIMEI(window)) {
          foundIMEIs.add(window);
        }
      }
    }
  };

  // 1. Direct 15-digit numeric regex search
  const directMatches = rawText.match(/\b\d{15}\b/g) || [];
  directMatches.forEach(checkAndAdd);

  // 2. Normalized digit direct search
  const normalizedText = normalizeOcrDigits(rawText);
  const normDirect = normalizedText.match(/\b\d{15}\b/g) || [];
  normDirect.forEach(checkAndAdd);

  // 3. Search text blocks with spaces/hyphens/colons (e.g. IMEI 1 : 350144374089854)
  const blockMatches = rawText.match(/(?:IMEI\s*\d*|MEID)?[:\s]*[\d\s.-]{15,30}/gi) || [];
  blockMatches.forEach(checkAndAdd);

  // 4. Fallback search on entire sanitized string
  const sanitized = normalizedText.replace(/[^0-9]/g, '');
  if (sanitized.length >= 15) {
    checkAndAdd(sanitized);
  }

  return Array.from(foundIMEIs);
}

/**
 * Extracts the primary valid 15-digit IMEI candidate from raw text.
 */
export function extractValidIMEI(rawText: string): string | null {
  const list = extractAllValidIMEIs(rawText);
  return list.length > 0 ? list[0] : null;
}

/**
 * Calculates native camera video resolution crop coordinates for the reticle overlay box.
 */
export function getCroppedReticleCanvas(
  videoEl: HTMLVideoElement,
  reticleEl: HTMLElement | null
): { cropCanvas: HTMLCanvasElement; fullCanvas: HTMLCanvasElement } | null {
  if (!videoEl) return null;

  const videoW = videoEl.videoWidth || videoEl.clientWidth || 1280;
  const videoH = videoEl.videoHeight || videoEl.clientHeight || 720;

  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = videoW;
  fullCanvas.height = videoH;
  const fullCtx = fullCanvas.getContext('2d');
  if (!fullCtx) return null;
  fullCtx.drawImage(videoEl, 0, 0, videoW, videoH);

  let cropX = Math.round(videoW * 0.08);
  let cropY = Math.round(videoH * 0.25);
  let cropW = Math.round(videoW * 0.84);
  let cropH = Math.round(videoH * 0.50);

  if (reticleEl) {
    const videoRect = videoEl.getBoundingClientRect();
    const reticleRect = reticleEl.getBoundingClientRect();

    if (videoRect.width > 0 && videoRect.height > 0) {
      const videoAspect = videoW / videoH;
      const containerAspect = videoRect.width / videoRect.height;

      let renderedW = videoRect.width;
      let renderedH = videoRect.height;
      let offsetX = 0;
      let offsetY = 0;

      if (videoAspect > containerAspect) {
        renderedW = videoRect.height * videoAspect;
        offsetX = (renderedW - videoRect.width) / 2;
      } else {
        renderedH = videoRect.width / videoAspect;
        offsetY = (renderedH - videoRect.height) / 2;
      }

      const scale = videoW / renderedW;

      const reticleLeftOnRendered = (reticleRect.left - videoRect.left) + offsetX;
      const reticleTopOnRendered = (reticleRect.top - videoRect.top) + offsetY;

      cropX = Math.max(0, Math.round(reticleLeftOnRendered * scale));
      cropY = Math.max(0, Math.round(reticleTopOnRendered * scale));
      cropW = Math.min(videoW - cropX, Math.round(reticleRect.width * scale));
      cropH = Math.min(videoH - cropY, Math.round(reticleRect.height * scale));
    }
  }

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = Math.max(1, cropW);
  cropCanvas.height = Math.max(1, cropH);
  const cropCtx = cropCanvas.getContext('2d');
  if (cropCtx) {
    cropCtx.drawImage(fullCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  }

  return { cropCanvas, fullCanvas };
}

/**
 * Preprocesses cropped canvas for OCR digit recognition with crisp contrast sharpening.
 */
export function preprocessCanvasForOcr(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const targetW = Math.max(800, sourceCanvas.width * 2);
  const scale = targetW / sourceCanvas.width;
  const targetH = Math.round(sourceCanvas.height * scale);

  const ocrCanvas = document.createElement('canvas');
  ocrCanvas.width = targetW;
  ocrCanvas.height = targetH;
  const ctx = ocrCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  // High quality linear interpolation scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, targetW, targetH);

  const imgData = ctx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;

  // Contrast boost without destructive threshold clipping
  const contrast = 1.3;
  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

  for (let i = 0; i < data.length; i += 4) {
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray = Math.max(0, Math.min(255, factor * (gray - 128) + 128));

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  ctx.putImageData(imgData, 0, 0);
  return ocrCanvas;
}
