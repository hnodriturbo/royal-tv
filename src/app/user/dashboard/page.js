/* ---------------------------------------------------------------
 * 🧑‍💻 UserDashboard.js
 * ───────────────────────────────────────────────────────────────
 * • Shows quick links for subscriptions, profile, live‑chat, etc.
 * • Listens for 🔌 Socket.IO “receive_message” events.
 * • Displays an animated banner when a NEW message arrives and
 *   lets the user jump straight into that conversation.
 * ------------------------------------------------------------- */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import useLogout from '@/hooks/useLogout'
import useAuthGuard from '@/hooks/useAuthGuard'
import useSocket from '@/hooks/socket/useSocket'

/* 🔘 Re‑usable gradient button ------------------------------ */
const DashboardActionButton = ({ href, label }) => (
  <Link href={href}>
    <button className="w-full bg-smooth-gradient py-2 px-4 rounded-lg shadow-2xl hover:shadow-md transition">
      {label}
    </button>
  </Link>
)

const UserDashboard = () => {
  /* ---------------------------------------------------------
   * Session + auth guard
   * ------------------------------------------------------- */
  const { data: session, status } = useSession()
  const { isAllowed, redirect } = useAuthGuard('user')
  const logout = useLogout()
  const router = useRouter()

  /* ---------------------------------------------------------
   * Socket helpers
   * ------------------------------------------------------- */
  const { emit, listen } = useSocket()

  /* ---------------------------------------------------------
   * Local state
   * ------------------------------------------------------- */
  const [incomingMsg, setIncomingMsg] = useState(null) // banner data

  /* ---------------------------------------------------------
   * Real‑time: join personal dashboard room + listen for messages
   * ------------------------------------------------------- */
  useEffect(() => {
    if (!session?.user?.user_id) return

    /* 🎧 Listen for any new message directed at this user */
    const offReceive = listen('receive_message', (msg) => {
      if (msg.user_id !== session.user.user_id) return // ignore others
      setIncomingMsg(msg) // 🌟 trigger banner
    })

    return offReceive // cleanup
  }, [listen, emit, session?.user?.user_id])

  /* ➡️ Redirect if not authorised once state is known */
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect)
  }, [status, isAllowed, redirect, router])

  if (!isAllowed) return null
  /* ---------------------------------------------------------
   * Render
   * ------------------------------------------------------- */
  return (
    <div className="flex items-center justify-center flex-col w-full">
      {/* ── New‑message banner (top container) ─────────── */}
      {incomingMsg && (
        <div
          className={`container-style pc:w-[600px] transition-opacity duration-300 ${
            incomingMsg ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="bg-blue-700/80 text-white p-3 rounded-lg flex items-center justify-between gap-3 animate-pulse">
            <div className="flex-1 truncate">
              📩 <strong>New message:</strong>{' '}
              <span title={incomingMsg.message}>
                {incomingMsg.message.slice(0, 80)}
                {incomingMsg.message.length > 80 && '…'}
              </span>
            </div>

            {/* 👉 Jump straight to live‑chat for that conversation */}
            <button
              onClick={() =>
                router.push(`/user/liveChat/${incomingMsg.conversation_id}`)
              }
              className="bg-green-500 hover:bg-green-600 px-4 py-1 rounded-lg shrink-0"
            >
              Open Chat
            </button>

            {/* ✖️ Dismiss banner */}
            <button
              onClick={() => setIncomingMsg(null)}
              className="text-xl leading-none hover:text-gray-300 shrink-0"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* ── Main dashboard card ────────────────────────── */}
      <div className="container-style pc:w-[600px]">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Welcome, {session?.user?.name || 'User'}
          </h2>
          <p className="text-center">
            Role:{' '}
            <span className="font-medium">{session?.user?.role ?? 'NA'}</span>
          </p>
          <p className="text-center">
            User ID:{' '}
            <span className="font-medium">
              {session?.user?.user_id ?? 'NA'}
            </span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col w-full px-4 gap-4">
          <DashboardActionButton
            href="/user/subscriptions"
            label="See My Subscriptions"
          />
          <DashboardActionButton
            href="/user/liveChat/main"
            label="View Live Conversations"
          />
          <DashboardActionButton
            href="/user/profile"
            label="View Your Profile"
          />
        </div>

        {/* Logout */}
        <div className="mt-8 flex justify-center items-center">
          <button
            onClick={logout}
            className="bg-red-500 px-4 py-2 rounded hover:bg-red-800 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard
