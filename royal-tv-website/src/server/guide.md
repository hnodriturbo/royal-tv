# 🎯 Notification Creation Guide (Royal TV)

This guide helps you quickly and effectively create real-time notifications using the `useCreateNotification` React hook.

---

## 🚀 Hook Import & Initialization

First, import and initialize the hook in your React component:

```jsx
import useCreateNotification from '@/hooks/useCreateNotification';

const { createNotification } = useCreateNotification();
```

---

## ✅ Notification Creation Commands

Here's how you create each notification type using Socket.IO via the hook:

### 1️⃣ New User Registration

```jsx
createNotification({
  type: 'newUserRegistration',
  user: { user_id, name, email },
  data: { preferredContactWay: 'email' }
});
```

---

### 2️⃣ Free Trial Requested

```jsx
createNotification({
  type: 'freeTrial',
  user: { user_id, name, email },
  data: {
    trial_id,
    status: 'requested',
    createdAt
  }
});
```

---

### 3️⃣ Free Trial Activated

```jsx
createNotification({
  type: 'freeTrial',
  user: { user_id, name, email },
  data: {
    trial_id,
    status: 'activated',
    startDate,
    endDate
  }
});
```

---

### 4️⃣ Subscription Created

```jsx
createNotification({
  type: 'subscription',
  user: { user_id, name, email },
  data: {
    subscription_id,
    plan_name,
    order_id,
    status: 'created',
    createdAt
  }
});
```

---

### 5️⃣ Subscription Activated

```jsx
createNotification({
  type: 'subscription',
  user: { user_id, name, email },
  data: {
    subscription_id,
    plan_name,
    status: 'activated',
    startDate,
    endDate
  }
});
```

---

### 6️⃣ Payment Received

```jsx
createNotification({
  type: 'payment',
  user: { user_id, name, email },
  data: {
    amount,
    currency,
    order_id,
    status: 'completed'
  }
});
```

---

### 7️⃣ Live Chat Message

```jsx
createNotification({
  type: 'liveChatMessage',
  user: { user_id, name, email },
  data: {
    conversation_id,
    sender: { name: 'Support' },
    subject: 'Your Inquiry',
    createdAt
  }
});
```

---

### 8️⃣ Bubble Chat Message

```jsx
createNotification({
  type: 'bubbleChatMessage',
  user: { user_id, name, email },
  data: {
    conversation_id,
    sender: { name: 'Support' },
    subject: 'New Message',
    createdAt
  }
});
```

---

## 💡 Best Practices

* **Always ensure required fields** (`user_id`, `name`, etc.) **are provided.**
* **Trigger notifications immediately after successful API responses.**
* **Log and handle errors gracefully** to maintain robustness.

This guide ensures efficient and real-time communication across your Royal TV application.
