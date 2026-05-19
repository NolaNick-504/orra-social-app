'use client';

import { useEffect, useState } from 'react';

/**
 * GameBackground - Reusable animated background component
 * Mimics the Dance Off design: deep purple gradients, holographic wireframe shapes,
 * floating particles, and geometric depth effects.
 *
 * Usage: <GameBackground accentColor="violet" /> or <GameBackground accentColor="amber" />
 */

interface GameBackgroundProps {
  /** Color accent for the glow effects. Maps to tailwind color families. */
  accentColor?: 'violet' | 'amber' | 'red' | 'blue' | 'emerald' | 'fuchsia' | 'pink';
  /** Show silhouette decoration (e.g., dancer) */
  showSilhouette?: boolean;
  /** Intensity of the glow (0-1) */
  intensity?: number;
}

const ACCENT_MAP: Record<string, { glow: string; particle: string; wire: string; radial: string }> = {
  violet:  { glow: 'rgba(139,92,246,0.4)', particle: 'rgba(167,139,250,0.6)', wire: 'rgba(139,92,246,0.15)', radial: 'rgba(139,92,246,0.08)' },
  amber:   { glow: 'rgba(245,158,11,0.4)',  particle: 'rgba(252,211,77,0.6)',  wire: 'rgba(245,158,11,0.15)', radial: 'rgba(245,158,11,0.08)' },
  red:     { glow: 'rgba(239,68,68,0.4)',    particle: 'rgba(248,113,113,0.6)', wire: 'rgba(239,68,68,0.15)',  radial: 'rgba(239,68,68,0.08)' },
  blue:    { glow: 'rgba(59,130,246,0.4)',   particle: 'rgba(96,165,250,0.6)',  wire: 'rgba(59,130,246,0.15)', radial: 'rgba(59,130,246,0.08)' },
  emerald: { glow: 'rgba(16,185,129,0.4)',   particle: 'rgba(52,211,153,0.6)',  wire: 'rgba(16,185,129,0.15)', radial: 'rgba(16,185,129,0.08)' },
  fuchsia: { glow: 'rgba(217,70,239,0.4)',   particle: 'rgba(232,121,249,0.6)', wire: 'rgba(217,70,239,0.15)', radial: 'rgba(217,70,239,0.08)' },
  pink:    { glow: 'rgba(236,72,153,0.4)',   particle: 'rgba(244,114,182,0.6)', wire: 'rgba(236,72,153,0.15)', radial: 'rgba(236,72,153,0.08)' },
};

// Floating particle component
function Particle({ delay, x, y, size, color }: { delay: number; x: string; y: string; size: number; color: string }) {
  return (
    <div
      className="absolute rounded-full animate-ping"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
        animationDuration: `${3 + delay}s`,
        animationDelay: `${delay * 0.7}s`,
        opacity: 0.5,
      }}
    />
  );
}

