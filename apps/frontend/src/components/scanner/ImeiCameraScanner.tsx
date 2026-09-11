'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, ShieldAlert, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  extractImeiOrSerial,
  extractValidIMEI,
  getCroppedReticleCanvas,
  preprocessCanvasForOcr as preprocessOcrCanvas,
} from '@/lib/imei-utils';

export interface ScannedResult {
  imei?: string;
  serial?: string;
  rawText?: string;
  format?: string;
}

export interface ImeiCameraScannerProps {
  mode?: 'inline' | 'modal';
  isOpen?: boolean;
  onClose?: () => void;
  onDetected: (result: ScannedResult) => void;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function ImeiCameraScanner({
  mode = 'inline',
  isOpen = true,
  onClose,
  onDetected,
  title = 'Scan Phone Box / IMEI',
  subtitle = 'Align phone box IMEI or Serial Number barcode inside green box',
  className = '',
}: ImeiCameraScannerProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraFrozen, setIsCameraFrozen] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [scannedFormat, setScannedFormat] = useState<string | null>(null);
  const [scannedImei, setScannedImei] = useState<string>('');
  const [scannedSerial, setScannedSerial] = useState<string>('');
  const [googleLensPills, setGoogleLensPills] = useState<any[]>([]);
  const [cameraGuidance, setCameraGuidance] = useState<{
    message: string;
    type: 'success' | 'warning' | 'dark' | 'info';
  }>({
    message: 'Align IMEI / Serial barcode inside reticle',
    type: 'info',
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reticleRef = useRef<HTMLDivElement | null>(null);

  const hasScannedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const lastScanTimeRef = useRef(0);
  const lastDetectionTimeRef = useRef(Date.now());

  // Mount and start scanner
  useEffect(() => {
    if (!isOpen) return;

    let codeReader: any = null;
    let controls: any = null;
    let isMounted = true;
    let frameCheckInterval: any = null;

    setCameraError(null);
    setIsCameraFrozen(false);
    setScannedFormat(null);
    setScannedImei('');
    setScannedSerial('');
    setGoogleLensPills([]);
    hasScannedRef.current = false;
    isProcessingRef.current = false;
    lastDetectionTimeRef.current = Date.now();
    setCameraGuidance({ message: 'Align IMEI / Serial barcode inside reticle', type: 'info' });

    Promise.all([
      import('@zxing/browser'),
      import('@zxing/library'),
    ])
      .then(([{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }]) => {
        if (!isMounted) return;

        setTimeout(async () => {
          const videoElement = videoRef.current;
          if (!videoElement) return;

          // Offscreen canvas for low-light luminance check
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          canvas.width = 160;
          canvas.height = 120;

          frameCheckInterval = setInterval(() => {
            if (
              !videoElement ||
              videoElement.paused ||
              videoElement.ended ||
              videoElement.readyState < 2 ||
              !videoElement.videoWidth ||
              hasScannedRef.current ||
              isProcessingRef.current
            ) {
              return;
            }
            try {
              ctx?.drawImage(videoElement, 0, 0, 160, 120);
              const imgData = ctx?.getImageData(0, 0, 160, 120);
              if (imgData) {
                let totalLuminance = 0;
                const pixels = imgData.data;
                for (let i = 0; i < pixels.length; i += 16) {
                  const r = pixels[i];
                  const g = pixels[i + 1];
                  const b = pixels[i + 2];
                  totalLuminance += 0.2126 * r + 0.7152 * g + 0.0722 * b;
                }
                const avgLuminance = totalLuminance / (pixels.length / 16);
                if (avgLuminance < 25) {
                  setCameraGuidance({
                    message: 'Environment Too Dark — Turn on lighting or flash',
                    type: 'dark',
                  });
                } else {
                  setCameraGuidance({
                    message: 'Align box sticker inside reticle or tap Snap',
                    type: 'info',
                  });
                }
              }
            } catch (e) {}
          }, 600);

          try {
            const hints = new Map();
            hints.set(DecodeHintType.TRY_HARDER, true);
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [
              BarcodeFormat.CODE_128,
              BarcodeFormat.CODE_39,
              BarcodeFormat.EAN_13,
              BarcodeFormat.UPC_A,
              BarcodeFormat.QR_CODE,
              BarcodeFormat.DATA_MATRIX,
            ]);

            codeReader = new BrowserMultiFormatReader(hints);
            controls = await codeReader.decodeFromVideoDevice(
              undefined,
              videoElement,
              async (result: any) => {
                if (!result || hasScannedRef.current || isProcessingRef.current) {
                  return;
                }

                // Cooldown: Ignore triggers within 2 seconds of last scan
                if (Date.now() - lastScanTimeRef.current < 2000) {
                  return;
                }

                const rawText = result.getText ? result.getText() : (result.text || '');
                if (!rawText) return;

                const parsed = extractImeiOrSerial(rawText);
                if (!parsed || !parsed.value) {
                  return;
                }
                const cleanIdentifier = parsed.value;

                // Set synchronous guards immediately
                hasScannedRef.current = true;
                isProcessingRef.current = true;
                lastScanTimeRef.current = Date.now();

                const formatName = result.getBarcodeFormat ? `FORMAT_${result.getBarcodeFormat()}` : 'BARCODE';

                try {
                  videoElement.pause();
                } catch (e) {}
                setIsCameraFrozen(true);
                setScannedFormat(formatName);

                if (parsed.type === 'IMEI') {
                  setScannedImei(cleanIdentifier);
                  setCameraGuidance({
                    message: `IMEI detected: ${cleanIdentifier}`,
                    type: 'success',
                  });
                  onDetected({ imei: cleanIdentifier, format: formatName, rawText });
                } else {
                  setScannedSerial(cleanIdentifier);
                  setCameraGuidance({
                    message: `Serial detected: ${cleanIdentifier}`,
                    type: 'success',
                  });
                  onDetected({ serial: cleanIdentifier, format: formatName, rawText });
                }

                isProcessingRef.current = false;
              }
            );
          } catch (err: any) {
            console.warn('ZXing camera start error:', err);
            setCameraError(
              'Camera access was denied or not available. Please allow camera permissions in your browser.'
            );
          }
        }, 150);
      })
      .catch((err) => {
        console.error('Failed to load ZXing scanner:', err);
      });

    return () => {
      isMounted = false;
      if (frameCheckInterval) clearInterval(frameCheckInterval);
      if (controls) {
        try {
          controls.stop();
        } catch (e) {}
      }
    };
  }, [isOpen]);

  const handleSnapAndScanText = async () => {
    const videoElement = videoRef.current;
    const reticleElement = reticleRef.current;
    if (!videoElement || videoElement.paused) return;

    setIsOcrProcessing(true);
    setCameraGuidance({
      message: 'Looking for IMEI...',
      type: 'info',
    });

    const cropResult = getCroppedReticleCanvas(videoElement, reticleElement || undefined);
    if (!cropResult) {
      setIsOcrProcessing(false);
      return;
    }

    const { cropCanvas } = cropResult;

    const displayCanvas = canvasRef.current;
    if (displayCanvas) {
      displayCanvas.width = cropCanvas.width;
      displayCanvas.height = cropCanvas.height;
      const dCtx = displayCanvas.getContext('2d');
      dCtx?.drawImage(cropCanvas, 0, 0);
    }

    // Freeze video feed instantly
    try {
      videoElement.pause();
    } catch (e) {}
    setIsCameraFrozen(true);
    hasScannedRef.current = true;

    // Apply high-contrast grayscale pre-processing
    const processedCanvas = preprocessOcrCanvas(cropCanvas);

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');

      const ret = await worker.recognize(processedCanvas);
      const ocrText = ret.data.text || '';
      const activeWords = (ret.data as any).words || [];
      await worker.terminate();

      // Extract and validate 15-digit IMEI candidate using Luhn Checksum
      const validImeiCandidate = extractValidIMEI(ocrText);

      // Generate selection pills
      const pills: any[] = [];
      activeWords.forEach((w: any, idx: number) => {
        const rawW = w.text ? w.text.trim() : '';
        const candidate = extractValidIMEI(rawW);
        const bbox = w.bbox;

        if (bbox && candidate) {
          pills.push({
            id: `lens-pill-${idx}-${bbox.x0}`,
            type: 'IMEI',
            value: candidate,
            rawText: rawW,
            leftPct: Math.max(0, Math.min(95, (bbox.x0 / cropCanvas.width) * 100)),
            topPct: Math.max(0, Math.min(95, (bbox.y0 / cropCanvas.height) * 100)),
            widthPct: Math.max(8, Math.min(100, ((bbox.x1 - bbox.x0) / cropCanvas.width) * 100)),
            heightPct: Math.max(4, Math.min(20, ((bbox.y1 - bbox.y0) / cropCanvas.height) * 100)),
            isPrimary: true,
          });
        }
      });

      setGoogleLensPills(pills);

      if (validImeiCandidate) {
        setScannedImei(validImeiCandidate);
        setScannedFormat('IMEI_LUHN_VALIDATED');
        setCameraGuidance({
          message: `IMEI detected: ${validImeiCandidate}`,
          type: 'success',
        });
        onDetected({ imei: validImeiCandidate, format: 'IMEI_LUHN_VALIDATED', rawText: ocrText });
      } else {
        const parsed = extractImeiOrSerial(ocrText);
        if (parsed.type === 'SERIAL' && parsed.value) {
          setScannedSerial(parsed.value);
          setScannedFormat('SERIAL_OCR');
          setCameraGuidance({
            message: `Serial detected: ${parsed.value}`,
            type: 'success',
          });
          onDetected({ serial: parsed.value, format: 'SERIAL_OCR', rawText: ocrText });
        } else {
          setCameraGuidance({
            message: 'No valid IMEI detected. Align box inside frame or tap bubbles.',
            type: 'warning',
          });
        }
      }
    } catch (err) {
      console.error('Snap OCR error:', err);
      setCameraGuidance({
        message: 'Could not read text. Please type manually or align barcode.',
        type: 'warning',
      });
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleSelectLensPill = (pill: any) => {
    if (!pill || !pill.value) return;
    if (pill.type === 'IMEI') {
      setScannedImei(pill.value);
      onDetected({ imei: pill.value, format: 'PILL_SELECT', rawText: pill.rawText });
    } else {
      setScannedSerial(pill.value);
      onDetected({ serial: pill.value, format: 'PILL_SELECT', rawText: pill.rawText });
    }
    setCameraGuidance({
      message: `Selected: ${pill.value}`,
      type: 'success',
    });
  };

  const resumeCameraScanning = () => {
    setIsCameraFrozen(false);
    setGoogleLensPills([]);
    setScannedFormat(null);
    lastScanTimeRef.current = Date.now();
    setCameraGuidance({ message: 'Align IMEI / Serial barcode inside reticle', type: 'info' });

    setTimeout(() => {
      hasScannedRef.current = false;
      isProcessingRef.current = false;
    }, 1200);

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.play().catch(() => {});
    }
  };

  if (!isOpen) return null;

  const scannerContent = (
    <div className={`space-y-3 ${className}`}>
      {cameraError ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{cameraError}</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition text-xs shadow-sm"
            >
              Close Camera
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-950 min-h-[260px] flex items-center justify-center">
            <video
              ref={videoRef}
              className={`w-full h-full min-h-[260px] object-cover ${isCameraFrozen ? 'hidden' : 'block'}`}
              muted
              playsInline
            />

            <canvas
              ref={canvasRef}
              className={`w-full h-auto min-h-[260px] object-contain ${isCameraFrozen ? 'block' : 'hidden'}`}
            />

            {/* Real-time Guidance Banner */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-max max-w-[90%]">
              <div
                className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold shadow-lg backdrop-blur-md transition-all flex items-center justify-center gap-1.5 ${
                  cameraGuidance.type === 'dark'
                    ? 'bg-amber-500 text-slate-950 animate-pulse border border-amber-300'
                    : cameraGuidance.type === 'warning'
                    ? 'bg-slate-900/90 text-amber-400 border border-amber-500/40'
                    : cameraGuidance.type === 'success'
                    ? 'bg-emerald-600 text-white border border-emerald-300'
                    : 'bg-slate-900/80 text-white border border-slate-700'
                }`}
              >
                {cameraGuidance.message}
              </div>
            </div>

            {/* SCANNER OVERLAY RETICLE FRAME */}
            <div ref={reticleRef} className="scanner-overlay-reticle flex flex-col items-center justify-between p-2">
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30 shadow-sm">
                Scan Box Barcode
              </span>
              <span className="text-[9px] font-semibold text-slate-200 bg-slate-950/70 px-2 py-0.5 rounded-full">
                PLACE 15-DIGIT IMEI BARCODE HERE
              </span>
              {!isCameraFrozen && <div className="scanner-overlay-laser" />}
            </div>

            {/* SNAP / CAPTURE BUTTON */}
            {!isCameraFrozen && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                <button
                  type="button"
                  onClick={handleSnapAndScanText}
                  disabled={isOcrProcessing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-full shadow-2xl transition border border-blue-400/40 flex items-center gap-1.5 text-xs shadow-blue-600/30 disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {isOcrProcessing ? 'Scanning...' : 'Scan IMEI Frame'}
                </button>
              </div>
            )}

            {/* FLOATING GOOGLE LENS BUBBLES */}
            {isCameraFrozen && googleLensPills.length > 0 && (
              <div className="absolute inset-0 z-30 pointer-events-auto p-2">
                {googleLensPills.map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => handleSelectLensPill(pill)}
                    style={{
                      left: `${pill.leftPct}%`,
                      top: `${pill.topPct}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full transition-all duration-200 transform hover:scale-110 flex items-center gap-1 text-[11px] font-mono font-black border shadow-2xl ${
                      pill.type === 'IMEI'
                        ? 'bg-emerald-600 text-white border-emerald-300 ring-4 ring-emerald-400/70 shadow-emerald-600/60 animate-bounce z-40'
                        : 'bg-blue-600 text-white border-blue-300 ring-4 ring-blue-400/70 shadow-blue-600/50 z-30'
                    }`}
                  >
                    {pill.type === 'IMEI' && <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />}
                    <span className="truncate max-w-[150px]">{pill.value}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Captured details & Actions */}
          <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 font-medium">
            {isCameraFrozen ? (
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={resumeCameraScanning}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Scan Another
                </button>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Use Scanned
                  </button>
                )}
              </div>
            ) : (
              <span className="text-slate-400 text-center w-full">
                Point camera at barcode or tap <strong className="text-slate-200">Scan IMEI Frame</strong>
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in zoom-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-base">{title}</h3>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {scannerContent}

          <p className="text-xs text-slate-500 text-center font-medium">
            {subtitle}
          </p>

          {onClose && !isCameraFrozen && (
            <Button variant="secondary" fullWidth size="md" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  return scannerContent;
}
