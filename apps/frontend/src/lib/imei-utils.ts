/**
 * IMEI Validation & Intelligent OCR Extraction Utilities for VerifyFlow
 */

/**
 * Validates a 15-digit IMEI number using the standard Luhn algorithm.
 */
export function validateLuhnIMEI(imeiStr: string): boolean {
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
 * Extracts 15-digit numeric IMEI candidates from raw OCR text and validates them using Luhn.
 */
export function extractValidIMEI(rawText: string): string | null {
  if (!rawText) return null;

  // 1. Direct 15-digit numeric search on raw text
  const directMatches = rawText.match(/\b\d{15}\b/g) || [];
  for (const match of directMatches) {
    if (validateLuhnIMEI(match)) {
      return match;
    }
  }

  // 2. Search for 15-digit sequences ignoring hyphens, dots, and spaces
  const sanitized = rawText.replace(/[-.\s]/g, '');
  const sanitizedMatches = sanitized.match(/\d{15}/g) || [];
  for (const match of sanitizedMatches) {
    if (validateLuhnIMEI(match)) {
      return match;
    }
  }

  // 3. Normalized OCR digit substitution search
  const normalizedText = normalizeOcrDigits(rawText);
  const normalizedDirect = normalizedText.match(/\b\d{15}\b/g) || [];
  for (const match of normalizedDirect) {
    if (validateLuhnIMEI(match)) {
      return match;
    }
  }

  const normalizedSanitized = normalizedText.replace(/[-.\s]/g, '');
  const normalizedSanitizedMatches = normalizedSanitized.match(/\d{15}/g) || [];
  for (const match of normalizedSanitizedMatches) {
    if (validateLuhnIMEI(match)) {
      return match;
    }
  }

  // 4. Check labeled patterns (IMEI: 358240...)
  const labelMatches = rawText.match(/(?:IMEI|IMEI1|IMEI2|MEID)[:\s]*([A-Z0-9\s.-]{15,22})/gi) || [];
  for (const labelMatch of labelMatches) {
    const digitsOnly = normalizeOcrDigits(labelMatch.replace(/\D/g, ''));
    if (digitsOnly.length >= 15) {
      const candidate = digitsOnly.slice(0, 15);
      if (validateLuhnIMEI(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Calculates native camera video resolution crop coordinates for the reticle overlay box.
 */
export function getCroppedReticleCanvas(
  videoEl: HTMLVideoElement,
  reticleEl: HTMLElement | null
): { cropCanvas: HTMLCanvasElement; fullCanvas: HTMLCanvasElement } | null {
  if (!videoEl || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) return null;

  const videoW = videoEl.videoWidth;
  const videoH = videoEl.videoHeight;

  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = videoW;
  fullCanvas.height = videoH;
  const fullCtx = fullCanvas.getContext('2d');
  if (!fullCtx) return null;
  fullCtx.drawImage(videoEl, 0, 0, videoW, videoH);

  let cropX = Math.round(videoW * 0.09);
  let cropY = Math.round(videoH * 0.275);
  let cropW = Math.round(videoW * 0.82);
  let cropH = Math.round(videoH * 0.45);

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
 * Preprocesses cropped canvas for high-contrast OCR digit recognition.
 */
export function preprocessCanvasForOcr(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const targetW = Math.max(640, sourceCanvas.width * 1.5);
  const scale = targetW / sourceCanvas.width;
  const targetH = Math.round(sourceCanvas.height * scale);

  const ocrCanvas = document.createElement('canvas');
  ocrCanvas.width = targetW;
  ocrCanvas.height = targetH;
  const ctx = ocrCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0, targetW, targetH);

  const imgData = ctx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;

  const contrast = 1.4;
  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

  for (let i = 0; i < data.length; i += 4) {
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray = factor * (gray - 128) + 128;
    const finalVal = gray > 140 ? 255 : gray < 85 ? 0 : gray;

    data[i] = finalVal;
    data[i + 1] = finalVal;
    data[i + 2] = finalVal;
  }

  ctx.putImageData(imgData, 0, 0);
  return ocrCanvas;
}
