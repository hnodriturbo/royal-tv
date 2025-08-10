/**
 * Sidebar.js
 * ===============================
 * Universal fixed sidebar for all roles (admin/user/guest).
 * Uses one nav links file (sidebarLinks.js).
 * Sidebar is always the same visually, only links change per role.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import sidebarLinks from '@/lib/utils/sidebarLinks';
import useLogout from '@/hooks/useLogout';

export default function Sidebar() {
  const { data: session, status } = useSession();
  let role = 'guest';
  if (status === 'authenticated') {
    if (session?.user?.role === 'admin') role = 'admin';
    else if (session?.user?.role === 'user') role = 'user';
  }

  // 🟢 Only use correct links per role, never merge!
  let links = sidebarLinks.guest;
  if (role === 'user') links = sidebarLinks.user;
  if (role === 'admin') links = sidebarLinks.admin;

  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);

  return (
    <>
      {/* ========= SIDEBAR (Desktop only) ========= */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 bg-smooth-gradient-dark-2 my-border-all-4 shadow-box-3 z-[1000] flex-col">
        {/* 👑 Logo above Title */}

        <div className="flex flex-col items-center py-2">
          <Link href="/" className="flex flex-col items-center" tabIndex={0}>
            <Image
              src="/images/logo/logo.png"
              alt="Royal TV Logo"
              width={38}
              height={38}
              className="mb-1"
            />
            <span className="text-wonderful-4 text-lg font-bold tracking-wider">Royal TV</span>
          </Link>
        </div>
        {/* 🧭 Navigation */}
        <nav className="flex-1 mt-4 overflow-y-auto">
          <ul className="space-y-2">
            {links.map((item) =>
              item.href === '/logout' ? (
                <li key={item.href}>
                  <button
                    onClick={logout}
                    className="w-10/12 flex items-center px-6 py-3 rounded-full text-lg font-normal cursor-pointer text-red-500 transition-all duration-300 hover:bg-red-600 hover:ml-4 hover:text-white hover:font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <span className="mr-3">{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex w-10/12 mt-3 ms-2 items-center px-6 py-3 rounded-full text-lg font-normal transition-all duration-300 hover:bg-gradient-to-r hover:ml-4 hover:from-cyan-500 hover:to-blue-700 hover:text-white hover:font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <span className="mr-3">{item.emoji}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>
        <div className="mb-4 text-xs text-center text-gray-400">
          © {new Date().getFullYear()} Royal TV
        </div>
      </aside>

      {/* ========= MOBILE HEADER & DRAWER ========= */}
      <div className="w-full lg:hidden fixed top-0 left-0 z-50 h-14 flex items-center bg-smooth-gradient shadow-box-2">
        <button
          className="ml-4 text-3xl font-bold text-white"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        {/* 👑 Logo - Title - Logo row (mobile/header) */}
        <div className="flex-1 flex items-center justify-center">
          <Link href="/" className="flex items-center space-x-2" tabIndex={0}>
            <Image
              src="/images/logo/logo.png"
              alt="Royal TV Logo Left"
              width={36}
              height={36}
              className="drop-shadow"
              priority
            />
            <span className="text-wonderful-4 text-xl font-bold tracking-wider whitespace-nowrap">
              Royal TV
            </span>
            <Image
              src="/images/logo/logo.png"
              alt="Royal TV Logo Right"
              width={36}
              height={36}
              className="drop-shadow"
              priority
            />
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
        {/* 👑 Logo above Title */}
        <div className="flex flex-col items-center py-3">
          <Link href="/" className="flex flex-col items-center" tabIndex={0}>
            <Image
              src="/images/logo/logo.png"
              alt="Royal TV Logo"
              width={30}
              height={30}
              className="mb-1"
            />
            <span className="text-wonderful-4 text-base font-bold tracking-wider">Royal TV</span>
          </Link>
        </div>
        <nav className="flex-1 mt-4 overflow-y-auto">
          <ul className="space-y-2">
            {links.map((item) =>
              item.href === '/logout' ? (
                <li key={item.href}>
                  <button
                    onClick={() => {
                      handleClose();
                      logout();
                    }}
                    className="w-10/12 flex items-center px-6 py-3 rounded-full text-lg font-normal cursor-pointer text-red-500 transition-all duration-300 hover:bg-red-600 hover:ml-4 hover:text-white hover:font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <span className="mr-3">{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex w-10/12 items-center px-6 py-3 rounded-full text-lg font-normal transition-all duration-300 hover:bg-gradient-to-r hover:ml-4 hover:from-cyan-500 hover:to-blue-700 hover:text-white hover:font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    onClick={handleClose}
                  >
                    <span className="mr-3">{item.emoji}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>
        <div className="mb-4 text-xs text-center text-gray-400">
          © {new Date().getFullYear()} Royal TV
        </div>
      </aside>
    </>
  );
}
