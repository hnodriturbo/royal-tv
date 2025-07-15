// =================== prisma/seeds/notificationSeeds.js ===================
// 🔔 Seeds notifications for real LiveChat conversations and random types
//    - Deletes all notification data first
//    - Uses exact (conversation_id, owner_id) mapping
//    - Skips BubbleChat notifications (only liveChatMessage, newUserRegistration, payment, etc.)
// ==========================================================================

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 👑 Your real admin user_id
const adminUserId = '1a949572-4958-4863-ad15-a80ccaa5a3a7';

// 1️⃣ List of [conversation_id, owner_id] pairs
const liveChats = [
  ['6b0b35e3-f143-4f4e-815e-f627162be5b6', '071b739c-6b15-4bcb-8280-e8397d8f9f23'],
  ['21a8ce83-5fb8-4e6f-a339-7774c7e71b79', '071b739c-6b15-4bcb-8280-e8397d8f9f23'],
  ['06480579-b88f-44a5-be91-3df50b3fc8d6', '33f93ec2-2df7-4b49-944f-40cc35fbe8ed'],
  ['f7c485eb-b24f-45b5-91ef-445b0f7ffbf7', '33f93ec2-2df7-4b49-944f-40cc35fbe8ed'],
  ['53ed76ae-5bfc-435d-a4b4-9fe7be1e4dd1', '33f93ec2-2df7-4b49-944f-40cc35fbe8ed'],
  ['3b41538b-f34f-4e3f-9e7d-389b86a34cc0', '33f93ec2-2df7-4b49-944f-40cc35fbe8ed'],
  ['1d2f5552-3be6-4ed5-b9cf-b519c9d6da3d', '33f93ec2-2df7-4b49-944f-40cc35fbe8ed'],
  ['bd26f87f-a14b-406e-ad3a-f56f0e261541', '33f93ec2-2df7-4b49-944f-40cc35fbe8ed'],
  ['b3601978-e35f-47cb-afe4-8cc1eb3f4903', '591410f0-0ea6-49d1-be30-cca4c3237006'],
  ['0c061e46-0ef5-49de-a56d-3c66a26453ee', '591410f0-0ea6-49d1-be30-cca4c3237006'],
  ['c8ab839b-9c34-4850-921b-c84b08928ad2', '591410f0-0ea6-49d1-be30-cca4c3237006'],
  ['f7500e77-79c8-4b63-9a31-51c9663104a2', '591410f0-0ea6-49d1-be30-cca4c3237006'],
  ['d5fd4749-af45-4fc6-a2a4-b75e3f8c6ed3', '591410f0-0ea6-49d1-be30-cca4c3237006'],
  ['19ac046d-d834-4706-b1e3-f1440d162588', '591410f0-0ea6-49d1-be30-cca4c3237006'],
  ['d259f3e9-4215-4652-82fb-be9b39820802', '6583c781-167d-4138-9277-157138565696'],
  ['75e6cee7-76e7-4e14-9015-1046f9e25aec', '6583c781-167d-4138-9277-157138565696'],
  ['b5c8606e-e57f-47a0-90ab-3e13a2efda8d', '6583c781-167d-4138-9277-157138565696'],
  ['0f5154bc-5067-46b7-89d2-c57897614371', '6583c781-167d-4138-9277-157138565696'],
  ['e796daa8-9cc4-4d3c-b799-d37b77fc203e', '6583c781-167d-4138-9277-157138565696'],
  ['5cc815de-e8a3-42d7-bbb3-1b0c98a993a9', '6583c781-167d-4138-9277-157138565696'],
  ['a2ca0748-fc9b-425c-a3d3-c05d5b43b8d3', '65dd2bba-d3b3-46d3-b9a0-0c931900744f'],
  ['b2bfe68b-7af0-4131-a0fb-03fa5d377367', '65dd2bba-d3b3-46d3-b9a0-0c931900744f'],
  ['30a51131-1d26-4f7a-877d-d13eac2b6b08', '65dd2bba-d3b3-46d3-b9a0-0c931900744f'],
  ['9394f6ac-7bed-40bd-9b9b-a13d8fb27670', '65dd2bba-d3b3-46d3-b9a0-0c931900744f'],
  ['e4519ec9-9099-4878-bebd-da453f1e6756', '65dd2bba-d3b3-46d3-b9a0-0c931900744f'],
  ['d723a1ef-c261-4b4f-906d-47cc04c78c95', '65dd2bba-d3b3-46d3-b9a0-0c931900744f'],
  ['2e9718ed-25ba-472b-8e63-edc16d83fe04', '6871f0b4-ed8e-4de7-bb21-f72295186a19'],
  ['947c112b-5616-41a6-97bd-bda8b2d42bc3', '6871f0b4-ed8e-4de7-bb21-f72295186a19'],
  ['886edbd2-5fb8-451d-b493-6f086b4bff97', '6871f0b4-ed8e-4de7-bb21-f72295186a19'],
  ['343b29d1-6649-4d27-ba3b-e38107a68290', '6871f0b4-ed8e-4de7-bb21-f72295186a19'],
  ['c0799b14-0e76-4533-8d60-68a7a9e556c2', '6871f0b4-ed8e-4de7-bb21-f72295186a19'],
  ['8fdc8dc8-8565-4118-851b-b7fb48e4dde4', '6871f0b4-ed8e-4de7-bb21-f72295186a19'],
  ['8558dd40-22b6-4df5-836b-ae23ea9b3dc7', '90f60213-36ec-45d7-9163-8d4d719269f3'],
  ['97915202-2863-499c-9acc-af5491ab3b0a', '90f60213-36ec-45d7-9163-8d4d719269f3'],
  ['3efb5029-a59e-4843-8e45-43ef641f55ff', '90f60213-36ec-45d7-9163-8d4d719269f3'],
  ['fb8f21dd-2748-4978-b3f6-2828850832f0', '90f60213-36ec-45d7-9163-8d4d719269f3'],
  ['69eefe24-7341-4a22-9de9-23520c19548b', '90f60213-36ec-45d7-9163-8d4d719269f3'],
  ['a3889343-d458-4531-9c10-f430b7903a0c', '90f60213-36ec-45d7-9163-8d4d719269f3'],
  ['8835f066-eeb9-40d5-abde-f98fdee61e81', 'a463655c-e113-4c4b-97b8-675e7ae23997'],
  ['e1e3c49f-ca5a-4ebb-9875-2bc3318a0d82', 'a463655c-e113-4c4b-97b8-675e7ae23997'],
  ['ee672a80-a6b0-487a-b481-49883c03aa51', 'a463655c-e113-4c4b-97b8-675e7ae23997'],
  ['ef0409f9-d7f2-4e0d-8ed8-d425e8825651', 'a463655c-e113-4c4b-97b8-675e7ae23997'],
  ['131e6a35-5d99-4110-bb11-23e7a6f4d078', 'a463655c-e113-4c4b-97b8-675e7ae23997'],
  ['c7d82e41-27aa-44ff-925b-6a879a7efff8', 'a463655c-e113-4c4b-97b8-675e7ae23997'],
  ['f27ae521-98cf-4c79-88f5-ceb2808b5477', 'd8cfb9f2-e16f-49ca-ae7e-7291861378d7'],
  ['594b5f38-2f94-4c7e-82cc-29bda92c040c', 'd8cfb9f2-e16f-49ca-ae7e-7291861378d7'],
  ['d29e36d6-8fc7-4e89-bfe7-1c584bb191a9', 'd8cfb9f2-e16f-49ca-ae7e-7291861378d7'],
  ['2652e018-1777-406a-b024-187f0296c4f2', 'd8cfb9f2-e16f-49ca-ae7e-7291861378d7'],
  ['7870fcf5-09cd-4a97-a04c-6c473e51f3b4', 'd8cfb9f2-e16f-49ca-ae7e-7291861378d7'],
  ['e2c96fc9-51cf-4430-9b64-6e27062aa8e9', 'd8cfb9f2-e16f-49ca-ae7e-7291861378d7'],
  ['5590accf-4604-4736-9df9-ccb749f6348e', 'f6931fd3-49ef-4e55-b547-bbec4982149e'],
  ['c90e3026-a287-4623-b1b3-fb3cfc393e18', 'f6931fd3-49ef-4e55-b547-bbec4982149e'],
  ['c5cdd209-11ea-4070-920b-b941216cffdf', 'f6931fd3-49ef-4e55-b547-bbec4982149e'],
  ['fafa7344-2d83-4d3e-a9b0-e55b2f6a6f4a', 'f6931fd3-49ef-4e55-b547-bbec4982149e'],
  ['747e0e64-c93f-4469-8ca2-6936f6dc8940', 'f6931fd3-49ef-4e55-b547-bbec4982149e'],
  ['26a34dde-a67c-4c2c-bff9-3829797fb2c5', 'f6931fd3-49ef-4e55-b547-bbec4982149e'],
  ['31ee7836-fbb4-4f53-8a34-40e836c7dfbd', '1a949572-4958-4863-ad15-a80ccaa5a3a7'],
  ['63de9863-6a58-4a90-8f0e-381f18074a0a', '071b739c-6b15-4bcb-8280-e8397d8f9f23'],
  ['1b8993ef-12db-43cb-abdb-2e7cd5b15fe5', '071b739c-6b15-4bcb-8280-e8397d8f9f23'],
  ['ff7f9388-f2e2-4570-b3af-81b09653ae74', '071b739c-6b15-4bcb-8280-e8397d8f9f23'],
  ['261deecd-32b0-43b5-947d-1d8b58476d26', '071b739c-6b15-4bcb-8280-e8397d8f9f23']
];

