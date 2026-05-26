import { NextRequest, NextResponse } from 'next/server';
import { db, writeQueue } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/purchases - List all purchases for current user
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const purchases = await db.purchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { activeTheme: true, activeNameEffect: true, customTitle: true, auraTokens: true, badges: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        purchases: purchases.map(p => ({
          id: p.id,
          itemId: p.itemId,
          category: p.category,
          name: p.name,
          cost: p.cost,
          isActive: p.isActive,
          createdAt: p.createdAt,
        })),
        activeTheme: user?.activeTheme || '',
        activeNameEffect: user?.activeNameEffect || '',
        customTitle: user?.customTitle || '',
        auraTokens: user?.auraTokens || 0,
      },
    });
  } catch (error) {
    console.error('GET /api/purchases error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/purchases - Purchase an item
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, category, name, cost } = body;

    if (!itemId || !category || !name || !cost) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Check if already purchased
    const existing = await db.purchase.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });

    if (existing) {
      // Already owned - just activate it
      await writeQueue.run(async () => {
        if (category === 'Themes' || category === 'Effects') {
          await db.purchase.updateMany({
            where: { userId, category, isActive: true },
            data: { isActive: false },
          });
        }
        await db.purchase.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
        if (category === 'Themes') {
          await db.user.update({ where: { id: userId }, data: { activeTheme: itemId } });
        } else if (category === 'Effects') {
          await db.user.update({ where: { id: userId }, data: { activeNameEffect: itemId } });
        }
      });
      return NextResponse.json({ success: true, data: { action: 'activated', itemId } });
    }

    // Check if user has enough tokens
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { auraTokens: true, badges: true },
    });

    if (!user || user.auraTokens < cost) {
      return NextResponse.json({ success: false, error: 'Not enough ORRA tokens' }, { status: 400 });
    }

    // Determine the effective category for profile items from the marketplace
    // Marketplace sends category 'Profile' but items can be badges, effects, etc.
    const badgeItemIds = ['holographic-badge', 'badge_early', 'badge_supporter', 'badge_legend', 'badge_fire'];
    const effectItemIds = ['neon-name-glow', 'name_glow', 'name_rainbow', 'name_fire'];
    const themeItemIds = ['theme_aurora', 'theme_neon', 'theme_gold', 'theme_midnight', 'animated-cover'];

    let effectiveCategory = category;
    if (category === 'Profile') {
      if (badgeItemIds.includes(itemId)) effectiveCategory = 'Badges';
      else if (effectItemIds.includes(itemId)) effectiveCategory = 'Effects';
      else if (themeItemIds.includes(itemId)) effectiveCategory = 'Themes';
    }

    // For badges: add to user's badges array
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

    const result = await writeQueue.run(async () => {
      // Deactivate other items of same category when activating a theme or effect
      if (effectiveCategory === 'Themes' || effectiveCategory === 'Effects') {
        // Deactivate all items in the same effective category
        const catsToDeactivate = effectiveCategory === 'Themes' ? ['Themes', 'Profile'] : ['Effects', 'Profile'];
        await db.purchase.updateMany({
          where: { userId, category: { in: catsToDeactivate }, isActive: true },
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
          isActive: effectiveCategory === 'Themes' || effectiveCategory === 'Effects' || effectiveCategory === 'Badges',
        },
      });

      const updateData: Record<string, any> = { auraTokens: user.auraTokens - cost };

      if (effectiveCategory === 'Badges') {
        updateData.badges = updatedBadges;
      }
      if (effectiveCategory === 'Themes') {
        updateData.activeTheme = itemId;
        // animated-cover maps to a theme-like behavior
        if (itemId === 'animated-cover') {
          updateData.activeTheme = 'theme_animated_cover';
        }
      }
      if (effectiveCategory === 'Effects') {
        updateData.activeNameEffect = itemId;
        // neon-name-glow from marketplace maps to the name_glow effect
        if (itemId === 'neon-name-glow') {
          updateData.activeNameEffect = 'name_glow';
        }
      }
      // Custom title from marketplace
      if (itemId === 'custom-title') {
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
        tokensRemaining: (user.auraTokens - cost),
      },
    });
  } catch (error) {
    console.error('POST /api/purchases error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/purchases - Toggle active state for a purchased item
export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, isActive } = body;

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
      if (isActive && (purchase.category === 'Themes' || purchase.category === 'Effects')) {
        await db.purchase.updateMany({
          where: { userId, category: purchase.category, isActive: true },
          data: { isActive: false },
        });
      }

      await db.purchase.update({
        where: { id: purchase.id },
        data: { isActive },
      });

      if (purchase.category === 'Themes') {
        await db.user.update({ where: { id: userId }, data: { activeTheme: isActive ? itemId : '' } });
      }
      if (purchase.category === 'Effects') {
        await db.user.update({ where: { id: userId }, data: { activeNameEffect: isActive ? itemId : '' } });
      }
    });

    return NextResponse.json({ success: true, data: { itemId, isActive } });
  } catch (error) {
    console.error('PUT /api/purchases error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
