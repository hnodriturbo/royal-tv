'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import useAppHandlers from '@/hooks/useAppHandlers'; // ✅ Import the handler
import useLogout from '@/hooks/useLogout';

// ===== Admin sidebar nav links (mirror AdminSidebar.js) =====
const adminSidebarLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', emoji: '🏠' },
  { href: '/admin/notifications', label: 'Notifications', emoji: '🔔' },
  { href: '/admin/freeTrials/main', label: 'Free Trials', emoji: '🎁' },
  { href: '/admin/liveChat/main', label: 'Live Chats', emoji: '💬' },
  // { href: '/admin/bubbleChat/main', label: 'Bubble Chats', emoji: '💬' },
  { href: '/admin/subscriptions/main', label: 'Subscriptions', emoji: '💳' },
  { href: '/admin/users/main', label: 'Users', emoji: '👥' },
  { href: '/admin/profile', label: 'Profile', emoji: '⚙️' }
];

// ===== User sidebar nav links (mirror UserSidebar.js) =====
const userSidebarLinks = [
  { href: '/user/dashboard', label: 'Dashboard', emoji: '🏠' },
  { href: '/admin/notifications', label: 'Notifications', emoji: '🔔' },
  { href: '/user/liveChat/main', label: 'Live Chats', emoji: '💬' },
  // { href: '/user/bubbleChat/main', label: 'Bubble Chats', emoji: '💬' },
  { href: '/user/subscriptions/main', label: 'Subscriptions', emoji: '💳' },
  { href: '/user/freeTrials', label: 'Free Trial', emoji: '🎁' },
  { href: '/user/profile', label: 'Profile', emoji: '⚙️' }
];

// ===== General public links =====
const publicLinks = [
  { href: '/', label: 'Home', emoji: '🏠' },
  { href: '/more-info', label: 'More Info', emoji: 'ℹ️' },
  { href: '/FAQ', label: 'FAQ', emoji: '❓' }
];

// 🎨 Styles for offcanvas menu buttons to match sidebar (copy from Admin/UserSidebar)
const offcanvasButtonClasses =
  'flex items-center w-11/12 px-6 py-3 m-1 rounded-full text-lg font-normal transition-all duration-300 ' +
  'hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-700 hover:text-white hover:ml-4 hover:font-bold ' +
  'focus:outline-none focus:ring-2 focus:ring-cyan-400';
const offcanvasButtonClassesLogout =
  'flex items-center w-11/12 px-6 py-3 m-1 rounded-full text-lg font-normal cursor-pointer text-red-500 transition-all duration-300 ' +
  'hover:bg-red-600 hover:text-white hover:ml-4 hover:font-bold focus:outline-none focus:ring-2 focus:ring-red-400';

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
                {/* Dropdown Button */}
                <button
                  className={`flex items-center justify-between w-full min-w-48 p-2 cursor-pointer gradient-dark-light-5 font-bold ${
                    dropdownOpen ? 'rounded-t-xl' : 'rounded-xl'
                  } transition-all duration-300`}
                >
                  <i
                    className={`bi ${user?.role === 'admin' ? 'bi-person-badge-fill ml-4' : 'ml-4 bi-person-fill'}`}
                  ></i>
                  <span>{user?.role === 'admin' ? 'Admin Actions' : 'User Actions'}</span>
                  <i className="bi bi-chevron-down"></i>
                </button>

                {/* Dropdown Menu */}

                <div
                  className={`absolute top-full left-0 w-full gradient-dark-light-5 shadow-lg ${
                    dropdownOpen ? 'rounded-b-xl h-auto opacity-100' : 'h-0 opacity-0'
                  } overflow-hidden transition-all duration-300`}
                >
                  {user?.role === 'admin' ? (
                    <>
                      <Link
                        href="/admin/dashboard/"
                        className="block px-4 py-2 cursor-pointer transition bg-gray-700 hover:bg-gray-500"
                      >
                        Show Dashboard
                      </Link>
                      <Link
                        href="/admin/users/main"
                        className="block px-4 py-2 cursor-pointer transition bg-gray-700 hover:bg-gray-500"
                      >
                        Show Users
                      </Link>
                      <Link
                        href="/admin/liveChat/main"
                        className="block px-4 py-2 cursor-pointer transition bg-gray-700 hover:bg-gray-500"
                      >
                        Show LiveChats
                      </Link>
                      <Link
                        href="/admin/bubbleChat/main"
                        className="block px-4 py-2 cursor-pointer transition bg-gray-700 hover:bg-gray-500"
                      >
                        Show BubbleChats
                      </Link>
                      <Link
                        href="/admin/subscriptions/main"
                        className="block px-4 py-2 cursor-pointer transition bg-gray-700 hover:bg-gray-500"
                      >
                        Show Subscriptions
                      </Link>
                      <Link
                        href="/admin/freeTrials/main"
                        className="block px-4 py-2 cursor-pointer transition bg-gray-700 hover:bg-gray-500"
                      >
                        Show Free Trials
                      </Link>
                      <Link
                        href="/admin/profile"
                        className="block px-4 py-2 cursor-pointer transition bg-gray-700 hover:bg-gray-500"
                      >
                        My Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/user/dashboard"
                        className="block px-4 py-2 cursor-pointer transition bg-gray-700 hover:bg-gray-500"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/user/liveChat/main"
                        className="block px-4 py-2 cursor-pointer transition bg-gray-700 hover:bg-gray-500"
                      >
                        My LiveChat Conv.
                      </Link>
                      <Link
                        href="/user/bubbleChat/main"
                        className="block px-4 py-2 cursor-pointer transition bg-gray-700 hover:bg-gray-500"
                      >
                        My Bubble Conv.
                      </Link>
                      <Link
                        href="/user/freeTrials/"
                        className="block px-4 py-2 cursor-pointer transition bg-gray-700 hover:bg-gray-500"
                      >
                        My Free Trial
                      </Link>
                      <Link
                        href="/user/subscriptions/main"
                        className="block px-4 py-2 cursor-pointer transition bg-gray-700 hover:bg-gray-500"
                      >
                        My Subscriptions
                      </Link>
                      <Link
                        href="/user/profile"
                        className="block px-4 py-2 cursor-pointer transition bg-gray-700 hover:bg-gray-500"
                      >
                        My Profile
                      </Link>
                    </>
                  )}
                  <button
                    onClick={logout}
                    className="block w-full px-4 py-2 cursor-pointer transition bg-red-500 hover:bg-red-300"
                  >
                    Logout
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
        className={`fixed top-0 left-0 h-full max-w-xs w-full bg-smooth-gradient opacity-95 shadow backdrop-blur z-[120] transform transition-transform duration-700 ease-in-out ${
          isOffcanvasOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={toggleOffcanvas}
          className="absolute top-0 right-0 p-2 focus:outline-none cursor-pointer"
          aria-label="Close Menu"
        >
          <i className="w-8 h-8 bi bi-x"></i>
        </button>

        {/* Logo inside Offcanvas */}
        <div className="flex flex-col items-center justify-center lg:my-10 my-0">
          <Link href="/" onClick={toggleOffcanvas}>
            <div className="flex items-center space-x-2">
              <Image src="/images/logo/logo.png" alt="Logo Left" width={50} height={50} priority />
              <h1 className="text-2xl font-bold">Royal TV</h1>
              <Image
                src="/images/logo/logo.png"
                alt="Logo Right"
                width={50}
                height={50}
                className="mirror-image"
              />
            </div>
          </Link>
        </div>

        {/* Offcanvas Links */}
        <div className="flex flex-col items-center mt-10 space-y-4">
          <Link href="/" onClick={toggleOffcanvas}>
            <button className="w-full p-1 m-2 font-bold cursor-pointer transition-all duration-700 min-w-40 rounded-2xl bg-smooth-gradient hover:underline hover:scale-105">
              Home
            </button>
          </Link>
          <Link href="/more-info" onClick={toggleOffcanvas}>
            <button className="w-full p-1 m-2 font-bold cursor-pointer transition-all duration-700 min-w-40 rounded-2xl bg-smooth-gradient hover:underline hover:scale-105">
              More Info
            </button>
          </Link>
          <Link href="/FAQ" onClick={toggleOffcanvas}>
            <button className="w-full p-1 m-2 font-bold cursor-pointer transition-all duration-700 min-w-40 rounded-2xl bg-smooth-gradient hover:underline hover:scale-105">
              FAQ
            </button>
          </Link>
          <hr className="w-8/12 border border-slate-500" />
          {/* Auth Buttons based on user role */}
          {authenticated ? (
            <>
              {user?.role === 'admin' ? (
                <Link href="/admin/dashboard/" onClick={toggleOffcanvas}>
                  <button className="w-full p-1 m-2 font-bold cursor-pointer transition-all duration-700 min-w-40 rounded-2xl bg-smooth-gradient hover:underline hover:scale-105">
                    Admin Dashboard
                  </button>
                </Link>
              ) : user?.role === 'user' ? (
                <Link href="/user/dashboard/" onClick={toggleOffcanvas}>
                  <button className="w-full p-1 m-2 font-bold cursor-pointer transition-all duration-700 min-w-40 rounded-2xl bg-smooth-gradient hover:underline hover:scale-105">
                    User Dashboard
                  </button>
                </Link>
              ) : null}
              <div className="flex w-full items-center justify-center ml-2">
                <button
                  onClick={logout}
                  className="w-1/2 p-1 m-2 font-bold cursor-pointer text-red-500 bg-red-300 transition-all duration-700 transform rounded-full min-w-28 text-outline-dark-1 hover:underline hover:scale-105 hover:text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center w-full text-center">
                <Link
                  href="/auth/signup"
                  onClick={toggleOffcanvas}
                  className="items-center text-center"
                >
                  <button className="w-full p-1 m-2 font-bold cursor-pointer transition-all duration-700 min-w-32 rounded-2xl bg-smooth-gradient hover:underline hover:scale-105">
                    Register
                  </button>
                </Link>
                <Link
                  href="/auth/signin"
                  onClick={toggleOffcanvas}
                  className="items-center text-center"
                >
                  <button className="w-full p-1 m-2 font-bold cursor-pointer transition-all duration-700 transform min-w-32 rounded-2xl bg-smooth-gradient hover:underline hover:scale-105">
                    Login
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
