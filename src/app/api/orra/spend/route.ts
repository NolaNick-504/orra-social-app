import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db, serializedTransaction } from "@/lib/db";

// POST /api/orra/spend - Spend tokens on shop items
// Uses serializedTransaction to prevent TOCTOU race conditions on balance checks
export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, itemId, amount, badgeName, activeTheme, activeNameEffect } = body;

    if (!action || !amount || amount < 1) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    // Validate action type against whitelist to prevent arbitrary spend actions
    const validActions = [
      'purchase_badge', 'purchase_theme', 'purchase_name_effect', 'boost_post',
      'tip_user', 'gift_tokens', 'unlock_content', 'super_reaction',
      'premium_dance_entry',
    ];
    if (!validActions.includes(action)) {
      return NextResponse.json({ success: false, error: `Invalid action. Must be one of: ${validActions.join(', ')}` }, { status: 400 });
    }

    // Validate amount is reasonable (max 10000 tokens per spend)
    if (amount > 10000) {
      return NextResponse.json({ success: false, error: "Amount too large. Maximum 10000 tokens per transaction" }, { status: 400 });
    }

    // Use serialized transaction to prevent TOCTOU race on balance check
    // Previously, balance was checked then tokens deducted in separate operations,
    // allowing double-spend under concurrent requests
    const result = await serializedTransaction(async (tx) => {
      // Check user has enough tokens INSIDE the transaction
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, auraTokens: true, badges: true, purchasedThemes: true, purchasedBadges: true, purchasedNameEffects: true, activeTheme: true, activeNameEffect: true },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      if (user.auraTokens < amount) {
        throw new Error('INSUFFICIENT_TOKENS');
      }

      // Use TokenAction for dedup (prevent double-spending on same item)
      const targetId = itemId || `${action}_${Date.now()}`;
      const existingAction = await tx.tokenAction.findFirst({
        where: { userId, action: `spend_${action}`, targetId },
      });

      if (existingAction) {
        throw new Error('ALREADY_PURCHASED');
      }

      // Deduct tokens and record the spend
      const updateData: any = {
        auraTokens: { decrement: amount },
      };

      // If purchasing a badge, add it to the user's badges array
      if (action === "purchase_badge" && badgeName) {
        let currentBadges: string[] = [];
        try {
          currentBadges = JSON.parse(user.badges);
        } catch { currentBadges = []; }
        if (!currentBadges.includes(badgeName)) {
          currentBadges.push(badgeName);
        }
        updateData.badges = JSON.stringify(currentBadges);
        // Also add to purchasedBadges
        let currentPurchasedBadges: string[] = [];
        try {
          currentPurchasedBadges = JSON.parse(user.purchasedBadges);
        } catch { currentPurchasedBadges = []; }
        if (!currentPurchasedBadges.includes(itemId)) {
          currentPurchasedBadges.push(itemId);
        }
        updateData.purchasedBadges = JSON.stringify(currentPurchasedBadges);
      }

      // If purchasing a theme, add to purchasedThemes and set activeTheme
      if (action === "purchase_theme" && itemId) {
        let currentPurchasedThemes: string[] = [];
        try {
          currentPurchasedThemes = JSON.parse(user.purchasedThemes);
        } catch { currentPurchasedThemes = []; }
        if (!currentPurchasedThemes.includes(itemId)) {
          currentPurchasedThemes.push(itemId);
        }
        updateData.purchasedThemes = JSON.stringify(currentPurchasedThemes);
        // Auto-activate the newly purchased theme
        if (activeTheme) {
          updateData.activeTheme = activeTheme;
        }
      }

      // If purchasing a name effect, add to purchasedNameEffects and set activeNameEffect
      if (action === "purchase_name_effect" && itemId) {
        let currentPurchasedEffects: string[] = [];
        try {
          currentPurchasedEffects = JSON.parse(user.purchasedNameEffects);
        } catch { currentPurchasedEffects = []; }
        if (!currentPurchasedEffects.includes(itemId)) {
          currentPurchasedEffects.push(itemId);
        }
        updateData.purchasedNameEffects = JSON.stringify(currentPurchasedEffects);
        // Auto-activate the newly purchased name effect
        if (activeNameEffect) {
          updateData.activeNameEffect = activeNameEffect;
        }
      }

      await tx.tokenAction.create({
        data: {
          userId,
          action: `spend_${action}`,
          targetId,
          tokensEarned: -amount, // Negative to indicate spend
          xpEarned: 0,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: updateData,
        select: { auraTokens: true },
      });

      return { targetId, remainingTokens: updatedUser.auraTokens };
    });

    return NextResponse.json({
      success: true,
      data: {
        action,
        itemId: result.targetId,
        amountSpent: amount,
        remainingTokens: result.remainingTokens,
      },
    });
  } catch (error: any) {
    // Handle known transaction errors
    if (error?.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    if (error?.message === 'INSUFFICIENT_TOKENS') {
      return NextResponse.json({ success: false, error: "Insufficient tokens" }, { status: 400 });
    }
    if (error?.message === 'ALREADY_PURCHASED') {
      return NextResponse.json({ success: false, error: "Already purchased" }, { status: 400 });
    }
    console.error("POST /api/orra/spend error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
