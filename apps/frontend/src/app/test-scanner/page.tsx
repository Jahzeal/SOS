'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ShieldCheck, CheckCircle2, ShieldAlert, RefreshCw, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function ScannerTestPage() {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [scanFormat, setScanFormat] = useState<string | null>(null);
  const [scanTime, setScanTime] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [apiResult, setApiResult] = useState<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(true);

  useEffect(() => {
    let html5QrCode: any = null;
    let isMounted = true;

    if (isScanningActive) {
      setCameraError(null);
      import('html5-qrcode')
        .then(({ Html5Qrcode, Html5QrcodeSupportedFormats }) => {
          if (!isMounted) return;

          setTimeout(() => {
            const container = document.getElementById('test-camera-scanner');
            if (!container) return;

            try {
              html5QrCode = new Html5Qrcode('test-camera-scanner');

              const formatsToSupport = [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
              ];

              html5QrCode
                .start(
                  { facingMode: 'environment' },
                  {
                    fps: 15,
                    qrbox: { width: 260, height: 180 },
                    formatsToSupport: formatsToSupport,
                    experimentalFeatures: {
                      useBarCodeDetectorIfSupported: true,
                    },
                  },
                  async (decodedText: string, result: any) => {
                    const formatName = result?.result?.format?.formatName || 'Decoded Code';
                    setScannedCode(decodedText);
                    setScanFormat(formatName);
                    setScanTime(new Date().toLocaleTimeString());
                    setIsVerifying(true);
                    setApiResult(null);

                    try {
                      const res = await api.verifyPublicImei(decodedText.trim());
                      setApiResult({ success: true, data: res });
                    } catch (err: any) {
                      setApiResult({ success: false, error: err.message || 'Record not found' });
                    } finally {
                      setIsVerifying(false);
                    }
                  },
                  () => {}
                )
                .catch((err: any) => {
                  console.warn('Camera start error:', err);
                  setCameraError('Camera access failed or was blocked. Please grant camera permissions.');
                });
            } catch (e: any) {
              console.error('Html5Qrcode init error:', e);
            }
          }, 150);
        })
        .catch(console.error);
    }

    return () => {
      isMounted = false;
      if (html5QrCode) {
        try {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
          } else {
            html5QrCode.clear();
          }
        } catch (e) {}
      }
    };
  }, [isScanningActive]);

  const resetTest = () => {
    setScannedCode(null);
    setScanFormat(null);
    setScanTime(null);
    setApiResult(null);
    setIsScanningActive(false);
    setTimeout(() => setIsScanningActive(true), 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 max-w-3xl mx-auto space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <Badge variant="verified" size="sm" className="mb-2">
          SCANNER VERIFICATION SUITE
        </Badge>
        <h1 className="text-2xl font-extrabold text-slate-900">1D Barcode & 2D QR Code Camera Test</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Tests real-time camera scanning for device barcodes (CODE_128, EAN_13, UPC) and receipt QR codes.
        </p>
      </div>

      {/* Camera Viewfinder Box */}
      <div className="vf-card p-6 bg-white space-y-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Smartphone className="w-4 h-4 text-blue-600" /> Camera Feed (15 FPS Multi-Format)
          </div>
          <Button variant="secondary" size="sm" onClick={resetTest} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Restart Camera
          </Button>
        </div>

        {cameraError ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{cameraError}</span>
          </div>
        ) : (
          <div className="relative w-full rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 min-h-[300px] flex items-center justify-center">
            <div id="test-camera-scanner" className="w-full h-full min-h-[300px]" />
            <div className="scanner-overlay-reticle">
              <div className="scanner-overlay-laser" />
            </div>
          </div>
        )}

        <div className="text-[11px] text-slate-500 text-center font-medium">
          Align any barcode or QR code inside the green bounding box to test decoding.
        </div>
      </div>

      {/* Live Results Display */}
      {scannedCode && (
        <div className="vf-card p-6 bg-white space-y-4 shadow-md border border-slate-200 animate-in fade-in duration-200">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
            Scan Detection Result
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Decoded Text / IMEI</span>
              <span className="font-mono font-extrabold text-slate-900 text-sm">{scannedCode}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Barcode Format</span>
              <span className="font-bold text-blue-600 text-sm">{scanFormat}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">Scanned at {scanTime}</div>

          {/* Database Query Result */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-xs font-bold text-slate-800">Supabase DB Query Status:</div>
            {isVerifying ? (
              <div className="p-3 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" /> Querying Live Database...
              </div>
            ) : apiResult?.success ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified Record Found in DB!
                  </span>
                  <Badge variant="verified" size="sm">GENUINE</Badge>
                </div>
                <div className="text-slate-700 font-medium">
                  {apiResult.data?.brand} {apiResult.data?.model} • {apiResult.data?.business?.name}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                <span className="font-bold text-slate-900">Record Not Found:</span> Scanned string <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-800">{scannedCode}</code> is not registered in DB yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
