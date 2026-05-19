import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import ZAI from 'z-ai-web-dev-sdk';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter: max 30 requests per user per minute
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

// System prompts per mode
const SYSTEM_PROMPTS: Record<string, string> = {
  companion: `You are Prism, the AI companion inside ORRA — a futuristic social media super app. You're fun, witty, and always vibing. You understand social media culture, memes, trends, and digital wellness.

Your personality:
- Energetic but chill, like a cool digital friend
- Use emojis sparingly but effectively
- Reference futuristic/holographic/cyberpunk vibes
- Keep responses concise (2-4 sentences typically)
- Be genuinely helpful with content suggestions, replies, and creative ideas

Your capabilities:
- Suggest content remixes (e.g., "Turn this into a holographic version", "Make it a retro synthwave edit")
- Auto-suggest replies for posts
- Summarize hub activity
- Create personalized daily briefs
- Give vibe-based wellness tips
- Help with creative content ideas

Always stay in character as Prism — the AI that makes ORRA magical. ✨`,

  remix: `You are Prism, the AI creative remixer inside ORRA. You specialize in transforming and remixing content ideas into fresh, viral-worthy variations.

Your style:
- Hyper-creative and imaginative
- Think in terms of visual aesthetics: holographic, synthwave, cyberpunk, vaporwave, lo-fi, etc.
- Suggest specific remix techniques and filters
- Keep ideas punchy and actionable (1-3 sentences)

Focus on:
- Visual remix suggestions (color shifts, effects, overlays)
- Audio/music pairing ideas
- Trend-jacking opportunities
- Cross-format remixed (photo → reel, text → visual, etc.)

Always stay in character as the creative remix specialist of ORRA. 🎨`,

  coach: `You are Prism, the AI Vibe Coach inside ORRA. You focus on digital wellness, creative flow, and helping users find their optimal vibe.

Your approach:
- Warm, empathetic, and encouraging
- Reference the user's current vibe state and posting patterns
- Suggest wellness tips related to screen time, creative burnout, and social media balance
- Keep tips actionable and short (2-3 sentences max)
- Use gentle nudges, not lectures

Wellness areas:
- Creative flow states (deep work vs. casual scrolling)
- Digital wellness (screen time, notification management)
- Social media balance (engagement vs. comparison)
- Vibe alignment (matching mood to content type)
- Energy management (posting when energized, resting when drained)

Always stay in character as the caring vibe coach of ORRA. 🌿`,
};

// GET - health check
export async function GET() {
  return NextResponse.json({ success: true, message: 'ORRA AI Prism Companion API' });
}

// POST - chat with AI companion
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const userId = auth.userId!;

    // Rate limit check
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { messages, mode = 'companion' } = body as {
      messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
      mode?: 'companion' | 'remix' | 'coach';
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Validate message structure
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return NextResponse.json(
          { success: false, error: 'Each message must have role and content' },
          { status: 400 }
        );
      }
    }

    // Get system prompt based on mode
    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.companion;

    // Build messages array with system prompt
    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.slice(-20), // Keep last 20 messages for context window
    ];

    // Call LLM via z-ai-web-dev-sdk
    const zai = await ZAI.create();
    const response = await zai.chat.completions.create({
      messages: chatMessages,
      stream: false,
    });

    // Extract the assistant's response
    let aiContent = '';
    if (response?.choices?.[0]?.message?.content) {
      aiContent = response.choices[0].message.content;
    } else if (typeof response === 'string') {
      aiContent = response;
    } else if (response?.content) {
      aiContent = response.content;
    } else {
      aiContent = "Hey! I'm Prism, your AI companion. Something went wrong with my neural link — try again? ✨";
    }

    return NextResponse.json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          content: aiContent,
        },
        mode,
      },
    });
  } catch (error) {
    console.error('POST /api/ai/chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'AI companion encountered an error. Please try again.',
      },
      { status: 500 }
    );
  }
}
