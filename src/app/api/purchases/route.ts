import { NextRequest, NextResponse } from 'next/server';
import { db, writeQueue } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// Founder email for exclusive items
const FOUNDER_EMAIL = 'nickjoseph8087@gmail.com';

// Founder-only item IDs
const FOUNDER_ONLY_ITEMS = [
  'skin_gold_founder',
  'effect_gold_glow',
  'badge_crown',
];

// Founder-only items that should auto-exist as purchases for the founder
const FOUNDER_FREE_ITEMS = [
  { itemId: 'skin_gold_founder', category: 'Themes', name: 'Gold Founder', cost: 0, selectedOption: 'gold' },
  { itemId: 'effect_gold_glow', category: 'Effects', name: 'Gold Glow', cost: 0, selectedOption: 'gold' },
  { itemId: 'badge_crown', category: 'Badges', name: 'Crown Badge', cost: 0, selectedOption: '' },
];

// Ensure founder has purchase records for exclusive items
async function ensureFounderPurchases(userId: string, userEmail: string | null) {
  if (userEmail !== FOUNDER_EMAIL) return;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { activeTheme: true, activeNameEffect: true },
  });

  for (const item of FOUNDER_FREE_ITEMS) {
    const existing = await db.purchase.findUnique({
      where: { userId_itemId: { userId, itemId: item.itemId } },
    });
    if (!existing) {
      // Only set isActive=true if this is the user's currently active theme/effect
      let isActive = false;
      if (item.category === 'Themes') {
        isActive = !user?.activeTheme || user.activeTheme === item.itemId;
      } else if (item.category === 'Effects') {
        isActive = !user?.activeNameEffect || user.activeNameEffect === item.itemId;
      } else if (item.category === 'Badges') {
        isActive = true; // Badges are always active once purchased
      }

      await db.purchase.create({
        data: {
          userId,
          itemId: item.itemId,
          category: item.category,
          name: item.name,
          cost: item.cost,
          isActive,
          selectedOption: item.selectedOption,
        },
      });
    }
  }

  // If founder's activeTheme/activeNameEffect is empty, default to gold
  const updateData: Record<string, string> = {};
  if (!user?.activeTheme) updateData.activeTheme = 'skin_gold_founder';
  if (!user?.activeNameEffect) updateData.activeNameEffect = 'effect_gold_glow';
  if (Object.keys(updateData).length > 0) {
    await db.user.update({ where: { id: userId }, data: updateData });
  }
}

