'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { GameHeader, ActionButton, ProgressBar, ScoreDisplay, PlayerAvatar } from './game-types';

interface QuickDrawProps {
  onBack: () => void;
}

// ─── CONSTANTS ───────────────────────────────────────────
const PROMPT_WORDS = ['cat', 'dog', 'house', 'tree', 'car', 'sun', 'fish', 'star', 'heart', 'pizza', 'rocket', 'flower'];
const TOTAL_ROUNDS = 6;
const ROUND_TIME = 15;
const SPEED_BONUS_THRESHOLD = 5;
const CANVAS_SIZE = 300;
const BRUSH_SIZES = [
  { label: 'S', size: 3, icon: '●' },
  { label: 'M', size: 8, icon: '●' },
  { label: 'L', size: 14, icon: '●' },
];

type GamePhase = 'lobby' | 'drawing' | 'voting' | 'results';
type GameMode = 'bot' | 'friend';

interface RoundData {
  word: string;
  playerStrokes: number;
  botStrokes: number;
  playerCoverage: number;
  botCoverage: number;
  playerTime: number;
  winner: 'player' | 'bot' | 'draw';
  playerCanvas: string; // data URL
  botCanvas: string;    // data URL
  playerPoints: number;
  botPoints: number;
}

// ─── BOT DRAWING GENERATOR ───────────────────────────────
function generateBotDrawing(ctx: CanvasRenderingContext2D, word: string, canvasSize: number): { strokes: number; coverage: number } {
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = canvasSize / 2;
  const cy = canvasSize / 2;
  const r = canvasSize * 0.3;
  let strokes = 0;

  const drawLine = (x1: number, y1: number, x2: number, y2: number, width: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    strokes++;
  };

  const drawCircle = (x: number, y: number, radius: number, width: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    strokes++;
  };

  const drawArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number, width: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.stroke();
    strokes++;
  };

  const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff88', '#ff6688', '#88aaff'];
  const c1 = colors[Math.floor(Math.random() * colors.length)];
  const c2 = colors[Math.floor(Math.random() * colors.length)];

  const jitter = () => (Math.random() - 0.5) * 12;

  switch (word) {
    case 'cat': {
      // Head circle
      drawCircle(cx + jitter(), cy - 20 + jitter(), r * 0.55, 3, c1);
      // Left ear
      drawLine(cx - 35 + jitter(), cy - 55, cx - 20 + jitter(), cy - 80, 3, c1);
      drawLine(cx - 20 + jitter(), cy - 80, cx - 5 + jitter(), cy - 55, 3, c1);
      // Right ear
      drawLine(cx + 35 + jitter(), cy - 55, cx + 20 + jitter(), cy - 80, 3, c2);
      drawLine(cx + 20 + jitter(), cy - 80, cx + 5 + jitter(), cy - 55, 3, c2);
      // Eyes
      drawCircle(cx - 18, cy - 25, 5, 2, c2);
      drawCircle(cx + 18, cy - 25, 5, 2, c2);
      // Whiskers
      drawLine(cx - 15, cy - 10, cx - 50, cy - 15, 1.5, c1);
      drawLine(cx - 15, cy - 5, cx - 50, cy - 5, 1.5, c1);
      drawLine(cx + 15, cy - 10, cx + 50, cy - 15, 1.5, c2);
      drawLine(cx + 15, cy - 5, cx + 50, cy - 5, 1.5, c2);
      // Body
      drawArc(cx, cy + 50, 40, Math.PI, 0, 3, c1);
      break;
    }
    case 'dog': {
      // Head
      drawCircle(cx + jitter(), cy - 15 + jitter(), r * 0.5, 3, c1);
      // Floppy ears
      drawArc(cx - 40, cy - 20, 20, Math.PI * 0.5, Math.PI * 1.5, 3, c2);
      drawArc(cx + 40, cy - 20, 20, -Math.PI * 0.5, Math.PI * 0.5, 3, c2);
      // Eyes
      drawCircle(cx - 15, cy - 22, 4, 2, c2);
      drawCircle(cx + 15, cy - 22, 4, 2, c2);
      // Nose
      drawCircle(cx, cy - 8, 5, 2, c1);
      // Body
      drawArc(cx, cy + 45, 45, Math.PI, 0, 3, c1);
      // Legs
      drawLine(cx - 25, cy + 45, cx - 25, cy + 80, 3, c1);
      drawLine(cx + 25, cy + 45, cx + 25, cy + 80, 3, c2);
      // Tail
      drawArc(cx + 45, cy + 20, 20, -Math.PI * 0.7, 0, 3, c2);
      break;
    }
    case 'house': {
      // Base
      drawLine(cx - 50, cy + 40, cx + 50, cy + 40, 3, c1);
      drawLine(cx - 50, cy + 40, cx - 50, cy - 10, 3, c1);
      drawLine(cx + 50, cy + 40, cx + 50, cy - 10, 3, c2);
      // Roof
      drawLine(cx - 55, cy - 10, cx, cy - 60, 3, c2);
      drawLine(cx + 55, cy - 10, cx, cy - 60, 3, c1);
      // Door
      drawLine(cx - 12, cy + 40, cx - 12, cy + 10, 2, c2);
      drawLine(cx + 12, cy + 40, cx + 12, cy + 10, 2, c1);
      drawArc(cx, cy + 10, 12, Math.PI, 0, 2, c2);
      // Window
      drawLine(cx + 20, cy, cx + 40, cy, 2, c1);
      drawLine(cx + 30, cy - 10, cx + 30, cy + 10, 2, c2);
      break;
    }
    case 'tree': {
      // Trunk
      drawLine(cx - 10, cy + 50, cx - 10, cy - 10, 4, c1);
      drawLine(cx + 10, cy + 50, cx + 10, cy - 10, 4, c1);
      // Foliage circles
      drawCircle(cx + jitter(), cy - 30 + jitter(), 35, 3, c2);
      drawCircle(cx - 20 + jitter(), cy - 15 + jitter(), 25, 2, c1);
      drawCircle(cx + 20 + jitter(), cy - 15 + jitter(), 25, 2, c2);
      drawCircle(cx, cy - 45, 20, 2, c1);
      break;
    }
    case 'car': {
      // Body
      drawLine(cx - 55, cy + 10, cx + 55, cy + 10, 3, c1);
      drawLine(cx - 55, cy + 10, cx - 55, cy + 30, 3, c1);
      drawLine(cx + 55, cy + 10, cx + 55, cy + 30, 3, c2);
      drawLine(cx - 55, cy + 30, cx + 55, cy + 30, 3, c2);
      // Top
      drawArc(cx, cy + 10, 35, Math.PI, 0, 3, c2);
      // Wheels
      drawCircle(cx - 30, cy + 30, 12, 3, c1);
      drawCircle(cx + 30, cy + 30, 12, 3, c2);
      // Windows
      drawLine(cx - 15, cy + 12, cx - 15, cy - 8, 1.5, c1);
      drawLine(cx + 15, cy + 12, cx + 15, cy - 8, 1.5, c2);
      break;
    }
    case 'sun': {
      // Center
      drawCircle(cx, cy, 30, 3, c1);
      // Rays
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = cx + Math.cos(angle) * 38;
        const y1 = cy + Math.sin(angle) * 38;
        const x2 = cx + Math.cos(angle) * 55;
        const y2 = cy + Math.sin(angle) * 55;
        drawLine(x1 + jitter(), y1 + jitter(), x2 + jitter(), y2 + jitter(), 2, i % 2 === 0 ? c1 : c2);
      }
      break;
    }
    case 'fish': {
      // Body
      drawArc(cx, cy, 40, -0.8, 0.8, 3, c1);
      drawArc(cx, cy, 40, 0.8, Math.PI * 2 - 0.8, 3, c2);
      // Tail
      drawLine(cx - 40, cy, cx - 60, cy - 25, 3, c1);
      drawLine(cx - 40, cy, cx - 60, cy + 25, 3, c2);
      drawLine(cx - 60, cy - 25, cx - 60, cy + 25, 2, c1);
      // Eye
      drawCircle(cx + 20, cy - 5, 5, 2, c2);
      // Fin
      drawArc(cx, cy + 30, 15, -Math.PI * 0.5, Math.PI * 0.5, 2, c1);
      break;
    }
    case 'star': {
      const outerR = 50;
      const innerR = 20;
      for (let i = 0; i < 5; i++) {
        const a1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const a2 = ((i + 0.5) * 2 * Math.PI) / 5 - Math.PI / 2;
        const a3 = ((i + 1) * 2 * Math.PI) / 5 - Math.PI / 2;
        const ox = cx + Math.cos(a1) * outerR;
        const oy = cy + Math.sin(a1) * outerR;
        const ix = cx + Math.cos(a2) * innerR;
        const iy = cy + Math.sin(a2) * innerR;
        const nox = cx + Math.cos(a3) * outerR;
        const noy = cy + Math.sin(a3) * outerR;
        drawLine(ox + jitter(), oy + jitter(), ix + jitter(), iy + jitter(), 3, c1);
        drawLine(ix + jitter(), iy + jitter(), nox + jitter(), noy + jitter(), 3, c2);
      }
      break;
    }
    case 'heart': {
      // Left curve
      drawArc(cx - 25, cy - 10, 25, Math.PI, 0, 3, c1);
      // Right curve
      drawArc(cx + 25, cy - 10, 25, Math.PI, 0, 3, c2);
      // Left side down
      drawLine(cx - 50 + jitter(), cy - 10, cx, cy + 50, 3, c1);
      // Right side down
      drawLine(cx + 50 + jitter(), cy - 10, cx, cy + 50, 3, c2);
      break;
    }
    case 'pizza': {
      // Triangle
      drawLine(cx, cy - 55, cx - 50, cy + 40, 3, c1);
      drawLine(cx, cy - 55, cx + 50, cy + 40, 3, c2);
      drawArc(cx, cy + 40, 50, 0, Math.PI, 3, c1);
      // Pepperoni
      drawCircle(cx - 10, cy, 6, 2, c2);
      drawCircle(cx + 15, cy + 5, 6, 2, c1);
      drawCircle(cx, cy + 25, 6, 2, c2);
      drawCircle(cx + 25, cy - 15, 5, 2, c1);
      // Crust bumps
      drawArc(cx, cy + 40, 45, 0, Math.PI, 4, c2);
      break;
    }
    case 'rocket': {
      // Body
      drawLine(cx - 15, cy - 40, cx - 15, cy + 40, 3, c1);
      drawLine(cx + 15, cy - 40, cx + 15, cy + 40, 3, c2);
      // Nose cone
      drawArc(cx, cy - 40, 15, Math.PI, 0, 3, c1);
      // Fins
      drawLine(cx - 15, cy + 25, cx - 35, cy + 45, 3, c2);
      drawLine(cx + 15, cy + 25, cx + 35, cy + 45, 3, c1);
      // Window
      drawCircle(cx, cy - 10, 8, 2, c2);
      // Flame
      drawLine(cx - 8, cy + 40, cx, cy + 65, 2, c1);
      drawLine(cx + 8, cy + 40, cx, cy + 65, 2, c2);
      drawLine(cx, cy + 40, cx + jitter(), cy + 55, 2, c1);
      break;
    }
    case 'flower': {
      // Stem
      drawLine(cx, cy + 10, cx, cy + 60, 3, c1);
      // Petals
      const petalR = 18;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const px = cx + Math.cos(angle) * 25;
        const py = cy - 10 + Math.sin(angle) * 25;
        drawCircle(px + jitter(), py + jitter(), petalR, 2, i % 2 === 0 ? c1 : c2);
      }
      // Center
      drawCircle(cx, cy - 10, 10, 3, c2);
      // Leaf
      drawArc(cx + 15, cy + 40, 15, -Math.PI * 0.3, Math.PI * 0.7, 2, c1);
      break;
    }
    default: {
      // Abstract lines
      for (let i = 0; i < 8; i++) {
        drawLine(
          Math.random() * canvasSize,
          Math.random() * canvasSize,
          Math.random() * canvasSize,
          Math.random() * canvasSize,
          2 + Math.random() * 4,
          i % 2 === 0 ? c1 : c2
        );
      }
    }
  }

  // Add a few extra random decorative strokes for variety
  const extraStrokes = Math.floor(Math.random() * 4) + 2;
  for (let i = 0; i < extraStrokes; i++) {
    ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvasSize, Math.random() * canvasSize);
    ctx.lineTo(Math.random() * canvasSize, Math.random() * canvasSize);
    ctx.stroke();
    ctx.globalAlpha = 1;
    strokes++;
  }

  // Calculate coverage
  const coverage = calculateCoverage(ctx, canvasSize);

  return { strokes, coverage };
}

