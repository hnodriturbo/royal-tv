# 📬 Notification System Usage Guide – Royal TV

## 1️⃣ Overview

This system provides unified notification templates and builders for both user and admin events in the Royal TV platform. It makes notification generation robust, maintainable, and easy to localize or extend.

* All notification copy and links are generated via builder functions.
* Templates are organized in `/constants/userNotificationTemplates.js` and `/constants/adminNotificationTemplates.js`.
* Builders are in `/constants/notificationBuilder.js` and handle mapping of real business data into notification-friendly payloads.
* Seed scripts help you generate dummy notifications for testing and demo purposes.

---

## 2️⃣ Notification Flow

**1. Event occurs** (user signs up, pays, receives message, etc.)
**2. Call the builder** (user/admin) with your domain objects (user, payment, etc.)
\*\*3. The builder generates the final `{ title, body, link, type }` object.
\*\*4. Save the notification to your DB (via Prisma or other ORM).
\*\*5. Show/send/display it in your app via any UI method.

---

## 3️⃣ User vs. Admin Notification Templates

* **User templates** are designed for the user’s perspective and onboarding help.
* **Admin templates** are written for support agents and management workflows.
* Both support dynamic data (order\_id, subscription info, etc.).

---

## 4️⃣ Example Usage

```js
import { userNotificationBuilder, adminNotificationBuilder } from '@/constants/notificationBuilder.js';

// 👤 For user notification (subscription activated):
const notif = userNotificationBuilder.subscriptionActivated(subscription, user);
await prisma.notification.create({
  data: {
    user_id: user.user_id,
    title: notif.title,
    body: notif.body,
    link: notif.link,
    type: notif.type
  }
});

// 🛡️ For admin notification (payment received):
const notif = adminNotificationBuilder.paymentReceived(payment, user);
await prisma.notification.create({
  data: {
    user_id: adminId, // or null/leave blank if only for dashboard
    title: notif.title,
    body: notif.body,
    link: notif.link,
    type: notif.type
  }
});
```

---

## 5️⃣ Seeding Notifications (with Dummy Data)

* You can seed notifications using the provided builder functions and sample data.
* Use the script below to quickly fill your dev DB with test notifications for all notification types, both user and admin.

---

## 6️⃣ Adding a New Notification Type

1. Add a new entry in `notificationTypes.js`.
2. Create matching templates in both user/admin template files.
3. Add a builder method for it in `notificationBuilder.js`.
4. Use it like any other notification (see above) in your business logic or seeding scripts.

---

## 7️⃣ Good Practices

* Always pass the **richest possible data** to builder functions so templates can adapt and stay DRY.
* Use the same system for emails, in-app toasts, or push notifications (just ignore the `link` if not relevant).
* Never save sensitive data in notifications unless you intend users/admins to see it.
* Update templates if your product copy or links change—never hard-code in many places.
* Run the seed script on every schema or copy change to preview the UI!

---

# 🎉 That’s it! Your notification system is ready for robust, scalable, maintainable real-world use in Royal TV.
