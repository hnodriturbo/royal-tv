/**
 * DELETE /api/admin/deleteConversation
 * ------------------------------------
 * Query params
 *   • chatType : 'liveChat' | 'bubbleChat'   ← required
 *   • ONE OF:
 *       – conversation_id : string       ← delete only that convo
 *       – user_id         : string       ← delete all user convos
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function DELETE(request) {
  try {
    // 1️⃣ Parse query params -------------------------------------------
    const url = new URL(request.url)
    const conversation_id = url.searchParams.get('conversation_id')
    const user_id = url.searchParams.get('user_id')
    const chatType = url.searchParams.get('chatType') // 'liveChat' | 'bubbleChat'

    // 2️⃣ Validate ------------------------------------------------------
    if (!chatType)
      return NextResponse.json(
        { error: 'chatType is required (liveChat | bubbleChat)' },
        { status: 400 }
      )

    if (!conversation_id && !user_id)
      return NextResponse.json(
        { error: 'Either conversation_id or user_id must be provided' },
        { status: 400 }
      )

    // 3️⃣ Pick correct Prisma model ------------------------------------
    const convoModel =
      chatType === 'live'
        ? prisma.liveChatConversation
        : prisma.bubbleChatConversation

    // 4️⃣ Execute deletion ---------------------------------------------
    if (conversation_id) {
      // 🗑️ Delete single conversation (cascade messages)
      await convoModel.delete({ where: { conversation_id } })
      return NextResponse.json({
        success: true,
        deleted: `deleted conversation: ${conversation_id}`
      })
    }

    // 🗑️🗑️ Delete ALL conversations for this user
    await convoModel.deleteMany({ where: { user_id } })
    return NextResponse.json({
      success: true,
      deleted: 'all_user_conversations'
    })
  } catch (err) {
    console.error('❌ deleteConversation route:', err)
    return NextResponse.json(
      { error: `Deletion failed: ${err.message}` },
      { status: 500 }
    )
  }
}
