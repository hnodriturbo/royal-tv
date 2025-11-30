-- ========================================
-- Public Chat Cleanup Script
-- ========================================
-- Run this to close old conversations or delete test data

-- Option 1: Close all active conversations (SAFE - preserves data)
UPDATE "PublicLiveChatConversation"
SET
    status = 'closed',
    "updatedAt" = NOW()
WHERE
    status = 'active';

-- Option 2: Delete ALL public chat data (DESTRUCTIVE - use for testing only)
-- DELETE FROM "PublicLiveChatMessage"; -- Deletes all messages
-- DELETE FROM "PublicLiveChatConversation"; -- Deletes all conversations

-- Option 3: Delete conversations older than 7 days
-- DELETE FROM "PublicLiveChatConversation"
-- WHERE "createdAt" < NOW() - INTERVAL '7 days';

-- Check current counts:
SELECT status, COUNT(*) as count
FROM "PublicLiveChatConversation"
GROUP BY
    status;