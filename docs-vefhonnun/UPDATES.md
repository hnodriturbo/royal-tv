# 📓 Project Updates Log

---

### This file tracks progress on the project by date and issue.

---

## Structure layout is oldest at the bottom and latest at the top.
---
---

## 3 okt 2025 - Friday
- Finished creating functions for all useSocketHubFunctions

---

## 29 sept 2025 - Monday
- Changed the public_message_error to be more precise and take in 3 different arguments for better error handling. Arguments are code, message.
- All errors print to console for debugging and stop and return at the spot in publicMessageEvents.js.
- Added function for checking authority -> see next line.
- Changed how the reading of authorization of admin/user/guest and the differentiates on the possible changes of behavior.
- Finished with publicMessageEvents.js and will merge the branch with master after a pull request.
- 
- 
---
## 28 sept 2025 - Sunday
- Starting working finishing the publicMessageEvents.js file (quite large file for working on and also to make sure everything will align according to the work ahead).
- Everything will go faster as soon as I'm finished on working on this file. These two event files are the core of the chat system and they need to be perfect and I need the vision to know what should be in these files beforehand.
- Working today on finishing:
  - Inbound events socket.on -> **public_delete_message, public_refresh_messages, public_mark_read, public_typing** (maybe special merged public_someone_writing)
  - Outgoing emit events -> **public_message_deleted, public_messages_refreshed, public_marked_read, public_user_typing**
  - Maybe special public_admin_typing or have the typing event and emit merged for all (guest & user & admin).

- New File: cookieEvents.js (created to use cookies for each user so the chat doesnt get lost on page refresh or page redirection. For example on login -> middlePage -> user/admin dashboard).
- If guest changes into user, then his user_id should automaticly be linked to that conversation.
- There will be a widget button for registered users only they will have a "Save Chat" button and then the chat get's automatacly moved to their normal liveChat tables.
  - Process of that will be fetching all info of that PublicLiveChatConversation and the linked Messages to that conversation and it manually saved (probably via REST route instead of socket event).
  - It is not copies. All info is fetched, put into a object, object mapped and we use only needed fields and then we delete the conversation from the PublicLiveChatConversation afterwards. 
  - There will a modal that opens "Are you sure you would like to save your chat. It will be saved your Live Chat section and accessible through your dashboard. Only you and admin can edit it after that".
  - onConfirm -> chat saved to new tables, old one deleted. User will also be able to save the bot chat if he wants. That way he can access it for helpful knowlegde related only to his chat with the bot.
  - Bot integration will come last.


---
## 26 sept 2025 - Friday
- Finished with inbound events: 
  - inbound socket.on -> public_send_message, public_edit_message 
  - outgoing emit events: public_receive_message, public_message_edited, public_message_deleted.
- half way through publicMessageEvents which is rather a large file to create.
- Only delete message & refresh messages & mark read & typing indicator left code.
- When this files is finished the other parts will be easier to manage and create because the root files are that good coded and with everything in mind of what can happen and what I want to have in these event files. Very important that these files can manage all events so there is so much coding needed to be done. Also cookieEvents helps me to remember public_conversation_id and the guest public_identity_id.

---
## 24 sept 2025 - Wednesday
- finished index, organizing room and lobby creations in the index. 
- Added a log for the localeEvents.js. 
- Changed the userEvents to use an array instead of object.
- Finished organizing and coding manually publicRoomEvents.js (maybe edit's will be needed later but I think I managed to take everything into account).
- Thinking behind the rooms of public live chat is that so I can on user/guest refresh reload the chat that was already open and also on redirection by using the data and cookie in middleware.
- Starting working on the publicMessageEvents.js
- started working on cookieEvents.js to make sure user/guest holds the same chat even on refresh/redirection
---
## 23 sept 2025 - Tuesday
- edited index.js for better flow of connection (added public_identity_id) and cookie persistancy for public live chat in middleware also and removed disconnection code from userEvents.js
- edited index.js better so now it can filter tabs so if user has multiple tabs open the message isnt delivered to all tabs, only the one where the conversation started. (or is open).
- Cannot do more today because of the surgery.

---
## 22 sept 2025 - Monday
- ⚡ Started step 2 by creating publicMessageEvents.js & publicRoomEvents
- ⚙️ Fixed index.js (added pickValue helper so all guests get guest role and guest-id using the socket.id)
- 🕗 I am working to finish coding the event files.  

- **📚 Spent 4 hours today on the computer working.**
- It takes a long time figuring out how to keep this system specially away from the main liveChat system.
- A long time went into learning where to start and how to organize the event files making sure all fits.
- Spent time working on reading all other codes related to the socket system.
- Decided to add extra file later that handles connecting the client with cookies to socket.io so a conversation can be persisted between pages and even login and logout.

---
## 21 sept 2025 - Sunday
- ✨ Edited the issues to the latest update of the Public_Live_Chat_Plan.md file.
- 📌 Made a checkout of the master branch and tagged it with a version.
- ⚡ Finished creating the markdown documentation files for master. 
- ✅ Double language is officially finished. All text will be written and used with useLocale or useTranslations and added to dictionaries on the go.
- 🚀 Create special chapter for public live chat in the language dictionaries to use on the go. 

- 1️⃣ Starting working on step 1 of the plan. **Branch:** `feature/public-chat-db`
- ✅ Finished working on final version of the tables for PublicLiveChatConversation and PublicLiveChatMessage.

- Starting step 2 **2) Server: Public socket events** — `feature/public-socket-events` 



---

## 20 sept 2025 - Saturday
- ✅ Created Plan and issues for each part of the plan. With markdown coding for each part that has checkboxes for each issue.
- ✅ Created special folder for the UPDATES.md (this file) and for the Public_Live_Chat_Plan.md which will hold the progress.

---

## 18 sept 2025
- ✅ Created branch for the event file creation [#6](https://github.com/hnodriturbo/royal-tv/issues/6)
- ❌ Canceled this plan and made a new one.

---

## 17 sept 2025
- ✅ Created branch for issue [#4](https://github.com/hnodriturbo/royal-tv/issues/4)
- 🏛️ Created two tables in schema.prisma file
  - PublicLiveChatConversation & PublicLiveChatMessage
- Pushed the tables to the postgres database
- ❌ Closed the branch after moving from in progress to done.
- ✅ DONE 

---

## 16 sept 2025
- ✅ Deleted old branches; will now create branches on the go


## 10 sept. 2025

- ✅ Created Git workflow plan with branches-per-issue
- ✅ Synced local master with GitHub remote





---

#### Sample 2
- 🔀 Merged branch `issue-2-fix-login-bug` into master
- 🗑️ Deleted branch after merge
- 📦 Updated dependencies (Next.js 15, Tailwind v4)

#### Sample 1
- 🚧 Started Issue #3: LiveChat AI bot
- 📝 Created branch `issue-3-livechat-ai`
