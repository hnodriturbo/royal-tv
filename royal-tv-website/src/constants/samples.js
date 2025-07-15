// 📦 Free trial requested (user and admin)
const userNotif = notificationSystem.userNotificationBuilder.freeTrialRequested(freeTrial, user);
const adminNotif = notificationSystem.adminNotificationBuilder.freeTrialRequested(freeTrial, user);

// 🎁 Free trial activated
const userNotif = notificationSystem.userNotificationBuilder.freeTrialActivated(freeTrial, user);
const adminNotif = notificationSystem.adminNotificationBuilder.freeTrialActivated(freeTrial, user);

// 🆕 Subscription created
const userNotif = notificationSystem.userNotificationBuilder.subscriptionCreated(
  subscription,
  user
);
const adminNotif = notificationSystem.adminNotificationBuilder.subscriptionCreated(
  subscription,
  user
);

// 🟢 Subscription activated
const userNotif = notificationSystem.userNotificationBuilder.subscriptionActivated(
  subscription,
  user
);
const adminNotif = notificationSystem.adminNotificationBuilder.subscriptionActivated(
  subscription,
  user
);

// 💸 Payment received
const userNotif = notificationSystem.userNotificationBuilder.paymentReceived(payment, user);
const adminNotif = notificationSystem.adminNotificationBuilder.paymentReceived(payment, user);

// 💬 Live chat
const userNotif = notificationSystem.userNotificationBuilder.liveChatMessage(
  message,
  conversation,
  user
);
const adminNotif = notificationSystem.adminNotificationBuilder.liveChatMessage(
  message,
  conversation,
  user
);

// 💬 Bubble chat
const userNotif = notificationSystem.userNotificationBuilder.bubbleChatMessage(
  message,
  conversation,
  user
);
const adminNotif = notificationSystem.adminNotificationBuilder.bubbleChatMessage(
  message,
  conversation,
  user
);
