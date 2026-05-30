import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import { db, serializedTransaction, awardXPAndTokens } from "@/lib/db";

// Gift type definitions with costs
const GIFT_TYPES: Record<string, { cost: number; label: string }> = {
  coffee: { cost: 10, label: "Coffee" },
  pizza: { cost: 25, label: "Pizza" },
  diamond: { cost: 50, label: "Diamond" },
  rocket: { cost: 100, label: "Rocket" },
  crown: { cost: 250, label: "Crown" },
};

// POST /api/tips - Send a tip to another user
export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId, amount, message = "", giftType = "coins", postId } = body;

    // Validate receiver
    if (!receiverId) {
      return NextResponse.json({ success: false, error: "Receiver ID is required" }, { status: 400 });
    }

    // Can't tip yourself
    if (receiverId === userId) {
      return NextResponse.json({ success: false, error: "You can't tip yourself" }, { status: 400 });
    }

    // Determine amount from gift type or custom
    let tipAmount = amount;
    if (giftType && GIFT_TYPES[giftType]) {
      tipAmount = GIFT_TYPES[giftType].cost;
    }

    // Validate amount
    if (!tipAmount || tipAmount < 1) {
      return NextResponse.json({ success: false, error: "Invalid tip amount" }, { status: 400 });
    }

    if (tipAmount > 10000) {
      return NextResponse.json({ success: false, error: "Maximum tip is 10,000 ORRA" }, { status: 400 });
    }

    // Rate limit: max 10 tips per hour to same user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTips = await db.tip.count({
      where: {
        senderId: userId,
        receiverId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentTips >= 10) {
      return NextResponse.json({ success: false, error: "Rate limit: max 10 tips per hour to same user" }, { status: 429 });
    }

    // Use serialized transaction to prevent race conditions
    const result = await serializedTransaction(async (tx) => {
      // Check sender has enough tokens
      const sender = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, auraTokens: true, avatar: true },
      });

      if (!sender) throw new Error("SENDER_NOT_FOUND");
      if (sender.auraTokens < tipAmount) throw new Error("INSUFFICIENT_TOKENS");

      // Verify receiver exists
      const receiver = await tx.user.findUnique({
        where: { id: receiverId },
        select: { id: true, name: true, auraTokens: true, avatar: true },
      });

      if (!receiver) throw new Error("RECEIVER_NOT_FOUND");

      // Deduct from sender
      const updatedSender = await tx.user.update({
        where: { id: userId },
        data: { auraTokens: { decrement: tipAmount } },
        select: { auraTokens: true },
      });

      // Add to receiver
      const updatedReceiver = await tx.user.update({
        where: { id: receiverId },
        data: { auraTokens: { increment: tipAmount } },
        select: { auraTokens: true },
      });

      // Create tip record
      const tip = await tx.tip.create({
        data: {
          senderId: userId,
          receiverId,
          amount: tipAmount,
          message,
          giftType,
          postId: postId || null,
        },
      });

      // Record token actions for anti-farming tracking
      await tx.tokenAction.create({
        data: {
          userId,
          action: "tip_sent",
          targetId: tip.id,
          tokensEarned: -tipAmount,
          xpEarned: 0,
        },
      });

      await tx.tokenAction.create({
        data: {
          userId: receiverId,
          action: "tip_received",
          targetId: tip.id,
          tokensEarned: tipAmount,
          xpEarned: Math.min(tipAmount, 10), // Cap XP at 10 per tip
        },
      });

      // Award XP to receiver
      const receiverXP = Math.min(tipAmount, 10);

      // Create notification for receiver
      const giftLabel = GIFT_TYPES[giftType]?.label || `${tipAmount} ORRA`;
      await tx.notification.create({
        data: {
          userId: receiverId,
          action: `${sender.name} sent you a ${giftLabel} gift!`,
          type: "tip",
          thumbnail: sender.avatar,
          triggeredByUserId: userId,
          postId: postId || null,
        },
      });

      return {
        tipId: tip.id,
        senderBalance: updatedSender.auraTokens,
        receiverBalance: updatedReceiver.auraTokens,
        receiverXP,
      };
    });

    // Award XP to receiver outside transaction (non-critical)
    try {
      await awardXPAndTokens(receiverId, 0, result.receiverXP);
    } catch {}

    return NextResponse.json({
      success: true,
      data: {
        tipId: result.tipId,
        amount: tipAmount,
        giftType,
        message,
        senderBalance: result.senderBalance,
      },
    });
  } catch (error: any) {
    if (error?.message === "SENDER_NOT_FOUND") {
      return NextResponse.json({ success: false, error: "Sender not found" }, { status: 404 });
    }
    if (error?.message === "INSUFFICIENT_TOKENS") {
      return NextResponse.json({ success: false, error: "Insufficient ORRA tokens" }, { status: 400 });
    }
    if (error?.message === "RECEIVER_NOT_FOUND") {
      return NextResponse.json({ success: false, error: "Receiver not found" }, { status: 404 });
    }
    console.error("POST /api/tips error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/tips - Get tips for current user
export async function GET(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "received"; // "received" or "sent"
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const where = type === "sent"
      ? { senderId: userId }
      : { receiverId: userId };

    const tips = await db.tip.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        sender: {
          select: { id: true, name: true, handle: true, avatar: true, verified: true },
        },
        receiver: {
          select: { id: true, name: true, handle: true, avatar: true, verified: true },
        },
      },
    });

    // Get total tips received
    const totalReceived = await db.tip.aggregate({
      where: { receiverId: userId },
      _sum: { amount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        tips,
        totalReceived: totalReceived._sum.amount || 0,
        type,
      },
    });
  } catch (error) {
    console.error("GET /api/tips error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
