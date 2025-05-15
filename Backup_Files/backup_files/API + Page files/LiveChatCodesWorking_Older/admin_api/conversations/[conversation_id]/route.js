import { NextResponse } from 'next/server';
import prisma from '@lib/prisma';

/*
 * GET /api/admin/conversations/[conversation_id]
 * - Retrieves conversation details including messages and the associated user.
 */
export async function GET(request, { params }) {
  const { conversation_id } = await params;

  try {
    const conversation = await prisma.supportConversation.findUnique({
      where: { conversation_id },
      include: {
        messages: true,
        user: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      conversation_id: conversation.conversation_id,
      subject: conversation.subject,
      messages: conversation.messages,
      user: conversation.user,
    });
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation details' },
      { status: 500 },
    );
  }
}

/*
 * POST /api/admin/conversations/[conversation_id]/route.js
 * - Adds a new reply message to the conversation.
 * - Expects a JSON body with:
 *      - message: string (the reply text)
 *      - sender_is_admin: boolean (optional; defaults to true for admin replies)
 */
export async function POST(request, { params }) {
  const { conversation_id } = await params;

  try {
    const body = await request.json();
    const { message, sender_is_admin } = body;

    // Validate that the message is provided.
    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 },
      );
    }

    // Create a new message record in the database.
    const newMessage = await prisma.supportMessage.create({
      data: {
        conversation_id,
        message,
        sender_is_admin: sender_is_admin ?? true, // Defaults to true (admin reply)
      },
    });

    return NextResponse.json({ newMessage });
  } catch (error) {
    console.error('Error adding new message:', error);
    return NextResponse.json(
      { error: 'Failed to add new message' },
      { status: 500 },
    );
  }
}

/*
 * PUT /api/admin/conversations/[conversation_id]/route.js
 * - Updates a specific message in the conversation.
 * - Expects a JSON body with:
 *      - message_id: string (ID of the message to update)
 *      - message: string (the updated message content)
 */
export async function PUT(request /* { params } */) {
  /* const { conversation_id } = await params; */

  try {
    const body = await request.json();
    const { message_id, message } = body;

    const updatedMessage = await prisma.supportMessage.update({
      where: { message_id },
      data: {
        ...(message && { message, status: 'edited' }), // ✅ mark edited automatically
      },
    });

    return NextResponse.json({ updatedMessage });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 },
    );
  }
}

/*
 * DELETE /api/admin/conversations/[conversation_id]
 * - Deletes a specific message if message_id is provided via query parameter.
 * - Otherwise, deletes the entire conversation (and cascades deletion to messages).
 */
export async function DELETE(request, { params }) {
  // Extract conversation_id from params
  const { conversation_id } = await params;
  // Build a URL from the request to get searchParams
  const { searchParams } = new URL(request.url);
  const message_id = searchParams.get('message_id');

  try {
    if (message_id) {
      await prisma.supportMessage.delete({
        where: { message_id },
      });
      return NextResponse.json({
        message: 'Message deleted successfully',
      });
    } else {
      await prisma.supportConversation.delete({
        where: { conversation_id },
      });
      return NextResponse.json({
        message: 'Conversation deleted successfully',
      });
    }
  } catch (error) {
    console.error('Error deleting conversation/message:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

/*
 * PATCH /api/admin/conversations/[conversation_id]/route.js
 * - Marks all unread user messages as read.
 */
export async function PATCH(request, { params }) {
  const { conversation_id } = await params;

  try {
    await prisma.supportMessage.updateMany({
      where: {
        conversation_id,
        sender_is_admin: false,
        status: { not: 'read' },
      },
      data: {
        status: 'read',
        readAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 },
    );
  }
}
