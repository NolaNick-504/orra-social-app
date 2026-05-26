'use client';

import { Megaphone, Star, ExternalLink } from 'lucide-react';
import { resolveImageUrl } from '@/lib/utils';

type AdBadge = 'AD' | 'SPONSORED' | 'PROMOTED';

interface FeedAdConfig {
  id: string;
  brand: string;
  headline: string;
  subheadline: string;
  cta: string;
  badge: AdBadge;
  image: string;
  // Color theme - CSS values for glow effects
  glowRgb: string;       // e.g. "20,184,166"
  borderHue: string;     // e.g. "emerald"
  badgeBg: string;
  badgeText: string;
  gradientFrom: string;
  gradientTo: string;
  ctaBg: string;
  ctaHoverBg: string;
  glowCssClass: string;  // Custom CSS class for glow animation
}

const ADS: FeedAdConfig[] = [
  {
    id: 'ad-surge',
    brand: 'SURGE',
    headline: 'Fuel Your Grind',
    subheadline: 'Zero sugar. Infinite focus. The energy drink for creators who never stop.',
    cta: 'Try It',
    badge: 'PROMOTED',
    image: '/images/ads/surge-can.jpg',
    glowRgb: '20,184,166',
    borderHue: 'emerald',
    badgeBg: 'bg-teal-600',
    badgeText: 'text-white',
    gradientFrom: 'from-emerald-900/60',
    gradientTo: 'to-teal-900/60',
    ctaBg: 'bg-teal-600',
    ctaHoverBg: 'hover:bg-teal-500',
    glowCssClass: 'ad-glow-teal',
  },
  {
    id: 'ad-zenith',
    brand: 'ZENITH',
    headline: 'Wear the Vibe',
    subheadline: 'Iridescent streetwear that shifts color with your mood. Drop 03 is live now.',
    cta: 'Explore',
    badge: 'AD',
    image: '/images/ads/zenith-hoodie.jpg',
    glowRgb: '139,92,246',
    borderHue: 'violet',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    gradientFrom: 'from-purple-900/60',
    gradientTo: 'to-violet-900/60',
    ctaBg: 'bg-purple-600',
    ctaHoverBg: 'hover:bg-purple-500',
    glowCssClass: 'ad-glow-violet',
  },
  {
    id: 'ad-pulse-audio',
    brand: 'PULSE AUDIO',
    headline: 'Sound Redefined',
    subheadline: 'Spatial audio headphones with AI noise cancellation. Hear what you\'ve been missing.',
    cta: 'Learn More',
    badge: 'SPONSORED',
    image: '/images/ads/pulse-audio-headphones.jpg',
    glowRgb: '245,158,11',
    borderHue: 'amber',
    badgeBg: 'bg-orange-600',
    badgeText: 'text-white',
    gradientFrom: 'from-amber-900/60',
    gradientTo: 'to-orange-900/60',
    ctaBg: 'bg-orange-600',
    ctaHoverBg: 'hover:bg-orange-500',
    glowCssClass: 'ad-glow-amber',
  },
  {
    id: 'ad-nova-kicks',
    brand: 'NOVA KICKS',
    headline: 'Step Into the Future',
    subheadline: 'Limited drop \u2013 holographic sole tech. Only 500 pairs made. Get yours before they vanish.',
    cta: 'Shop Drop',
    badge: 'AD',
    image: '/images/ads/nova-kicks-sneakers.jpg',
    glowRgb: '59,130,246',
    borderHue: 'blue',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    gradientFrom: 'from-blue-900/60',
    gradientTo: 'to-cyan-900/60',
    ctaBg: 'bg-gradient-to-r from-blue-600 to-purple-600',
    ctaHoverBg: 'hover:opacity-90',
    glowCssClass: 'ad-glow-blue',
  },
];

// Get a consistent ad for a given position index (cycles through ads)
export function getFeedAd(index: number): FeedAdConfig {
  return ADS[index % ADS.length];
}

