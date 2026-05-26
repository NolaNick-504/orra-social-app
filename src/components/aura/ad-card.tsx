'use client';

import { resolveImageUrl } from '@/lib/utils';
import {
  ExternalLink,
  Sparkles,
  Megaphone,
} from 'lucide-react';

// ─── Ad Data ──────────────────────────────────────────────────────────────────

export interface AdData {
  id: string;
  brand: string;
  headline: string;
  description: string;
  image: string;
  cta: string;
  accentColor: string;       // Tailwind gradient colors
  glowColor: string;         // Box shadow glow color
  outlineColor: string;      // Border outline color
  badge: string;             // e.g. "AD", "PROMOTED", "SPONSORED"
}

export const FEED_ADS: AdData[] = [
  {
    id: 'ad-nova-kicks',
    brand: 'NOVA KICKS',
    headline: 'Step Into the Future',
    description: 'Limited drop — holographic sole tech. Only 500 pairs made. Get yours before they vanish.',
    image: '/images/ads/nova-kicks-sneakers.jpg',
    cta: 'Shop Drop',
    accentColor: 'from-cyan-500 via-blue-500 to-violet-600',
    glowColor: '0 0 30px rgba(34,211,238,0.35), 0 0 60px rgba(139,92,246,0.2)',
    outlineColor: 'border-cyan-400/60',
    badge: 'AD',
  },
  {
    id: 'ad-pulse-audio',
    brand: 'PULSE AUDIO',
    headline: 'Sound Redefined',
    description: 'Spatial audio headphones with AI noise cancellation. Hear what you\'ve been missing.',
    image: '/images/ads/pulse-audio-headphones.jpg',
    cta: 'Learn More',
    accentColor: 'from-amber-400 via-orange-500 to-red-500',
    glowColor: '0 0 30px rgba(251,191,36,0.35), 0 0 60px rgba(239,68,68,0.2)',
    outlineColor: 'border-amber-400/60',
    badge: 'SPONSORED',
  },
  {
    id: 'ad-zenith-wear',
    brand: 'ZENITH',
    headline: 'Wear the Vibe',
    description: 'Iridescent streetwear that shifts color with your mood. Drop 03 is live now.',
    image: '/images/ads/zenith-hoodie.jpg',
    cta: 'Explore',
    accentColor: 'from-violet-500 via-purple-500 to-fuchsia-600',
    glowColor: '0 0 30px rgba(168,85,247,0.35), 0 0 60px rgba(217,70,239,0.2)',
    outlineColor: 'border-violet-400/60',
    badge: 'AD',
  },
  {
    id: 'ad-surge-energy',
    brand: 'SURGE',
    headline: 'Fuel Your Grind',
    description: 'Zero sugar. Infinite focus. The energy drink for creators who never stop.',
    image: '/images/ads/surge-can.jpg',
    cta: 'Try It',
    accentColor: 'from-emerald-400 via-teal-500 to-cyan-600',
    glowColor: '0 0 30px rgba(52,211,153,0.35), 0 0 60px rgba(34,211,238,0.2)',
    outlineColor: 'border-emerald-400/60',
    badge: 'PROMOTED',
  },
];

// ─── AdCard Component ─────────────────────────────────────────────────────────

interface AdCardProps {
  ad: AdData;
}

export function AdCard({ ad }: AdCardProps) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden border-2 ${ad.outlineColor} bg-black/60 backdrop-blur-xl transition-all hover:scale-[1.01] cursor-pointer group`}
      style={{ boxShadow: ad.glowColor }}
    >
      {/* Animated gradient border shimmer */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${ad.accentColor} opacity-20 blur-sm group-hover:opacity-30 transition-opacity`} />

      {/* Content */}
      <div className="relative">
        {/* Image area */}
        <div className="relative aspect-[16/7] overflow-hidden">
          <img
            src={resolveImageUrl(ad.image)}
            alt={ad.brand}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Badge — top left */}
          <div className="absolute top-3 left-3 z-10">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${ad.accentColor} backdrop-blur-md`}>
              <Megaphone className="w-3 h-3 text-white" />
              <span className="text-white text-[10px] font-black uppercase tracking-widest">{ad.badge}</span>
            </div>
          </div>

          {/* Brand logo — top right */}
          <div className="absolute top-3 right-3 z-10">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-white/80" />
              <span className="text-white text-xs font-black tracking-wider">{ad.brand}</span>
            </div>
          </div>
        </div>

        {/* Text + CTA area */}
        <div className="p-4 space-y-3">
          {/* Headline */}
          <h3 className="text-white text-lg font-black leading-tight tracking-tight">
            {ad.headline}
          </h3>

          {/* Description */}
          <p className="text-white/60 text-sm leading-relaxed line-clamp-2">
            {ad.description}
          </p>

          {/* Bottom row: Brand + CTA */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-white/40 text-[11px] font-semibold uppercase tracking-wider">{ad.brand}</span>
            <button
              className={`flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r ${ad.accentColor} text-white text-sm font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all`}
              style={{ boxShadow: ad.glowColor }}
              onClick={(e) => {
                e.stopPropagation();
                // Future: track ad click
              }}
            >
              {ad.cta}
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scanning line animation — futuristic effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div
          className="absolute left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: `linear-gradient(90deg, transparent, white, transparent)`,
            animation: `adScan 3s ease-in-out infinite`,
          }}
        />
      </div>

      {/* Corner accents — futuristic frame marks */}
      <div className="absolute top-0 left-0 w-6 h-6 pointer-events-none">
        <div className={`absolute top-0 left-0 w-4 h-px bg-gradient-to-r ${ad.accentColor} opacity-60`} />
        <div className={`absolute top-0 left-0 w-px h-4 bg-gradient-to-b ${ad.accentColor} opacity-60`} />
      </div>
      <div className="absolute top-0 right-0 w-6 h-6 pointer-events-none">
        <div className={`absolute top-0 right-0 w-4 h-px bg-gradient-to-l ${ad.accentColor} opacity-60`} />
        <div className={`absolute top-0 right-0 w-px h-4 bg-gradient-to-b ${ad.accentColor} opacity-60`} />
      </div>
      <div className="absolute bottom-0 left-0 w-6 h-6 pointer-events-none">
        <div className={`absolute bottom-0 left-0 w-4 h-px bg-gradient-to-r ${ad.accentColor} opacity-60`} />
        <div className={`absolute bottom-0 left-0 w-px h-4 bg-gradient-to-t ${ad.accentColor} opacity-60`} />
      </div>
      <div className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none">
        <div className={`absolute bottom-0 right-0 w-4 h-px bg-gradient-to-l ${ad.accentColor} opacity-60`} />
        <div className={`absolute bottom-0 right-0 w-px h-4 bg-gradient-to-t ${ad.accentColor} opacity-60`} />
      </div>

      <style jsx>{`
        @keyframes adScan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
