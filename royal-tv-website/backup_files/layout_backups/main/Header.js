'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import useAppHandlers from '@/hooks/useAppHandlers'; // ✅ Import the handler
import useLogout from '@/hooks/useLogout';

// ===== Admin sidebar nav links (mirror AdminSidebar.js) =====
const adminDropdownLinks = [
  { href: '/admin/dashboard', label: 'Admin Dashboard', emoji: '🏠' },
  { href: '/admin/notifications', label: 'Notifications', emoji: '🔔' },
  { href: '/admin/freeTrials/main', label: 'Free Trials', emoji: '🎁' },
  { href: '/admin/liveChat/main', label: 'Live Chats', emoji: '💬' },
  // { href: '/admin/bubbleChat/main', label: 'Bubble Chats', emoji: '💬' },
  { href: '/admin/subscriptions/main', label: 'Subscriptions', emoji: '💳' },
  { href: '/admin/users/main', label: 'Users', emoji: '👥' },
  { href: '/admin/profile', label: 'Profile', emoji: '⚙️' }
];

// ===== User sidebar nav links (mirror UserSidebar.js) =====
const userDropdownLinks = [
  { href: '/user/dashboard', label: 'User Dashboard', emoji: '🏠' },
  { href: '/admin/notifications', label: 'Notifications', emoji: '🔔' },
  { href: '/user/liveChat/main', label: 'Live Chats', emoji: '💬' },
  // { href: '/user/bubbleChat/main', label: 'Bubble Chats', emoji: '💬' },
  { href: '/user/subscriptions', label: 'Subscriptions', emoji: '💳' },
  { href: '/user/freeTrials', label: 'Free Trial', emoji: '🎁' },
  { href: '/user/profile', label: 'Profile', emoji: '⚙️' }
];

// ===== General public links =====
const publicLinks = [
  { href: '/', label: 'Home', emoji: '🏠' },
  { href: '/more-info', label: 'More Info', emoji: 'ℹ️' },
  { href: '/FAQ', label: 'FAQ', emoji: '❓' }
];

// 🎨 Styles for offcanvas menu buttons to match sidebar
const offcanvasButtonClasses =
  'flex items-start w-10/12 px-4 py-3 m-1 rounded-full text-lg font-normal transition-all duration-300 ' +
  'hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-700 hover:text-white hover:ml-4 hover:font-bold ' +
  'focus:outline-none focus:ring-2 focus:ring-cyan-400';

const offcanvasButtonClassesLogout =
  'flex items-start w-10/12 px-6 py-3 m-1 rounded-full text-lg font-normal cursor-pointer text-red-500 transition-all duration-300 ' +
  'hover:bg-red-600 hover:text-white hover:ml-4 hover:font-bold focus:outline-none focus:ring-2 focus:ring-red-400';

// 🎨 Classes for dropdown menu items in header
const dropdownMenuButtonClasses =
  'block w-full text-left px-5 py-2 font-normal text-base transition bg-gray-700 text-gray-200 ' +
  'hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-700 hover:text-white hover:font-bold';

// 🔴 Logout button style (dropdown)
const dropdownMenuButtonLogoutClasses =
  'block w-full text-left px-5 py-2 font-normal text-base transition bg-red-500 text-white ' +
  'hover:bg-red-700 hover:font-bold';

