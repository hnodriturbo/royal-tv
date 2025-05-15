/**
 * POST /api/user/liveChat/main
 * -----------------------------
 * Body JSON:
 *   • subject: string
 *   • message: string
 *
 * Headers:
 *   • x-user-id: current user’s ID
 *
 * Creates a new conversation and seeds the first message.
 */
/* export async function POST(request) {
  const user_id = request.headers.get('x-user-id');
  const { subject, message } = await request.json();

  // 1️⃣ Validate
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: 'Subject and message are required' },
      { status: 400 },
    );
  }

  // 2️⃣ Create convo + first message
  const convo = await prisma.liveChatConversation.create({
    data: {
      user_id,
      subject: subject.trim(),
    },
  });
  await prisma.liveChatMessage.create({
    data: {
      conversation_id: convo.conversation_id,
      user_id,
      guest_id: null,
      message: message.trim(),
      sender_is_admin: false,
      status: 'sent',
    },
  });

  // 3️⃣ Return new ID
  return NextResponse.json(
    { conversation_id: convo.conversation_id },
    { status: 201 },
  );
}
 */

/**
 * PATCH /api/user/liveChat/main
 * -----------------------------
 * Body JSON:
 *   • message_id: string
 *   • new_message: string
 *
 * Headers:
 *   • x-user-id: current user’s ID
 *
 * Updates the content of an existing message.
 */
/* export async function PATCH(request) {
  const user_id = request.headers.get('x-user-id');
  const { message_id, new_message } = await request.json();

  // 1️⃣ Validate
  if (!message_id || !new_message?.trim()) {
    return NextResponse.json(
      { error: 'Message ID and new message content are required' },
      { status: 400 },
    );
  }
  // 2️⃣ Check if the message exists and belongs to the user
  const existingMessage = await prisma.liveChatMessage.findUnique({
    where: { message_id },
  });
  if (!existingMessage || existingMessage.user_id !== user_id) {
    return NextResponse.json(
      { error: 'Message not found or access denied' },
      { status: 404 },
    );
  }

  // 3️⃣ Update the Message
  const updatedMessage = await prisma.liveChatMessage.update({
    where: { message_id },
    data: { message: new_message.trim() },
  });

  // 4️⃣ If updated return success
  // 4️⃣ Return the updated message
  return NextResponse.json({ message: updatedMessage }, { status: 200 });
}
 */
/* 
export async function GET(request) {
  // 1️⃣ Extract pagination & user ID
  const user_id = request.headers.get('x-user-id');
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '5', 10);
  const skip = (page - 1) * limit;

  // 2️⃣ Total count for all conversations
  const totalCount = await prisma.liveChatConversation.count({
    where: { user_id },
  });

  // 3️⃣ Fetch one page of conversations
  const convos = await prisma.liveChatConversation.findMany({
    where: { user_id },
    orderBy: { updatedAt: 'desc' },
    skip,
    take: limit,
    select: {
      conversation_id: true,
      subject: true,
      read: true,
      updatedAt: true,
    },
  });

  // 4️⃣ Bulk‐compute unread messages per convo
  const unreadGroups = await prisma.liveChatMessage.groupBy({
    by: ['conversation_id'],
    where: {
      conversation: { user_id },
      sender_is_admin: true,
      status: { not: 'read' },
    },
    _count: { _all: true },
  });
  const unreadMap = Object.fromEntries(
    unreadGroups.map((g) => [g.conversation_id, g._count._all]),
  );

  // 5️⃣ Attach counts & compute total pages
  const conversations = convos.map((c) => ({
    ...c,
    unread_message_count: unreadMap[c.conversation_id] || 0,
  }));
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return NextResponse.json({ conversations, totalPages });
}
 */
