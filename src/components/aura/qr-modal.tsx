'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { resolveImageUrl } from '@/lib/utils';
import { useAuraStore } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import {
  X,
  QrCode,
  ScanLine,
  Users,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  isOwnProfile?: boolean;
}

// ─── QR Code Display Card ─────────────────────────────────────────────────────

function QRDisplayCard({
  userId,
  userName,
  userHandle,
  userAvatar,
}: {
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
}) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // The QR data encodes the ORRA profile link using the actual server URL
  const qrData = typeof window !== 'undefined' ? `${window.location.origin}/profile/${userId}` : `/profile/${userId}`;

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${userId}`).catch(() => {});
    setCopied(true);
    toast.success('Profile link copied!');
    setTimeout(() => setCopied(false), 2000);
  }, [userId]);

  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 400;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, 400, 400);

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 50, 50, 300, 300);
      const link = document.createElement('a');
      link.download = `orra-qr-${userHandle.replace('@', '')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('QR code saved!');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [userHandle]);

  return (
    <div className="flex flex-col items-center">
      {/* QR Code container with futuristic frame */}
      <div
        ref={qrRef}
        className="relative p-6 rounded-3xl bg-gradient-to-br from-violet-950/80 via-black to-fuchsia-950/80 border border-violet-500/30"
        style={{ boxShadow: '0 0 40px rgba(139,92,246,0.2), 0 0 80px rgba(217,70,239,0.1)' }}
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-5 h-5">
          <div className="absolute top-0 left-0 w-4 h-px bg-gradient-to-r from-violet-400 to-transparent" />
          <div className="absolute top-0 left-0 w-px h-4 bg-gradient-to-b from-violet-400 to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-5 h-5">
          <div className="absolute top-0 right-0 w-4 h-px bg-gradient-to-l from-violet-400 to-transparent" />
          <div className="absolute top-0 right-0 w-px h-4 bg-gradient-to-b from-violet-400 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 w-5 h-5">
          <div className="absolute bottom-0 left-0 w-4 h-px bg-gradient-to-r from-fuchsia-400 to-transparent" />
          <div className="absolute bottom-0 left-0 w-px h-4 bg-gradient-to-t from-fuchsia-400 to-transparent" />
        </div>
        <div className="absolute bottom-0 right-0 w-5 h-5">
          <div className="absolute bottom-0 right-0 w-4 h-px bg-gradient-to-l from-fuchsia-400 to-transparent" />
          <div className="absolute bottom-0 right-0 w-px h-4 bg-gradient-to-t from-fuchsia-400 to-transparent" />
        </div>

        {/* Scan line animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <div
            className="absolute left-4 right-4 h-px opacity-40"
            style={{
              background: 'linear-gradient(90deg, transparent, #8b5cf6, #d946ef, transparent)',
              animation: 'qrScan 4s ease-in-out infinite',
            }}
          />
        </div>

        {/* User info above QR */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={resolveImageUrl(userAvatar)}
            alt={userName}
            className="w-10 h-10 rounded-full ring-2 ring-violet-500/40 object-cover"
          />
          <div className="min-w-0">
            <p className="text-white text-sm font-bold truncate">{userName}</p>
            <p className="text-violet-300/60 text-xs truncate">{userHandle}</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl p-3 flex items-center justify-center">
          <QRCodeSVG
            value={qrData}
            size={200}
            level="H"
            bgColor="#ffffff"
            fgColor="#0a0a1a"
            imageSettings={{
              src: '/api/uploads?path=images/orra-logo.png',
              height: 36,
              width: 36,
              excavate: true,
            }}
          />
        </div>

        {/* Label below QR */}
        <p className="text-center text-violet-300/50 text-[10px] font-bold uppercase tracking-widest mt-4">
          Scan to connect on ORRA
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-violet-500/20"
        >
          <Download className="w-4 h-4" />
          Save QR
        </button>
      </div>

      <style jsx>{`
        @keyframes qrScan {
          0% { top: 10%; }
          50% { top: 85%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
}

// ─── QR Scanner (camera-based) ────────────────────────────────────────────────

function QRScanner({ onScan, onClose }: { onScan: (data: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');
  const streamRef = useRef<MediaStream | null>(null);

  const startScanner = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
        setError(null);
      }
    } catch (err) {
      setError('Camera access denied. You can enter the profile ID manually below.');
      setScanning(false);
    }
  }, []);

  const stopScanner = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Simple QR detection loop using canvas analysis
  useEffect(() => {
    if (!scanning) return;
    let running = true;

    const detect = async () => {
      if (!running || !videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0);

      // For now, we use a simple approach: try to read QR from the video frame
      // In production you'd use a library like jsQR or html5-qrcode
      // We'll use the BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        try {
          // @ts-ignore - BarcodeDetector is not yet in TypeScript types
          const detector = new BarcodeDetector({ formats: ['qr_code'] });
          const results = await detector.detect(canvas);
          if (results.length > 0) {
            const value = results[0].rawValue;
            if (value) {
              // Support both orra:// protocol and actual URLs
              let profileId: string | null = null;
              if (value.includes('orra://profile/')) {
                profileId = value.replace('orra://profile/', '');
              } else if (value.includes('/profile/')) {
                profileId = value.split('/profile/').pop() || null;
              }
              if (profileId) {
                stopScanner();
                onScan(profileId);
                return;
              }
              // For any other QR, just pass the value through
              stopScanner();
              onScan(value);
              return;
            }
          }
        } catch {}
      }

      requestAnimationFrame(detect);
    };

    const interval = setTimeout(() => detect(), 500);
    return () => {
      running = false;
      clearTimeout(interval);
    };
  }, [scanning, onScan, stopScanner]);

  const handleManualSubmit = useCallback(() => {
    if (manualId.trim()) {
      onScan(manualId.trim());
    }
  }, [manualId, onScan]);

  return (
    <div className="flex flex-col items-center">
      {/* Scanner viewport */}
      <div className="relative w-64 h-64 rounded-3xl overflow-hidden border-2 border-violet-500/40 bg-black/80">
        {scanning ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scan overlay frame */}
            <div className="absolute inset-4 pointer-events-none">
              {/* Top-left corner */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-violet-400 rounded-tl-lg" />
              {/* Top-right corner */}
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-violet-400 rounded-tr-lg" />
              {/* Bottom-left corner */}
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-fuchsia-400 rounded-bl-lg" />
              {/* Bottom-right corner */}
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-fuchsia-400 rounded-br-lg" />

              {/* Scanning line */}
              <div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent"
                style={{ animation: 'scanLine 2.5s ease-in-out infinite' }}
              />
            </div>

            {/* Stop button */}
            <button
              onClick={stopScanner}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white text-xs font-medium"
            >
              Stop Scanning
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            {error ? (
              <>
                <ScanLine className="w-10 h-10 text-slate-600" />
                <p className="text-slate-500 text-xs text-center px-4">{error}</p>
              </>
            ) : (
              <>
                <ScanLine className="w-12 h-12 text-violet-400/50" />
                <p className="text-slate-500 text-xs">Tap to start scanning</p>
              </>
            )}
            <button
              onClick={startScanner}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-violet-500/20"
            >
              Start Scanner
            </button>
          </div>
        )}
      </div>

      {/* Manual entry fallback */}
      <div className="mt-5 w-full max-w-xs">
        <p className="text-slate-500 text-xs text-center mb-2">Or enter profile ID manually</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="Enter user ID"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
            onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit(); }}
          />
          <button
            onClick={handleManualSubmit}
            disabled={!manualId.trim()}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold disabled:opacity-30 hover:opacity-90 transition-all active:scale-95"
          >
            Go
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}

// ─── Main QR Modal ────────────────────────────────────────────────────────────

export function QRModal({
  isOpen,
  onClose,
  userId,
  userName,
  userHandle,
  userAvatar,
  isOwnProfile = false,
}: QRModalProps) {
  const [tab, setTab] = useState<'my-qr' | 'scan'>('my-qr');
  const { setViewingUser, setView } = useAuraStore();
  const currentUser = useCurrentUser();

  // Handle scanned profile ID
  const handleScanResult = useCallback((scannedId: string) => {
    // Navigate to the scanned user's profile
    setViewingUser(scannedId);
    setView('profile');
    onClose();
    toast.success('Profile found! Connect with them now.');
  }, [setViewingUser, setView, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-[90vw] max-w-sm rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950/30 to-slate-950 border border-violet-500/20 overflow-hidden"
        style={{ boxShadow: '0 0 60px rgba(139,92,246,0.15), 0 0 120px rgba(217,70,239,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-violet-400" />
            <h2 className="text-white text-lg font-bold">ORRA Code</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex mx-5 mt-4 rounded-xl bg-white/5 border border-white/5 overflow-hidden">
          <button
            onClick={() => setTab('my-qr')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-all ${
              tab === 'my-qr'
                ? 'bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            My Code
          </button>
          <button
            onClick={() => setTab('scan')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-all ${
              tab === 'scan'
                ? 'bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            Scan
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {tab === 'my-qr' ? (
            <QRDisplayCard
              userId={userId}
              userName={userName}
              userHandle={userHandle}
              userAvatar={userAvatar}
            />
          ) : (
            <QRScanner onScan={handleScanResult} onClose={onClose} />
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 pb-5">
          <p className="text-center text-slate-600 text-[10px] font-medium">
            {tab === 'my-qr'
              ? 'Share your ORRA Code for instant connections'
              : 'Point your camera at an ORRA Code to add a friend'}
          </p>
        </div>
      </div>
    </div>
  );
}
