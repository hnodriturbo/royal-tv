/**
 * AdminSidebar.js
 * ===============================
 * - Fixed sidebar for desktop (md+)
 * - Mobile header with hamburger that opens a slide-out drawer
 * - Drawer and sidebar share links, logo, styles
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import useLogout from '@/hooks/useLogout';

// Navigation links
const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', emoji: '🏠' },
  { href: '/admin/notifications', label: 'Notifications', emoji: '🔔' },
  { href: '/admin/freeTrials/main', label: 'Free Trials', emoji: '🎁' },
  { href: '/admin/liveChat/main', label: 'Live Chats', emoji: '💬' },
  /* { href: '/admin/bubbleChat/main', label: 'Bubble Chats', emoji: '💬' }, */
  { href: '/admin/subscriptions/main', label: 'Subscriptions', emoji: '💳' },
  { href: '/admin/users/main', label: 'Users', emoji: '👥' },
  { href: '/admin/profile', label: 'Profile', emoji: '⚙️' },
  { href: '/logout', label: 'Logout', emoji: '🚪' }
];

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const logout = useLogout();

  // 🟠 Handles closing drawer when link is clicked or overlay is pressed
  const handleClose = () => setOpen(false);

  return (
    <>
      {/* ========= SIDEBAR (Desktop only) ========= */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 bg-smooth-gradient-dark-2 my-border-all-4 shadow-box-3 z-50 flex-col">
        <div className="flex flex-col items-center py-3">
          <Link href="/" className="flex flex-col items-center" tabIndex={0}>
            <Image
              src="/images/logo/logo.png"
              alt="Royal TV Logo"
              width={56}
              height={56}
              className="mb-2"
            />
            <span className="text-wonderful-4 text-2xl font-bold tracking-wider">
              Royal TV Admin
            </span>
          </Link>
        </div>
        {/* 🧭 Navigation */}
        <nav className="flex-1 mt-4 overflow-y-auto">
          <ul className="space-y-2">
            {navLinks.map((item) => (
              <li key={item.href}>
                {item.href === '/logout' ? (
                  <button
                    onClick={logout}
                    className="w-10/12 flex items-center px-6 py-3 rounded-full text-lg font-normal cursor-pointer text-red-500 transition-all duration-300 hover:bg-red-600 hover:ml-4 hover:text-white hover:font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <span className="mr-3">{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="flex w-10/12 items-center px-6 py-3 rounded-full text-lg font-normal transition-all duration-300 hover:bg-gradient-to-r hover:ml-4 hover:from-cyan-500 hover:to-blue-700 hover:text-white hover:font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <span className="mr-3">{item.emoji}</span>
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="mb-4 text-xs text-center text-gray-400">© 2025 Royal TV Admin</div>
      </aside>

      {/* ========= MOBILE HEADER & DRAWER ========= */}
      {/* Only on small screens */}
      <div className="w-full lg:hidden fixed top-0 left-0 z-50 h-14 flex items-center bg-smooth-gradient shadow-box-2">
        {/* Hamburger button */}
        <button
          className="ml-4 text-3xl font-bold text-white"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
        >
          ☰
        </button>
        {/* Centered Logo + Title (Clickable, links to home) */}
        <div className="flex-1 flex items-center justify-center">
          <Link href="/" className="flex items-center cursor-pointer" tabIndex={0}>
            <Image
              src="/images/logo/logo.png"
              alt="Royal TV Logo"
              width={38}
              height={38}
              className="mr-2"
            />
            <span className="text-wonderful-4 text-xl font-bold tracking-wide">Royal TV Admin</span>
          </Link>
        </div>
      </div>
      {/* Drawer overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } lg:hidden`}
        onClick={handleClose}
      />
      {/* Slide-out drawer */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-smooth-gradient-dark-2 my-border-all-4 shadow-box-3 z-50 flex flex-col transform transition-transform duration-300 lg:hidden
    ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-3xl text-white"
          aria-label="Close menu"
          onClick={handleClose}
        >
          ✖️
        </button>
        {/* Logo/Title */}
        <div className="flex flex-col items-center py-8">
          <Image src="/images/logo/logo.png" alt="Royal TV Logo" width={50} height={50} />
          <span className="text-wonderful-4 text-xl font-bold tracking-wider">Royal TV Admin</span>
        </div>
        <nav className="flex-1 mt-4 overflow-y-auto">
          <ul className="space-y-2">
            {navLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="
                  flex items-center px-6 py-3 rounded-full text-lg font-normal
                  transition-all duration-300
                  hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-700 hover:w-10/12 hover:ml-3 hover:text-white
                  hover:font-bold
                  focus:outline-none focus:ring-2 focus:ring-cyan-400
                "
                  onClick={handleClose}
                >
                  <span className="mr-3">{item.emoji}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mb-4 text-xs text-center text-gray-400">© 2025 Royal TV Admin</div>
      </aside>
    </>
  );
}
