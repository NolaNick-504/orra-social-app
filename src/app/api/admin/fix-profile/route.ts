import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Admin endpoint to fix the founder profile and other data issues
// Usage: GET /api/admin/fix-profile?key=orra504

const ADMIN_KEY = 'orra504';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ success: false, error: 'Invalid key' }, { status: 403 });
  }

  const results: string[] = [];

  try {
    // 1. Find the founder account
    const founder = await db.user.findUnique({
      where: { email: 'nickjoseph8087@gmail.com' },
    });

    if (!founder) {
      return NextResponse.json({ success: false, error: 'Founder account not found' }, { status: 404 });
    }

    results.push(`Found founder: ${founder.name} (${founder.handle})`);

    // 2. Parse current badges and add Founder badge if missing
    let badges: string[] = [];
    try {
      badges = JSON.parse(founder.badges);
    } catch {
      badges = [];
    }

    const requiredBadges = ['Founder', 'Crown', 'Fire'];
    let badgesChanged = false;
    for (const badge of requiredBadges) {
      if (!badges.includes(badge)) {
        badges.push(badge);
        badgesChanged = true;
        results.push(`Added badge: ${badge}`);
      }
    }

    // 3. Fix profileSetupComplete
    const updates: Record<string, any> = {};
    if (!founder.profileSetupComplete) {
      updates.profileSetupComplete = true;
      results.push('Set profileSetupComplete = true');
    }

    if (badgesChanged) {
      updates.badges = JSON.stringify(badges);
    }

    // 4. Ensure founder has verified status
    if (!founder.verified) {
      updates.verified = true;
      results.push('Set verified = true');
    }

    // 5. Ensure founder handle is correct
    if (founder.handle !== '@nickorraceo') {
      updates.handle = '@nickorraceo';
      results.push('Fixed handle to @nickorraceo');
    }

    // 6. Ensure founder has gold skin and name effect (marketplace items)
    if (!founder.activeTheme) {
      updates.activeTheme = 'skin_gold_founder';
      results.push('Set activeTheme = skin_gold_founder');
    }
    if (!founder.activeNameEffect) {
      updates.activeNameEffect = 'effect_gold_glow';
      results.push('Set activeNameEffect = effect_gold_glow');
    }

    // 7. Apply updates if needed
    if (Object.keys(updates).length > 0) {
      await db.user.update({
        where: { id: founder.id },
        data: updates,
      });
      results.push(`Applied ${Object.keys(updates).length} updates to founder profile`);
    } else {
      results.push('No profile updates needed');
    }

    // 7. Verify the fix
    const updatedFounder = await db.user.findUnique({
      where: { id: founder.id },
      select: {
        id: true,
        name: true,
        handle: true,
        email: true,
        verified: true,
        profileSetupComplete: true,
        badges: true,
        activeTheme: true,
        activeNameEffect: true,
        auraTokens: true,
        auraLevel: true,
        _count: { select: { posts: true, followers: true, follows: true } },
      },
    });

    return NextResponse.json({
      success: true,
      results,
      founder: updatedFounder,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      results,
    }, { status: 500 });
  }
}