// ─── COVERAGE CALCULATION ────────────────────────────────
function calculateCoverage(ctx: CanvasRenderingContext2D, canvasSize: number): number {
  const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
  const data = imageData.data;
  let nonTransparent = 0;
  // Sample every 4th pixel for performance
  for (let i = 3; i < data.length; i += 16) {
    if (data[i] > 10) nonTransparent++;
  }
  const totalSampled = Math.ceil(data.length / 16);
  return nonTransparent / totalSampled;
}

// ─── JUDGE ALGORITHM ─────────────────────────────────────
function judgeRound(
  playerStrokes: number,
  playerCoverage: number,
  botStrokes: number,
  botCoverage: number,
  playerTime: number
): { winner: 'player' | 'bot' | 'draw'; playerScore: number; botScore: number } {
  const playerEfficiency = playerCoverage / Math.max(playerStrokes, 1);
  const botEfficiency = botCoverage / Math.max(botStrokes, 1);

  const playerRandom = Math.random();
  const botRandom = Math.random();

  const playerTotal = (playerCoverage * 0.4) + (playerEfficiency * 0.3) + (playerRandom * 0.3);
  const botTotal = (botCoverage * 0.4) + (botEfficiency * 0.3) + (botRandom * 0.3);

  // Time bonus: finishing faster gives a small boost
  const timeBonus = Math.max(0, (ROUND_TIME - playerTime) / ROUND_TIME) * 0.1;
  const adjustedPlayer = playerTotal + timeBonus;

  const diff = Math.abs(adjustedPlayer - botTotal);
  const threshold = 0.03;

  let winner: 'player' | 'bot' | 'draw';
  if (diff < threshold) {
    winner = 'draw';
  } else {
    winner = adjustedPlayer > botTotal ? 'player' : 'bot';
  }

  let playerScore = 0;
  let botScore = 0;

  if (winner === 'player') playerScore = 3;
  else if (winner === 'bot') botScore = 3;
  else { playerScore = 1; botScore = 1; }

  // Speed bonus for finishing under 5 seconds
  if (playerTime < SPEED_BONUS_THRESHOLD) {
    playerScore += 2;
  }

  return { winner, playerScore, botScore };
}