export function GameBackground({ accentColor = 'violet', showSilhouette = false, intensity = 0.6 }: GameBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const colors = ACCENT_MAP[accentColor] || ACCENT_MAP.violet;
  const op = intensity;

  // Generate random-ish but deterministic particles
  const particles = [
    { delay: 0.5, x: '15%', y: '20%', size: 3, color: colors.particle },
    { delay: 1.2, x: '75%', y: '15%', size: 2, color: colors.particle },
    { delay: 2.0, x: '45%', y: '70%', size: 2.5, color: colors.particle },
    { delay: 0.8, x: '85%', y: '55%', size: 2, color: colors.particle },
    { delay: 1.5, x: '25%', y: '80%', size: 1.5, color: colors.particle },
    { delay: 2.5, x: '60%', y: '35%', size: 2, color: colors.particle },
    { delay: 0.3, x: '90%', y: '85%', size: 1.5, color: colors.particle },
    { delay: 1.8, x: '10%', y: '50%', size: 2.5, color: colors.particle },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Base dark gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(20,10,40,${0.8 * op}) 0%, rgba(5,5,15,${0.95 * op}) 100%)`,
        }}
      />

      {/* Central glow orb */}
      <div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
        style={{
          width: '60%',
          height: '60%',
          background: `radial-gradient(circle, ${colors.glow.replace('0.4', `${0.2 * op}`)} 0%, transparent 70%)`,
        }}
      />

      {/* Bottom-left radial glow */}
      <div
        className="absolute -left-10 -bottom-10 rounded-full blur-[80px]"
        style={{
          width: '50%',
          height: '50%',
          background: `radial-gradient(circle, ${colors.radial} 0%, transparent 70%)`,
        }}
      />

      {/* Top-right secondary glow */}
      <div
        className="absolute -right-10 -top-10 rounded-full blur-[60px]"
        style={{
          width: '40%',
          height: '40%',
          background: `radial-gradient(circle, ${colors.radial} 0%, transparent 70%)`,
        }}
      />

      {/* Holographic wireframe shapes - rotating cube outline */}
      <svg
        className="absolute opacity-20"
        style={{ right: '5%', top: '10%', width: '120px', height: '120px', animation: 'game-bg-float 8s ease-in-out infinite' }}
        viewBox="0 0 100 100"
      >
        {/* Wireframe cube */}
        <polygon
          points="50,10 90,30 90,70 50,90 10,70 10,30"
          fill="none"
          stroke={colors.wire.replace('0.15', `${0.3 * op}`)}
          strokeWidth="0.8"
        />
        <polygon
          points="50,10 90,30 90,70 50,90 10,70 10,30"
          fill="none"
          stroke={colors.wire.replace('0.15', `${0.15 * op}`)}
          strokeWidth="0.5"
          transform="translate(5,5) scale(0.9)"
        />
        <line x1="50" y1="10" x2="50" y2="90" stroke={colors.wire.replace('0.15', `${0.1 * op}`)} strokeWidth="0.3" />
        <line x1="10" y1="30" x2="90" y2="70" stroke={colors.wire.replace('0.15', `${0.1 * op}`)} strokeWidth="0.3" />
        <line x1="90" y1="30" x2="10" y2="70" stroke={colors.wire.replace('0.15', `${0.1 * op}`)} strokeWidth="0.3" />
      </svg>

      {/* Holographic triangle - left side */}
      <svg
        className="absolute opacity-15"
        style={{ left: '3%', bottom: '20%', width: '80px', height: '80px', animation: 'game-bg-float 10s ease-in-out infinite reverse' }}
        viewBox="0 0 100 100"
      >
        <polygon
          points="50,10 95,85 5,85"
          fill="none"
          stroke={colors.wire.replace('0.15', `${0.25 * op}`)}
          strokeWidth="0.8"
        />
        <polygon
          points="50,25 80,75 20,75"
          fill="none"
          stroke={colors.wire.replace('0.15', `${0.12 * op}`)}
          strokeWidth="0.5"
        />
      </svg>

      {/* Diamond shape - center-right */}
      <svg
        className="absolute opacity-10"
        style={{ right: '15%', bottom: '25%', width: '60px', height: '60px', animation: 'game-bg-float 12s ease-in-out infinite' }}
        viewBox="0 0 100 100"
      >
        <polygon
          points="50,5 95,50 50,95 5,50"
          fill="none"
          stroke={colors.wire.replace('0.15', `${0.2 * op}`)}
          strokeWidth="0.8"
        />
      </svg>

      {/* Small hexagon - top-left */}
      <svg
        className="absolute opacity-10"
        style={{ left: '20%', top: '5%', width: '50px', height: '50px', animation: 'game-bg-float 9s ease-in-out infinite' }}
        viewBox="0 0 100 100"
      >
        <polygon
          points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5"
          fill="none"
          stroke={colors.wire.replace('0.15', `${0.2 * op}`)}
          strokeWidth="0.6"
        />
      </svg>

      {/* Floating particles */}
      {mounted && particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      {/* Dancer silhouette (optional) */}
      {showSilhouette && (
        <svg
          className="absolute opacity-[0.06]"
          style={{ right: '0', bottom: '0', width: '200px', height: '350px', transform: 'scaleX(-1)' }}
          viewBox="0 0 200 350"
        >
          {/* Stylized dancer silhouette */}
          <ellipse cx="100" cy="30" rx="18" ry="22" fill={colors.glow.replace('0.4', '1')} />
          <path
            d="M100,52 C100,52 85,80 80,120 C75,160 70,200 75,240 C80,280 85,300 85,320 L95,320 L95,260 L100,220 L105,260 L105,320 L115,320 C115,300 120,280 125,240 C130,200 125,160 120,120 C115,80 100,52 100,52 Z"
            fill={colors.glow.replace('0.4', '1')}
          />
          {/* Arms */}
          <path
            d="M85,80 C70,70 40,55 25,65 C10,75 5,90 15,95 C25,100 50,80 85,85 Z"
            fill={colors.glow.replace('0.4', '1')}
          />
          <path
            d="M115,80 C130,75 155,60 170,70 C185,80 190,100 180,105 C170,110 145,90 115,85 Z"
            fill={colors.glow.replace('0.4', '1')}
          />
        </svg>
      )}

      {/* Gradient overlay from bottom (for text readability) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{
          background: `linear-gradient(to top, rgba(5,5,15,${0.5 * op}) 0%, transparent 100%)`,
        }}
      />

      {/* Subtle grid lines for depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(${colors.wire.replace('0.15', '0.5')} 1px, transparent 1px),
            linear-gradient(90deg, ${colors.wire.replace('0.15', '0.5')} 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