// GET /api/purchases - List all purchases for current user
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const [purchases, user] = await Promise.all([
      db.purchase.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      db.user.findUnique({
        where: { id: userId },
        select: { activeTheme: true, activeNameEffect: true, customTitle: true, auraTokens: true, badges: true, email: true },
      }),
    ]);

    // Auto-seed founder purchases if missing
    const purchaseCountBefore = purchases.length;
    await ensureFounderPurchases(userId, user?.email || null);

    // Re-fetch purchases if we seeded new items
    const finalPurchases = (user?.email === FOUNDER_EMAIL)
      ? await db.purchase.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
      : purchases;

    return NextResponse.json({
      success: true,
      data: {
        purchases: finalPurchases.map(p => ({
          id: p.id,
          itemId: p.itemId,
          category: p.category,
          name: p.name,
          cost: p.cost,
          isActive: p.isActive,
          selectedOption: p.selectedOption,
          createdAt: p.createdAt,
        })),
        activeTheme: user?.activeTheme || '',
        activeNameEffect: user?.activeNameEffect || '',
        customTitle: user?.customTitle || '',
        auraTokens: user?.auraTokens || 0,
        isFounder: user?.email === FOUNDER_EMAIL,
      },
    });
  } catch (error) {
    console.error('GET /api/purchases error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/purchases - Purchase an item (toggle ON = buy)
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, category, name, cost, selectedOption } = body;

    if (!itemId || !category || !name || cost === undefined || cost === null) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Check founder-only restriction
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { auraTokens: true, badges: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (FOUNDER_ONLY_ITEMS.includes(itemId) && user.email !== FOUNDER_EMAIL) {
      return NextResponse.json({ success: false, error: 'This item is exclusive to the ORRA Founder' }, { status: 403 });
    }

    // Check if already purchased
    const existing = await db.purchase.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });

    if (existing) {
      // Already owned - just activate it (toggle ON)
      await writeQueue.run(async () => {
        // For themes and effects, deactivate others of same category first
        if (category === 'Themes' || category === 'Effects') {
          await db.purchase.updateMany({
            where: { userId, category, isActive: true },
            data: { isActive: false },
          });
        }
        await db.purchase.update({
          where: { id: existing.id },
          data: { isActive: true, selectedOption: selectedOption || existing.selectedOption },
        });
        // Update user's active item
        if (category === 'Themes') {
          await db.user.update({ where: { id: userId }, data: { activeTheme: itemId } });
        } else if (category === 'Effects') {
          await db.user.update({ where: { id: userId }, data: { activeNameEffect: itemId } });
        }
      });
      return NextResponse.json({ success: true, data: { action: 'activated', itemId } });
    }

    // Determine effective category for profile items
    const badgeItemIds = ['holographic-badge', 'badge_fire', 'badge_star', 'badge_crown'];
    const effectItemIds = ['neon-name-glow', 'effect_neon_glow', 'effect_rainbow_wave', 'effect_fire_glow', 'effect_gold_glow'];
    const themeItemIds = ['skin_aurora', 'skin_neon', 'skin_midnight', 'skin_cherry_blossom', 'skin_fire', 'skin_gold_founder', 'animated-cover'];

    let effectiveCategory = category;
    if (category === 'Profile') {
      if (badgeItemIds.includes(itemId)) effectiveCategory = 'Badges';
      else if (effectItemIds.includes(itemId)) effectiveCategory = 'Effects';
      else if (themeItemIds.includes(itemId)) effectiveCategory = 'Themes';
    }

    // For badges: compute updated badges
    let updatedBadges = user.badges;
    if (effectiveCategory === 'Badges') {
      const badgeName = name.replace(' Badge', '').replace(' badge', '').trim() || name;
      try {
        const badges = JSON.parse(user.badges);
        if (!badges.includes(badgeName)) {
          badges.push(badgeName);
        }
        updatedBadges = JSON.stringify(badges);
      } catch {
        updatedBadges = JSON.stringify([badgeName]);
      }
    }

    // Balance check INSIDE writeQueue to prevent TOCTOU race
    let tokensRemaining = 0;
    const result = await writeQueue.run(async () => {
      // Re-check balance inside the queue to prevent double-spending
      const freshUser = await db.user.findUnique({
        where: { id: userId },
        select: { auraTokens: true },
      });
      if (!freshUser || freshUser.auraTokens < cost) {
        throw new Error('INSUFFICIENT_TOKENS');
      }
      tokensRemaining = freshUser.auraTokens - cost;

      // Deactivate other items of same category when activating a theme or effect
      if (effectiveCategory === 'Themes' || effectiveCategory === 'Effects') {
        await db.purchase.updateMany({
          where: { userId, category: { in: [effectiveCategory, 'Profile'] }, isActive: true },
          data: { isActive: false },
        });
      }

      const purchase = await db.purchase.create({
        data: {
          userId,
          itemId,
          category,
          name,
          cost,
          isActive: true,
          selectedOption: selectedOption || '',
        },
      });

      const updateData: Record<string, any> = { auraTokens: tokensRemaining };

      if (effectiveCategory === 'Badges') {
        updateData.badges = updatedBadges;
      }
      if (effectiveCategory === 'Themes') {
        updateData.activeTheme = itemId;
      }
      if (effectiveCategory === 'Effects') {
        updateData.activeNameEffect = itemId;
      }
      if (effectiveCategory === 'Titles' || itemId === 'custom-title') {
        updateData.customTitle = name;
      }

      await db.user.update({
        where: { id: userId },
        data: updateData,
      });

      return purchase;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        itemId: result.itemId,
        category: result.category,
        name: result.name,
        cost: result.cost,
        isActive: result.isActive,
        selectedOption: result.selectedOption,
        tokensRemaining,
      },
    });
  } catch (error: any) {
    // Handle known transaction errors
    if (error?.message === 'INSUFFICIENT_TOKENS') {
      return NextResponse.json({ success: false, error: 'Not enough ORRA tokens.' }, { status: 400 });
    }
    console.error('POST /api/purchases error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/purchases - Toggle active state (toggle ON/OFF for owned items)
export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, isActive, selectedOption } = body;

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'Missing itemId' }, { status: 400 });
    }

    const purchase = await db.purchase.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });

    if (!purchase) {
      return NextResponse.json({ success: false, error: 'Purchase not found' }, { status: 404 });
    }

    await writeQueue.run(async () => {
      // If activating a theme or effect, deactivate others in same category
      if (isActive && (purchase.category === 'Themes' || purchase.category === 'Effects')) {
        await db.purchase.updateMany({
          where: { userId, category: purchase.category, isActive: true },
          data: { isActive: false },
        });
      }

      const updateData: Record<string, any> = { isActive };
      if (selectedOption) {
        updateData.selectedOption = selectedOption;
      }

      await db.purchase.update({
        where: { id: purchase.id },
        data: updateData,
      });

      if (purchase.category === 'Themes') {
        await db.user.update({ where: { id: userId }, data: { activeTheme: isActive ? itemId : '' } });
      }
      if (purchase.category === 'Effects') {
        await db.user.update({ where: { id: userId }, data: { activeNameEffect: isActive ? itemId : '' } });
      }
    });

    return NextResponse.json({ success: true, data: { itemId, isActive, selectedOption: selectedOption || purchase.selectedOption } });
  } catch (error) {
    console.error('PUT /api/purchases error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
