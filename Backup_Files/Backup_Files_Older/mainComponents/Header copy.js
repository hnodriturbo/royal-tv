'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import useLogout from '@components/logout/Logout';
import useLoaderHandler from '@hooks/useLoaderHook';

const Navbar = () => {
  const logout = useLogout();
  // Track the state of the dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false); // Dropdown state

  // Use the isLoading for the logout button
  const { isLoading } = useLoaderHandler();

  // States for managing the offcanvas and it's opening and closing and closing on click outside
  const [isOffcanvasOpen, setOffcanvasOpen] = useState(false);
  const offcanvasRef = useRef(null);

  const { data: session, status } = useSession();
  const user = session?.user;

  const toggleOffcanvas = () => {
    setOffcanvasOpen(!isOffcanvasOpen);
  };

  useEffect(() => {
    if (isOffcanvasOpen && offcanvasRef.current) {
      offcanvasRef.current.focus();
    }
  }, [isOffcanvasOpen]);

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
      <div className="p-1 fixed top-0 w-full z-10 bg-smooth-gradient-dark-5 opacity-90 shadow backdrop-blur max-h-14 h-14 min-h-14">
        <div className="w-full flex items-center justify-between px-4">
          <div className="me-auto mobile:mt-2">
            <button
              onClick={toggleOffcanvas}
              className="focus:outline-none flex items-center justify-center z-30 cursor-pointer"
              aria-label="Toggle Menu"
            >
              Menu
              <i className="bi bi-list ml-2 h-8 w-8"></i>
            </button>
          </div>

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

          <nav className="mobile:hidden pc:flex items-center space-x-4 pr-4 whitespace-nowrap justify-center">
            <Link href="/transaction">
              <button className="w-full min-w-[5rem] m-2 font-bold p-1 rounded-2xl hover-bg-smooth-gradient hover:underline transform hover:scale-105 transition-all duration-700">
                Buy Now!
              </button>
            </Link>
            <Link href="/contact">
              <button className="w-full min-w-[5rem] m-2 font-bold p-1 rounded-2xl hover-bg-smooth-gradient hover:underline transform hover:scale-105 transition-all duration-700">
                Free Trial!
              </button>
            </Link>
            {status === 'authenticated' && user ? (
              <div
                className="relative group"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                {/* Dropdown Button */}
                <button
                  className={`flex items-center justify-between w-full min-w-[12rem] p-2 bg-smooth-gradient font-bold ${
                    dropdownOpen ? 'rounded-t-xl' : 'rounded-xl'
                  } transition-all duration-300`}
                >
                  <i
                    className={`bi ${
                      user?.role === 'admin'
                        ? 'bi-person-badge-fill'
                        : 'bi-person-fill'
                    }`}
                  ></i>
                  <span>
                    {session?.user?.role === 'admin'
                      ? 'Admin Actions'
                      : 'User Actions'}
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
                  {user?.role === 'admin' && status === 'authenticated' ? (
                    <>
                      {/* Admin Menu */}
                      <Link
                        href="/dashboard/admin/main"
                        className="block px-4 py-2 hover:bg-gray-200 hover:text-black transition"
                      >
                        Show Dashboard
                      </Link>
                      <Link
                        href="/dashboard/admin/users"
                        className="block px-4 py-2 hover:bg-gray-200 hover:text-black transition"
                      >
                        Show Users
                      </Link>
                      <Link
                        href="/dashboard/admin/orders"
                        className="block px-4 py-2 hover:bg-gray-200 hover:text-black transition"
                      >
                        Show Orders
                      </Link>
                      <Link
                        href="/dashboard/admin/liveChat"
                        className="block px-4 py-2 hover:bg-gray-200 hover:text-black transition"
                      >
                        Live Chat Conversations
                      </Link>
                      <Link
                        href="/dashboard/admin/settings"
                        className="block px-4 py-2 hover:bg-gray-200 hover:text-black transition"
                      >
                        Settings
                      </Link>
                      <Link
                        href="/dashboard/admin/profile"
                        className="block px-4 py-2 hover:bg-gray-200 hover:text-black transition"
                      >
                        My Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      {/* User Menu */}
                      <Link
                        href="/dashboard/user/main"
                        className="block px-4 py-2 hover:bg-gray-200 hover:text-black transition"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/user/profile"
                        className="block px-4 py-2 hover:bg-gray-200 hover:text-black transition"
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/dashboard/user/converzsations"
                        className="block px-4 py-2 hover:bg-gray-200 hover:text-black transition"
                      >
                        My Conversations
                      </Link>
                      <Link
                        href="/dashboard/user/subscriptions"
                        className="block px-4 py-2 hover:bg-gray-200 hover:text-black transition"
                      >
                        My Subscriptions
                      </Link>
                    </>
                  )}
                  <button
                    onClick={logout}
                    disabled={isLoading} // Disable button while loading
                    className={`block w-full text-left px-4 py-2 transition ${
                      isLoading
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'hover:bg-gray-200 hover:text-black'
                    }`}
                  >
                    {isLoading ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/auth/signin">
                <button className="w-full min-w-[5rem] m-2 font-bold p-1 rounded-2xl bg-smooth-gradient hover:underline transform transition-all duration-700">
                  Login
                </button>
              </Link>
            )}
          </nav>
        </div>
      </div>

      <div
        ref={offcanvasRef}
        className={`fixed top-0 left-0 h-full max-w-xs w-full gradient-dark-light-5 z-20 transform transition-transform duration-700 ease-in-out ${
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
        {/* <br /> */}

        <div className="flex items-center justify-center flex-col pc:my-10 mobile:my-0">
          <Link href="/">
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

        <div className="mt-10 flex flex-col items-center space-y-4">
          <Link href="/" onClick={toggleOffcanvas}>
            <button className="w-full min-w-[13rem] m-2 bg-gray-400 font-bold rounded-full p-2 hover:bg-cyan-950 transition duration-300">
              Home
            </button>
          </Link>
          <Link href="/transaction" onClick={toggleOffcanvas}>
            <button className="w-full min-w-[13rem] m-2 bg-gray-400 font-bold rounded-full py-1 hover:bg-gray-800 transition duration-300">
              Buy Now
            </button>
          </Link>
          <Link href="/contact" onClick={toggleOffcanvas}>
            <button className="w-full min-w-[13rem] m-2 bg-gray-400 font-bold rounded-full py-1 hover:bg-gray-800 transition duration-300">
              Free Trial
            </button>
          </Link>
          <hr className="border border-slate-500 w-8/12 text-center items-center justify-center" />
          {/* ----------------------------------------------------------------------------------------------------- */}
          {/* HERE STARTS THE MASTER DIV AND SHOWS THE LOGIN BUTTON IF NO ONE IS LOGGED IN, OTHERWISE SHOWS BUTTONS */}
          {/* ----------------------------------------------------------------------------------------------------- */}
          <div>
            {authenticated ? (
                    <button
                      onClick={logout}
                      disabled={isLoading}
                      className={`bg-red-500 px-4 py-2 rounded hover:bg-red-600 transition ${
                        isLoading
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {isLoading ? 'Logging out...' : 'Logout'}
                    </button>
            ) : (
              <Link href="/auth/signin">
                <button className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 transition">
                  Login
                </button>
              </Link>
            )}


                </div>
              </>
         
          </div>
        
      </div>
    </>
  );
};

export default Navbar;