// 2️⃣ Other notification types (no BubbleChat!)
const notificationTypes = [
  'subscription',
  'payment',
  'freeTrialRequest',
  'liveChatMessage',
  'newUserRegistration'
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBody(type, userId) {
  switch (type) {
    case 'subscription':
      return `Your subscription status changed.`;
    case 'payment':
      return `A payment was processed for your account.`;
    case 'freeTrialRequest':
      return `Your free trial request has been received!`;
    case 'liveChatMessage':
      return `You have a new live chat message!`;
    case 'newUserRegistration':
      return `A new user registered with your referral.`;
    default:
      return `Notification for user.`;
  }
}

async function run() {
  console.log('🔥 Deleting all notifications...');
  await prisma.notification.deleteMany({});

  // ———————— LiveChatConversation notifications ————————————
  let count = 0;
  for (const [conversation_id, owner_id] of liveChats) {
    // 1️⃣ User notification for this conversation
    await prisma.notification.create({
      data: {
        user_id: owner_id,
        type: 'liveChatMessage',
        title: 'Live Chat Message',
        body: `You have new activity in your live chat.`,
        link: `/user/liveChat/${conversation_id}`
      }
    });

    // 2️⃣ Admin notification for this conversation
    await prisma.notification.create({
      data: {
        user_id: adminUserId,
        type: 'liveChatMessage',
        title: 'Live Chat Conversation Active',
        body: `Conversation ID ${conversation_id} (owner: ${owner_id}) has activity.`,
        link: `/admin/liveChat/${conversation_id}`
      }
    });
    count++;
  }
  console.log(`✅ Seeded ${count * 2} liveChatMessage notifications.`);

  // ———————— Add a few random notifications for all users ———————
  // (Find all unique user_ids)
  const userIds = Array.from(new Set(liveChats.map(([_, uid]) => uid)));

  let extra = 0;
  for (const user_id of userIds) {
    // For each user, make 3 random notifications of other types (no BubbleChat!)
    for (let i = 0; i < 3; i++) {
      const type = pickRandom(notificationTypes.filter((t) => t !== 'liveChatMessage'));
      await prisma.notification.create({
        data: {
          user_id,
          type,
          title: type[0].toUpperCase() + type.slice(1) + ' Notification',
          body: randomBody(type, user_id),
          link:
            type === 'subscription'
              ? '/user/subscriptions'
              : type === 'payment'
                ? '/user/payments'
                : type === 'freeTrialRequest'
                  ? '/user/freeTrialRequest'
                  : type === 'newUserRegistration'
                    ? '/user/profile'
                    : null
        }
      });
      extra++;
    }
  }
  console.log(`✅ Seeded ${extra} random notifications for all users.`);
  console.log(`🎉 Done!`);
}

run()
  .catch((e) => {
    console.error('❌ Error seeding notifications:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
