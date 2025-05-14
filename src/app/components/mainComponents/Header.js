'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import useAppHandlers from '@/hooks/useAppHandlers'; // ✅ Import the handler
import useLogout from '@/hooks/useLogout';

const Navbar = () => {
  // 🌐 Fetch current session and status clearly from NextAuth
  const { data: session, status } = useSession();

  // ✅ Use global loading handler
  const { showLoader, hideLoader } = useAppHandlers();

  // 🔑 Determine if the user is authenticated clearly
  const authenticated =
    status === 'authenticated' &&
    session?.user?.role &&
    session.user.role !== 'guest';

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
      if (
        isOffcanvasOpen &&
        offcanvasRef.current &&
        !offcanvasRef.current.contains(event.target)
      ) {
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
      <div className="p-1 fixed top-0 w-full z-10 bg-smooth-gradient-dark-5 opacity-95 shadow backdrop-blur max-h-14 h-14 min-h-14">
        <div className="w-full flex items-center justify-between px-4">
          {/* Mobile Menu Button */}
          <div className="me-auto mobile:mt-3">
            <button
              onClick={toggleOffcanvas}
              className="focus:outline-none flex items-center justify-center z-30 cursor-pointer"
              aria-label="Toggle Menu"
            >
              Menu
              <i className="bi bi-list ml-2 h-6 w-8"></i>
            </button>
          </div>

          {/* Center Logo */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2 z-10">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <Image
                  src="/images/logo/logo.png"
                  alt="Logo Left"
                  width={50}
                  height={50}
                  priority
                />
                <h1 className="text-2xl font-bold whitespace-nowrap">
                  Royal TV
                </h1>
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
          <nav className="mobile:hidden pc:flex items-center space-x-4 pr-4 whitespace-nowrap justify-center">
            <Link href="/FAQ">
              <button className="w-full min-w-20 m-2 font-bold p-1 rounded-2xl hover-bg-smooth-gradient hover:underline transform hover:scale-105 transition-all duration-700">
                FAQ !
              </button>
            </Link>
            <Link href="/more-info">
              <button className="w-full min-w-20 m-2 font-bold p-1 rounded-2xl hover-bg-smooth-gradient hover:underline transform hover:scale-105 transition-all duration-700">
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
                  className={`flex items-center justify-between w-full min-w-48 p-2 bg-smooth-gradient font-bold ${
                    dropdownOpen ? 'rounded-t-xl' : 'rounded-xl'
                  } transition-all duration-300`}
                >
                  <i
                    className={`bi ${user?.role === 'admin' ? 'bi-person-badge-fill' : 'bi-person-fill'}`}
                  ></i>
                  <span>
                    {user?.role === 'admin' ? 'Admin Actions' : 'User Actions'}
                  </span>
                  <i className="bi bi-chevron-down"></i>
                </button>

                {/* Dropdown Menu */}

                <div
                  className={`absolute top-full left-0 w-full bg-smooth-gradient shadow-lg ${
                    dropdownOpen
                      ? 'rounded-b-xl h-auto opacity-100'
                      : 'h-0 opacity-0'
                  } overflow-hidden transition-all duration-300`}
                >
                  {user?.role === 'admin' ? (
                    <>
                      <Link
                        href="/admin/dashboard/"
                        className="block px-4 py-2 bg-gray-700 hover:bg-gray-500 transition"
                      >
                        Show Dashboard
                      </Link>
                      <Link
                        href="/admin/users/main"
                        className="block px-4 py-2 bg-gray-700 hover:bg-gray-500 transition"
                      >
                        Show Users
                      </Link>
                      <Link
                        href="/admin/subscriptions"
                        className="block px-4 py-2 bg-gray-700 hover:bg-gray-500 transition"
                      >
                        Show Subscriptions
                      </Link>
                      <Link
                        href="/admin/profile"
                        className="block px-4 py-2 bg-gray-700 hover:bg-gray-500 transition"
                      >
                        My Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/user/dashboard"
                        className="block px-4 py-2 bg-gray-700 hover:bg-gray-500 transition"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/user/liveChat/main"
                        className="block px-4 py-2 bg-gray-700 hover:bg-gray-500 transition"
                      >
                        My LiveChat Conv.
                      </Link>
                      <Link
                        href="/user/subscriptions"
                        className="block px-4 py-2 bg-gray-700 hover:bg-gray-500 transition"
                      >
                        My Subscriptions
                      </Link>
                      <Link
                        href="/user/profile"
                        className="block px-4 py-2 bg-gray-700 hover:bg-gray-500 transition"
                      >
                        My Profile
                      </Link>
                    </>
                  )}
                  <button
                    onClick={logout}
                    className="block px-4 py-2 bg-red-500 hover:bg-red-300 transition w-full"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link href="/auth/signup">
                  <button className="w-full min-w-20 m-2 font-bold p-1 rounded-2xl hover-bg-smooth-gradient hover:underline transform hover:scale-105 transition-all duration-700">
                    Register
                  </button>
                </Link>
                <Link href="/auth/signin">
                  <button className="w-full min-w-20 m-2 font-bold p-1 rounded-2xl hover-bg-smooth-gradient hover:underline hover:opacity-100 transform hover:scale-105 transition-all duration-700">
                    Login
                  </button>
                </Link>
              </>
            )}
            {/* 
            {isAdmin ? (
              <UnreadBadge value={unreadAdmin}>
                <Link href="/user/liveChat/main"></Link>
              </UnreadBadge>
            ) : (
              <UnreadBadge value={unread}>
                <Link href="/admin/liveChat/main"></Link>
              </UnreadBadge>
            )}
             */}
          </nav>
        </div>
      </div>

      {/* Offcanvas Menu (Mobile) */}
      <div
        ref={offcanvasRef}
        className={`fixed top-0 left-0 h-full max-w-xs w-full bg-smooth-gradient-dark-5 opacity-100 shadow backdrop-blur z-20 transform transition-transform duration-700 ease-in-out ${
          isOffcanvasOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={toggleOffcanvas}
          className="absolute top-0 right-0 p-2 focus:outline-none"
          aria-label="Close Menu"
        >
          <i className="bi bi-x h-8 w-8"></i>
        </button>

        {/* Logo inside Offcanvas */}
        <div className="flex items-center justify-center flex-col pc:my-10 mobile:my-0">
          <Link href="/" onClick={toggleOffcanvas}>
            <div className="flex items-center space-x-2">
              <Image
                src="/images/logo/logo.png"
                alt="Logo Left"
                width={50}
                height={50}
                priority
              />
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
        <div className="mt-10 flex flex-col items-center space-y-4">
          <Link href="/" onClick={toggleOffcanvas}>
            <button className="w-full min-w-40 m-2 font-bold p-1 rounded-2xl bg-smooth-gradient hover:underline  hover:scale-105 transition-all duration-700">
              Home
            </button>
          </Link>
          <Link href="/more-info" onClick={toggleOffcanvas}>
            <button className="w-full min-w-40 m-2 font-bold p-1 rounded-2xl bg-smooth-gradient hover:underline  hover:scale-105 transition-all duration-700">
              More Info
            </button>
          </Link>
          <Link href="/FAQ" onClick={toggleOffcanvas}>
            <button className="w-full min-w-40 m-2 font-bold p-1 rounded-2xl bg-smooth-gradient hover:underline  hover:scale-105 transition-all duration-700">
              FAQ
            </button>
          </Link>
          <hr className="border border-slate-500 w-8/12" />
          {/* Auth Buttons based on user role */}
          {authenticated ? (
            <>
              {user?.role === 'admin' ? (
                <Link href="/admin/dashboard/" onClick={toggleOffcanvas}>
                  <button className="w-full min-w-40 m-2 font-bold p-1 rounded-2xl bg-smooth-gradient hover:underline  hover:scale-105 transition-all duration-700">
                    Admin Dashboard
                  </button>
                </Link>
              ) : user?.role === 'user' ? (
                <Link href="/user/dashboard/" onClick={toggleOffcanvas}>
                  <button className="w-full min-w-40 m-2 font-bold p-1 rounded-2xl bg-smooth-gradient hover:underline  hover:scale-105 transition-all duration-700">
                    User Dashboard
                  </button>
                </Link>
              ) : null}
              <button
                onClick={logout}
                className="w-full min-w-28 m-2 text-outline-dark-1 text-red-500 font-bold p-1 rounded-full hover:underline transform hover:scale-105 hover:text-decorative-1 transition-all duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center text-center w-full">
                <Link
                  href="/auth/signup"
                  onClick={toggleOffcanvas}
                  className="items-center text-center"
                >
                  <button className="w-full min-w-32 m-2 font-bold p-1 rounded-2xl bg-smooth-gradient hover:underline  hover:scale-105 transition-all duration-700">
                    Register
                  </button>
                </Link>
                <Link
                  href="/auth/signin"
                  onClick={toggleOffcanvas}
                  className="items-center text-center"
                >
                  <button className="w-full min-w-32 m-2 font-bold p-1 rounded-2xl bg-smooth-gradient hover:underline transform hover:scale-105 transition-all duration-700">
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