export function FeedAd({ ad }: { ad: FeedAdConfig }) {
  return (
    <div className="relative my-2">
      {/* OUTER NEON GLOW — multiple layered shadows for a thick, visible neon glow */}
      <div
        className={`absolute -inset-[3px] rounded-2xl ${ad.glowCssClass} opacity-80`}
        style={{
          boxShadow: `
            0 0 8px rgba(${ad.glowRgb}, 0.9),
            0 0 20px rgba(${ad.glowRgb}, 0.6),
            0 0 40px rgba(${ad.glowRgb}, 0.4),
            0 0 80px rgba(${ad.glowRgb}, 0.2),
            inset 0 0 8px rgba(${ad.glowRgb}, 0.3),
            inset 0 0 20px rgba(${ad.glowRgb}, 0.15)
          `,
        }}
      />

      {/* Animated pulsing glow border */}
      <div
        className={`absolute -inset-[2px] rounded-2xl ad-neon-border`}
        style={{
          background: `linear-gradient(135deg, rgba(${ad.glowRgb}, 0.8), transparent 40%, transparent 60%, rgba(${ad.glowRgb}, 0.8))`,
          padding: '2px',
        }}
      >
        <div className="w-full h-full rounded-2xl bg-[#0a0a12]" />
      </div>

      {/* Main ad card */}
      <div
        className="relative rounded-2xl overflow-hidden border-2 transition-all hover:scale-[1.005] z-10"
        style={{
          borderColor: `rgba(${ad.glowRgb}, 0.6)`,
          boxShadow: `0 0 15px rgba(${ad.glowRgb}, 0.3), inset 0 0 15px rgba(${ad.glowRgb}, 0.1)`,
        }}
      >
        {/* Animated top glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] z-20 ad-glow-line"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${ad.glowRgb}, 1), transparent)`,
            boxShadow: `0 0 10px rgba(${ad.glowRgb}, 0.8), 0 0 20px rgba(${ad.glowRgb}, 0.4)`,
          }}
        />

        {/* Animated bottom glow line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] z-20 ad-glow-line"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${ad.glowRgb}, 0.6), transparent)`,
            boxShadow: `0 0 8px rgba(${ad.glowRgb}, 0.5)`,
          }}
        />

        {/* Ad Image */}
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <img
            src={resolveImageUrl(ad.image)}
            alt={ad.brand}
            className="w-full h-full object-cover"
          />
          {/* Bottom gradient overlay for text readability */}
          <div className={`absolute inset-0 bg-gradient-to-t ${ad.gradientFrom} ${ad.gradientTo} via-transparent to-transparent opacity-80`} />

          {/* Badge - top left */}
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full ${ad.badgeBg} ${ad.badgeText} text-[10px] font-bold uppercase tracking-wider z-10`}>
            <Megaphone className="w-3 h-3" />
            {ad.badge}
          </div>

          {/* Brand tag - top right */}
          <div
            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold tracking-wider z-10"
            style={{ boxShadow: `0 0 8px rgba(${ad.glowRgb}, 0.3)` }}
          >
            <Star className="w-3 h-3 text-amber-400" />
            {ad.brand}
          </div>
        </div>

        {/* Ad Content */}
        <div
          className={`px-4 py-3 bg-gradient-to-r ${ad.gradientFrom} ${ad.gradientTo} backdrop-blur-sm`}
          style={{ boxShadow: `inset 0 0 20px rgba(${ad.glowRgb}, 0.1)` }}
        >
          <h3 className="text-white font-bold text-base mb-1">{ad.headline}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-3">{ad.subheadline}</p>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-semibold tracking-wider">{ad.brand}</span>
            <button
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg ${ad.ctaBg} ${ad.ctaHoverBg} text-white text-xs font-bold transition-all`}
              style={{ boxShadow: `0 0 12px rgba(${ad.glowRgb}, 0.4), 0 0 4px rgba(${ad.glowRgb}, 0.6)` }}
              onClick={() => {
                console.log(`Ad clicked: ${ad.brand}`);
              }}
            >
              {ad.cta}
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