// ─── SHUFFLE UTILITY ─────────────────────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ─── MAIN COMPONENT ──────────────────────────────────────
export function QuickDraw({ onBack }: QuickDrawProps) {
  const { earnTokens } = useAuraStore();

  // Game state
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [mode, setMode] = useState<GameMode>('bot');
  const [round, setRound] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [roundsData, setRoundsData] = useState<RoundData[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushIndex, setBrushIndex] = useState(1); // default medium
  const [strokes, setStrokes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [drawStartTime, setDrawStartTime] = useState(0);
  const [hasStartedDrawing, setHasStartedDrawing] = useState(false);

  // Canvas refs
  const playerCanvasRef = useRef<HTMLCanvasElement>(null);
  const botCanvasRef = useRef<HTMLCanvasElement>(null);
  const botCanvasHiddenRef = useRef<HTMLCanvasElement>(null);

  // Stroke history for undo
  const strokeHistoryRef = useRef<ImageData[]>([]);
  const currentStrokeStartRef = useRef<ImageData | null>(null);

  // ── LOBBY ──
  const startGame = useCallback((selectedMode: GameMode) => {
    setMode(selectedMode);
    const shuffled = shuffleArray(PROMPT_WORDS).slice(0, TOTAL_ROUNDS);
    setWords(shuffled);
    setRound(0);
    setRoundsData([]);
    setPlayerScore(0);
    setBotScore(0);
    setPhase('drawing');
    setTimeLeft(ROUND_TIME);
    setStrokes(0);
    setHasStartedDrawing(false);
    setDrawStartTime(0);
  }, []);

  // ── CANVAS INIT ──
  useEffect(() => {
    if (phase !== 'drawing') return;

    const canvas = playerCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    strokeHistoryRef.current = [];
    currentStrokeStartRef.current = null;

    // Reset strokes
    setStrokes(0);
    setHasStartedDrawing(false);
    setDrawStartTime(0);
    setTimeLeft(ROUND_TIME);
  }, [phase, round]);

  // ── TIMER ──
  useEffect(() => {
    if (phase !== 'drawing' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, round, timeLeft <= 0]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (phase === 'drawing' && timeLeft === 0) {
      submitDrawing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  // ── DRAWING HANDLERS ──
  const getCanvasPos = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = playerCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (phase !== 'drawing' || timeLeft <= 0) return;
    e.preventDefault();

    const canvas = playerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPos(e);
    if (!pos) return;

    // Save state before this stroke for undo
    currentStrokeStartRef.current = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (!hasStartedDrawing) {
      setHasStartedDrawing(true);
      setDrawStartTime(Date.now());
    }

    setIsDrawing(true);

    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = BRUSH_SIZES[brushIndex].size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    // Draw a dot for single clicks
    ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
    ctx.stroke();
  }, [phase, timeLeft, brushIndex, hasStartedDrawing, getCanvasPos]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || phase !== 'drawing') return;
    e.preventDefault();

    const canvas = playerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPos(e);
    if (!pos) return;

    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = BRUSH_SIZES[brushIndex].size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, phase, brushIndex, getCanvasPos]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);

    // Count stroke
    setStrokes((prev) => prev + 1);

    // Save to history for undo
    const canvas = playerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (currentStrokeStartRef.current) {
      strokeHistoryRef.current.push(currentStrokeStartRef.current);
      if (strokeHistoryRef.current.length > 30) {
        strokeHistoryRef.current.shift();
      }
      currentStrokeStartRef.current = null;
    }
  }, [isDrawing]);

  // ── CANVAS ACTIONS ──
  const clearCanvas = useCallback(() => {
    const canvas = playerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    setStrokes(0);
    strokeHistoryRef.current = [];
    currentStrokeStartRef.current = null;
  }, []);

  const undoStroke = useCallback(() => {
    const canvas = playerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (strokeHistoryRef.current.length > 0) {
      const prevState = strokeHistoryRef.current.pop()!;
      ctx.putImageData(prevState, 0, 0);
      setStrokes((prev) => Math.max(0, prev - 1));
    }
  }, []);

  // ── SUBMIT DRAWING ──
  const submitDrawing = useCallback(() => {
    const playerCanvas = playerCanvasRef.current;
    if (!playerCanvas) return;

    const playerCtx = playerCanvas.getContext('2d');
    if (!playerCtx) return;

    const word = words[round];

    // Calculate player drawing stats
    const playerCoverage = calculateCoverage(playerCtx, CANVAS_SIZE);
    const playerTimeSec = hasStartedDrawing
      ? (Date.now() - drawStartTime) / 1000
      : ROUND_TIME;
    const playerStrokes = strokes;

    // Generate bot drawing
    const botCanvas = botCanvasHiddenRef.current;
    let botStrokes = 0;
    let botCoverage = 0;

    if (botCanvas) {
      const botCtx = botCanvas.getContext('2d');
      if (botCtx) {
        botCtx.fillStyle = '#111111';
        botCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        const result = generateBotDrawing(botCtx, word, CANVAS_SIZE);
        botStrokes = result.strokes;
        botCoverage = result.coverage;
      }
    }

    // Judge
    const { winner, playerScore: pScore, botScore: bScore } = judgeRound(
      playerStrokes,
      playerCoverage,
      botStrokes,
      botCoverage,
      playerTimeSec
    );

    // Save canvases as data URLs
    const playerDataURL = playerCanvas.toDataURL();
    let botDataURL = '';
    if (botCanvas) {
      botDataURL = botCanvas.toDataURL();
    }

    const roundData: RoundData = {
      word,
      playerStrokes,
      botStrokes,
      playerCoverage,
      botCoverage,
      playerTime: playerTimeSec,
      winner,
      playerCanvas: playerDataURL,
      botCanvas: botDataURL,
      playerPoints: pScore,
      botPoints: bScore,
    };

    setRoundsData((prev) => [...prev, roundData]);
    setPlayerScore((prev) => prev + pScore);
    setBotScore((prev) => prev + bScore);
    setPhase('voting');
  }, [words, round, strokes, hasStartedDrawing, drawStartTime]);

  // ── NEXT ROUND ──
  const nextRound = useCallback(() => {
    if (round + 1 >= TOTAL_ROUNDS) {
      setPhase('results');
    } else {
      setRound((prev) => prev + 1);
      setPhase('drawing');
      setTimeLeft(ROUND_TIME);
      setStrokes(0);
      setHasStartedDrawing(false);
      setDrawStartTime(0);
    }
  }, [round]);

  // ── PLAY AGAIN ──
  const playAgain = useCallback(() => {
    setPhase('lobby');
    setRound(0);
    setRoundsData([]);
    setPlayerScore(0);
    setBotScore(0);
  }, []);

  // ── AWARD TOKENS ON RESULTS ──
  useEffect(() => {
    if (phase === 'results') {
      const isWinner = playerScore > botScore;
      if (isWinner) {
        earnTokens(5, 'Quick Draw victory');
      } else if (playerScore === botScore) {
        earnTokens(2, 'Quick Draw draw');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════

  // ── LOBBY ──
  if (phase === 'lobby') {
    return (
      <div className="fade-in space-y-4 pb-4">
        <GameHeader
          icon="✏️"
          title="Quick Draw"
          subtitle="Speed Drawing Challenge"
          onClose={onBack}
        />

        <div className="glass-panel rounded-2xl p-6 text-center space-y-4">
          <div className="text-5xl mb-2">🎨</div>
          <h2 className="text-xl font-black text-white">Quick Draw</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Race to draw prompts in 15 seconds! Fewer strokes = more points.
            Win rounds to earn ORRA tokens!
          </p>

          <div className="space-y-3 pt-2">
            <div className="glass-panel rounded-xl p-3 text-left space-y-1">
              <p className="text-xs text-cyan-400 font-bold">🎯 HOW TO PLAY</p>
              <p className="text-[11px] text-slate-400">• Draw the prompt word on the canvas</p>
              <p className="text-[11px] text-slate-400">• Fewer strokes = higher efficiency score</p>
              <p className="text-[11px] text-slate-400">• Finish under 5s for +2 bonus points</p>
              <p className="text-[11px] text-slate-400">• Win = 3pts, Draw = 1pt, Lose = 0pts</p>
              <p className="text-[11px] text-slate-400">• Most points after 6 rounds wins +5 ORRA</p>
            </div>

            <button
              onClick={() => startGame('bot')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              🤖 vs Bot
            </button>
            <button
              onClick={() => startGame('friend')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              👥 vs Friend
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DRAWING PHASE ──
  if (phase === 'drawing') {
    const currentWord = words[round];
    const isLow = timeLeft <= 5;

    return (
      <div className="fade-in space-y-3 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <button onClick={onBack} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">✏️</span>
            <div>
              <span className="font-bold text-white text-xs">Round {round + 1}/{TOTAL_ROUNDS}</span>
            </div>
          </div>
          <ScoreDisplay p1Score={playerScore} p2Score={botScore} />
        </div>

        {/* Prompt */}
        <div className="glass-panel rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Draw this</p>
          <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 uppercase tracking-wide">
            {currentWord}
          </p>
        </div>

        {/* Timer */}
        <ProgressBar value={timeLeft} max={ROUND_TIME} isLow={isLow} />

        {/* Canvas */}
        <div className="flex justify-center">
          <div className="relative rounded-xl overflow-hidden border-2 border-white/10 shadow-lg shadow-cyan-500/10">
            <canvas
              ref={playerCanvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="touch-none cursor-crosshair bg-[#111111]"
              style={{ width: '100%', maxWidth: CANVAS_SIZE, height: 'auto', aspectRatio: '1' }}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            />
            {/* Stroke counter overlay */}
            <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
              <span className="text-[10px] text-slate-400">Strokes: </span>
              <span className="text-[10px] text-cyan-400 font-bold">{strokes}</span>
            </div>
          </div>
        </div>

        {/* Brush Controls */}
        <div className="flex items-center justify-center gap-2">
          {BRUSH_SIZES.map((b, i) => (
            <button
              key={b.label}
              onClick={() => setBrushIndex(i)}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
                brushIndex === i
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                  : 'bg-white/5 border border-white/10 text-slate-500 hover:bg-white/10'
              }`}
            >
              <span className={`text-${i === 0 ? 'xs' : i === 1 ? 'sm' : 'base'}`}>{b.icon}</span>
              <span className="text-[9px] mt-0.5">{b.label}</span>
            </button>
          ))}

          <div className="w-px h-8 bg-white/10 mx-1" />

          <button
            onClick={undoStroke}
            disabled={strokes === 0}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:bg-white/10 transition-all disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
            </svg>
            <span className="text-[9px] mt-0.5">Undo</span>
          </button>

          <button
            onClick={clearCanvas}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:bg-white/10 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="text-[9px] mt-0.5">Clear</span>
          </button>
        </div>

        {/* Submit */}
        <ActionButton
          onClick={submitDrawing}
          disabled={!hasStartedDrawing}
          color="from-cyan-600 to-teal-600"
        >
          {hasStartedDrawing ? 'Submit Drawing ✏️' : 'Draw something to submit'}
        </ActionButton>

        {/* Hidden bot canvas */}
        <canvas
          ref={botCanvasHiddenRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="hidden"
        />
      </div>
    );
  }

  // ── VOTING PHASE ──
  if (phase === 'voting') {
    const lastRound = roundsData[roundsData.length - 1];
    if (!lastRound) return null;

    const isPlayerWin = lastRound.winner === 'player';
    const isDraw = lastRound.winner === 'draw';
    const speedBonus = lastRound.playerTime < SPEED_BONUS_THRESHOLD;

    return (
      <div className="fade-in space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <div />
          <span className="text-xs font-bold text-white">Round {round + 1} Results</span>
          <ScoreDisplay p1Score={playerScore} p2Score={botScore} />
        </div>

        {/* Winner banner */}
        <div className={`glass-panel rounded-2xl p-4 text-center ${
          isPlayerWin ? 'border-green-500/30' : isDraw ? 'border-yellow-500/30' : 'border-red-500/30'
        }`}>
          <div className="text-3xl mb-1">
            {isPlayerWin ? '🏆' : isDraw ? '🤝' : '😔'}
          </div>
          <p className={`text-lg font-black ${
            isPlayerWin ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {isPlayerWin ? 'You Win This Round!' : isDraw ? 'It\'s a Draw!' : 'Bot Wins This Round!'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Prompt: <span className="text-white font-bold uppercase">{lastRound.word}</span>
          </p>
          {speedBonus && (
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-xs">⚡</span>
              <span className="text-xs font-bold text-cyan-400">Speed Bonus +2!</span>
            </div>
          )}
        </div>

        {/* Side-by-side drawings */}
        <div className="grid grid-cols-2 gap-3">
          {/* Player drawing */}
          <div className={`glass-panel rounded-xl p-2 ${
            isPlayerWin ? 'ring-2 ring-green-500/50' : ''
          }`}>
            <div className="flex items-center gap-1 mb-2">
              <PlayerAvatar src="/images/avatars/nova-avatar.jpg" name="You" size="sm" ring="ring-cyan-400" />
              <span className="text-[11px] text-white font-bold">You</span>
              {isPlayerWin && <span className="ml-auto text-xs">🏆</span>}
            </div>
            <div className="rounded-lg overflow-hidden bg-[#111111]">
              <img src={lastRound.playerCanvas} alt="Your drawing" className="w-full h-auto" />
            </div>
            <div className="mt-1.5 flex justify-between text-[9px] text-slate-500">
              <span>{lastRound.playerStrokes} strokes</span>
              <span>{(lastRound.playerCoverage * 100).toFixed(1)}% coverage</span>
            </div>
            <div className="mt-1 text-center">
              <span className={`text-sm font-bold ${isPlayerWin ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-red-400'}`}>
                +{lastRound.playerPoints}pts
              </span>
            </div>
          </div>

          {/* Bot drawing */}
          <div className={`glass-panel rounded-xl p-2 ${
            !isPlayerWin && !isDraw ? 'ring-2 ring-green-500/50' : ''
          }`}>
            <div className="flex items-center gap-1 mb-2">
              <PlayerAvatar src="/images/avatars/cyber-avatar.jpg" name="Bot" size="sm" ring="ring-fuchsia-400" />
              <span className="text-[11px] text-white font-bold">Bot</span>
              {!isPlayerWin && !isDraw && <span className="ml-auto text-xs">🏆</span>}
            </div>
            <div className="rounded-lg overflow-hidden bg-[#111111]">
              <img src={lastRound.botCanvas} alt="Bot drawing" className="w-full h-auto" />
            </div>
            <div className="mt-1.5 flex justify-between text-[9px] text-slate-500">
              <span>{lastRound.botStrokes} strokes</span>
              <span>{(lastRound.botCoverage * 100).toFixed(1)}% coverage</span>
            </div>
            <div className="mt-1 text-center">
              <span className={`text-sm font-bold ${!isPlayerWin && !isDraw ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-red-400'}`}>
                +{lastRound.botPoints}pts
              </span>
            </div>
          </div>
        </div>

        {/* Judge commentary */}
        <div className="glass-panel rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🤖</span>
            <span className="text-[11px] font-bold text-fuchsia-400">Judge Bot says:</span>
          </div>
          <p className="text-xs text-slate-400 italic">
            {isPlayerWin
              ? `"Nice work! Your drawing captured the essence of '${lastRound.word}' with confidence! ${speedBonus ? 'And that speed was impressive!' : ''}"`
              : isDraw
              ? `"Very close! Both of you had your own take on '${lastRound.word}'. A true artist standoff!"`
              : `"The bot's interpretation of '${lastRound.word}' had just a bit more... je ne sais quoi. Better luck next round!"`
            }
          </p>
        </div>

        {/* Next round button */}
        <ActionButton onClick={nextRound} color="from-violet-600 to-fuchsia-600">
          {round + 1 >= TOTAL_ROUNDS ? 'See Final Results 🏆' : `Next Round → (${round + 2}/${TOTAL_ROUNDS})`}
        </ActionButton>
      </div>
    );
  }

  // ── RESULTS PHASE ──
  if (phase === 'results') {
    const isWinner = playerScore > botScore;
    const isDrawResult = playerScore === botScore;

    return (
      <div className="fade-in space-y-4 pb-4">
        {/* Winner banner */}
        <div className={`glass-panel rounded-2xl p-6 text-center ${
          isWinner ? 'border-yellow-500/30' : isDrawResult ? 'border-yellow-500/30' : 'border-slate-500/30'
        }`}>
          <div className="text-5xl mb-2">
            {isWinner ? '🏆' : isDrawResult ? '🤝' : '💀'}
          </div>
          <h2 className={`text-2xl font-black ${
            isWinner ? 'text-yellow-400' : isDrawResult ? 'text-yellow-400' : 'text-slate-400'
          }`}>
            {isWinner ? 'You Win!' : isDrawResult ? 'It\'s a Tie!' : 'Bot Wins!'}
          </h2>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="text-center">
              <p className="text-3xl font-black text-cyan-400">{playerScore}</p>
              <p className="text-[10px] text-slate-500">Your Score</p>
            </div>
            <div className="text-slate-600 text-sm">vs</div>
            <div className="text-center">
              <p className="text-3xl font-black text-fuchsia-400">{botScore}</p>
              <p className="text-[10px] text-slate-500">Bot Score</p>
            </div>
          </div>
          {isWinner && (
            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <span>⚡</span>
              <span className="text-sm font-bold text-yellow-400">+5 ORRA Tokens!</span>
            </div>
          )}
          {isDrawResult && (
            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <span>⚡</span>
              <span className="text-sm font-bold text-yellow-400">+2 ORRA Tokens!</span>
            </div>
          )}
        </div>

        {/* All drawings grid */}
        <div className="glass-panel rounded-xl p-3">
          <p className="text-xs text-slate-500 font-bold mb-2">YOUR DRAWINGS</p>
          <div className="grid grid-cols-3 gap-2">
            {roundsData.map((rd, i) => (
              <div key={i} className="rounded-lg overflow-hidden bg-[#111111] relative group">
                <img src={rd.playerCanvas} alt={`Round ${i + 1}: ${rd.word}`} className="w-full h-auto" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-1.5">
                    <p className="text-[9px] text-white font-bold uppercase">{rd.word}</p>
                    <p className="text-[8px] text-slate-400">{rd.playerStrokes} strokes</p>
                  </div>
                </div>
                <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                  rd.winner === 'player' ? 'bg-green-500/20 text-green-400' :
                  rd.winner === 'draw' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {rd.winner === 'player' ? 'W' : rd.winner === 'draw' ? 'D' : 'L'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Round breakdown */}
        <div className="glass-panel rounded-xl p-3">
          <p className="text-xs text-slate-500 font-bold mb-2">ROUND BREAKDOWN</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
            {roundsData.map((rd, i) => (
              <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-6">R{i + 1}</span>
                  <span className="text-[11px] text-white font-medium uppercase">{rd.word}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500">{rd.playerStrokes} strokes</span>
                  <span className={`text-[11px] font-bold ${
                    rd.winner === 'player' ? 'text-green-400' :
                    rd.winner === 'draw' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {rd.winner === 'player' ? 'WIN' : rd.winner === 'draw' ? 'DRAW' : 'LOSS'}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-bold">+{rd.playerPoints}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <ActionButton onClick={playAgain} color="from-violet-600 to-fuchsia-600">
            Play Again ✏️
          </ActionButton>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl bg-white/5 text-slate-300 font-medium text-sm hover:bg-white/10 transition-all"
          >
            Back to Arena
          </button>
        </div>
      </div>
    );
  }

  return null;
}