const Navbar = () => {
  // 🌐 Fetch current session and status clearly from NextAuth
  const { data: session, status } = useSession();

  // ✅ Use global loading handler
  const { showLoader, hideLoader } = useAppHandlers();

  // 🔑 Determine if the user is authenticated clearly
  const authenticated =
    status === 'authenticated' && session?.user?.role && session.user.role !== 'guest';

  // 👤 Extract user info safely (defaults to null if not authenticated)
  const user = authenticated ? session.user : null;

  // Local state for dropdown and offcanvas.
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isOffcanvasOpen, setOffcanvasOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const offcanvasRef = useRef(null);
  /* 
  const unread = useUnreadCount(); // 🔥 live count
  const unreadAdmin = useAdminUnread();
 */
  // Destructure the logout function
  const logout = useLogout();

  // Toggle the offcanvas menu.
  const toggleOffcanvas = () => {
    setOffcanvasOpen((prev) => !prev);
  };

  // Focus on the offcanvas element when it opens.
  useEffect(() => {
    if (isOffcanvasOpen && offcanvasRef.current) {
      offcanvasRef.current.focus();
    }
  }, [isOffcanvasOpen]);

  // Close the offcanvas when clicking outside of it.
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (isOffcanvasOpen && offcanvasRef.current && !offcanvasRef.current.contains(event.target)) {
        toggleOffcanvas();
      }
    };

    if (typeof window !== 'undefined' && isOffcanvasOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('mousedown', handleOutsideClick);
      }
    };
  }, [isOffcanvasOpen]);

  return (
    <>
      {/* Navbar Header */}
      <div className="fixed bg-smooth-gradient top-0 z-[100] w-full p-1 shadow opacity-95 backdrop-blur max-h-14 h-14 min-h-14">
        <div className="flex items-center justify-between w-full px-4">
          {/* Mobile Menu Button */}
          <div className="flex items-center h-14">
            {/* h-14 to match navbar height */}
            <button
              onClick={toggleOffcanvas}
              className="z-30 flex items-center justify-center cursor-pointer focus:outline-none"
              aria-label="Toggle Menu"
            >
              Menu
              <i className="w-8 h-6 ml-2 bi bi-list"></i>
            </button>
          </div>

          {/* Center Logo */}
          <div className="absolute z-10 flex items-center space-x-2 transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <Image
                  src="/images/logo/logo.png"
                  alt="Logo Left"
                  width={50}
                  height={50}
                  priority
                />
                <h1 className="text-2xl font-bold whitespace-nowrap">Royal TV</h1>
                <Image
                  src="/images/logo/logo.png"
                  alt="Logo Right"
                  width={50}
                  height={50}
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="lg:flex hidden items-center justify-center pr-4 space-x-4 whitespace-nowrap">
            <Link href="/FAQ">
              <button className="w-full p-1 m-2 font-bold cursor-pointer transition-all duration-700 transform min-w-20 rounded-2xl hover-bg-smooth-gradient hover:underline hover:scale-105">
                FAQ !
              </button>
            </Link>
            <Link href="/more-info">
              <button className="w-full p-1 m-2 font-bold cursor-pointer transition-all duration-700 transform min-w-20 rounded-2xl hover-bg-smooth-gradient hover:underline hover:scale-105">
                More Info !
              </button>
            </Link>

            {authenticated ? (
              <div
                className="relative group"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                {/* 🧑 Dropdown Button */}
                <button
                  className={`flex items-center justify-between w-full min-w-48 p-2 cursor-pointer gradient-dark-light-5 font-bold ${
                    dropdownOpen ? 'rounded-t-xl' : 'rounded-xl'
                  } transition-all duration-300`}
                >
                  <i
                    className={`bi ${
                      user?.role === 'admin' ? 'bi-person-badge-fill ml-4' : 'ml-4 bi-person-fill'
                    }`}
                  ></i>
                  <span>{user?.role === 'admin' ? 'Admin Actions' : 'User Actions'}</span>
                  <i className="bi bi-chevron-down"></i>
                </button>

                {/* 🗂️ Dropdown Menu */}
                <div
                  className={`absolute top-full left-0 w-full gradient-dark-light-5 shadow-lg ${
                    dropdownOpen ? 'rounded-b-xl h-auto opacity-100' : 'h-0 opacity-0'
                  } overflow-hidden transition-all duration-300`}
                >
                  {/* 🏅 Map sidebar links (no logout) */}
                  {(user?.role === 'admin' ? adminDropdownLinks : userDropdownLinks)
                    .filter((item) => item.href !== '/logout')
                    .map((item) => (
                      <Link key={item.href} href={item.href} className={dropdownMenuButtonClasses}>
                        <span className="mr-2">{item.emoji}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}

                  {/* 🔴 Logout */}
                  <button onClick={logout} className={dropdownMenuButtonLogoutClasses}>
                    <span className="mr-2">🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link href="/auth/signup">
                  <button className="w-full p-1 m-2 font-bold cursor-pointer transition-all duration-700 transform min-w-20 rounded-2xl hover-bg-smooth-gradient hover:underline hover:scale-105">
                    Register
                  </button>
                </Link>
                <Link href="/auth/signin">
                  <button className="w-full p-1 m-2 font-bold cursor-pointer transition-all duration-700 transform min-w-20 rounded-2xl hover-bg-smooth-gradient hover:underline hover:opacity-100 hover:scale-105">
                    Login
                  </button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Offcanvas Menu (Mobile) */}
      <div
        ref={offcanvasRef}
        className={`fixed top-0 left-0 h-screen w-64 bg-smooth-gradient-dark-2 my-border-all-4 shadow-box-3 z-[120] flex flex-col transform transition-transform duration-700 ease-in-out ${
          isOffcanvasOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* ❌ Close button (emoji version) */}
        <button
          onClick={toggleOffcanvas}
          className="absolute top-3 right-3 p-2 focus:outline-none cursor-pointer text-xl"
          aria-label="Close Menu"
        >
          {/* Use the emoji directly */}
          ✖️
        </button>

        {/* 👑 Logo above Title, both clickable, links home */}
        <div className="flex flex-col items-center w-full mt-8 mb-4">
          <Link href="/" onClick={toggleOffcanvas} className="flex flex-col items-center">
            <Image
              src="/images/logo/logo.png"
              alt="Royal TV Logo"
              width={38}
              height={38}
              className="mb-2"
              priority
            />
            <span className="text-wonderful-4 text-xl font-bold tracking-wider">Royal TV</span>
          </Link>
        </div>

        {/* 📋 Main nav links */}
        <div className="flex flex-col items-center mt-3 space-y-1">
          {/* 🌎 Public links always visible */}
          {publicLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={toggleOffcanvas}
              className={offcanvasButtonClasses}
            >
              <span className="mr-3">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          <hr className="w-8/12 border border-slate-500 my-2" />

          {/* 🏅 Role-based links */}
          {authenticated && user?.role === 'admin' && (
            <>
              {/* Show Admin Dashboard link */}
              <Link
                href={adminDropdownLinks[0].href}
                onClick={toggleOffcanvas}
                className={offcanvasButtonClasses}
              >
                <span className="mr-3">{adminDropdownLinks[0].emoji}</span>
                <span>{adminDropdownLinks[0].label}</span>
              </Link>
              {/* Go to Admin Dashboard (custom button) */}
              {/*  <Link
                href="/admin/dashboard"
                onClick={toggleOffcanvas}
                className={offcanvasButtonClasses}
              >
                <span className="mr-3">👑</span>
                <span>Admin Sidebar</span>
              </Link> */}
              {/* 🔑 Logout */}
              <button
                onClick={() => {
                  toggleOffcanvas();
                  logout();
                }}
                className={offcanvasButtonClassesLogout}
              >
                <span className="mr-3">🚪</span>
                <span>Logout</span>
              </button>
            </>
          )}

          {authenticated && user?.role === 'user' && (
            <>
              {/* Show User Dashboard link */}
              <Link
                href={userDropdownLinks[0].href}
                onClick={toggleOffcanvas}
                className={offcanvasButtonClasses}
              >
                <span className="mr-3">{userDropdownLinks[0].emoji}</span>
                <span>{userDropdownLinks[0].label}</span>
              </Link>
              {/* 🔑 Logout */}
              <button
                onClick={() => {
                  toggleOffcanvas();
                  logout();
                }}
                className={offcanvasButtonClassesLogout}
              >
                <span className="mr-3">🚪</span>
                <span>Logout</span>
              </button>
            </>
          )}

          {/* 👤 If not authenticated, show register/login */}
          {!authenticated && (
            <>
              <Link
                href="/auth/signup"
                onClick={toggleOffcanvas}
                className={offcanvasButtonClasses}
              >
                <span className="mr-3">📝</span>
                <span>Register</span>
              </Link>
              <Link
                href="/auth/signin"
                onClick={toggleOffcanvas}
                className={offcanvasButtonClasses}
              >
                <span className="mr-3">🔑</span>
                <span>Login</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
