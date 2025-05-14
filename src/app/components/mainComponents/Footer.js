// use the client-side JavaScript
'use client';

import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bottom-0 w-full gradient-light-dark-2 py-6 px-10 uppercase font-bold mt-4 z-30">
      <div className="flex justify-between items-center h-50">
        {/* Left: First Set of Links */}
        <div className="w-full md:w-1/3 flex flex-col items-center mb-4">
          <ul className="list-none space-y-1 text-center gap-8">
            <li className="flex h-full justify-between">
              <div className="flex flex-col items-center">
                <Link
                  href="/pages/contact"
                  className="bg-smooth-gradient-dark-1 btn-dark-style font-bold rounded-xl underline hover:scale-105 transform transition-all duration-300"
                >
                  Send Us Message !
                </Link>
              </div>
            </li>
            <li>
              <div className="flex flex-col items-center justify-center">
                <Link
                  href="/pages/transaction"
                  className="bg-smooth-gradient-dark-1  btn-dark-style font-bold underline hover:scale-105 transform transition-all duration-300"
                >
                  Buy Now !
                </Link>
              </div>
            </li>
          </ul>
        </div>

        {/* Right: Social Media Links */}
        <div className="w-full md:w-1/3 text-center flex-col items-center whitespace-nowrap">
          <div className="flex flex-row md:flex-col items-center">
            {/* WhatsApp Link */}
            <a
              href="https://wa.me/3547624845"
              target="_blank"
              rel="noopener noreferrer"
              className="mx-2 text-green-500 hover:text-green-900 hover:font-bold hover:underline transition-all duration-300"
            >
              <i className="bi bi-whatsapp text-3xl mx-3"></i>
              <br />

              <span className="inline md:hidden">Contact Us On WhatsApp</span>
              <span className="hidden md:inline">WhatsApp</span>
            </a>

            {/* Telegram Admin Link */}
            <a
              href="https://t.me/RoyalTVAdmin"
              target="_blank"
              rel="noopener noreferrer"
              className="mx-2 text-blue-500 hover:text-blue-900 hover:font-bold hover:underline transition-all duration-300"
            >
              <i className="bi bi-telegram text-3xl mx-3"></i>
              <br />
              <span className="inline md:hidden">Contact Us On Telegram</span>
              <span className="hidden md:inline">Telegram</span>
            </a>
          </div>
        </div>

        {/* Center: Second Set of Links */}
        <div className="w-full md:w-1/3 flex flex-col items-center mb-4">
          <ul className="list-none space-y-1 text-center">
            <li>
              <Link
                href="/pages/faq"
                className="m-2 font-bold p-6 hover:bg-cyan-950 hover:rounded-[25px] hover:underline hover:scale-105 transform transition-all duration-300"
              >
                FAQ
              </Link>
            </li>
            <li>
              <Link
                href="/pages/about"
                className="m-2 font-bold p-6 hover:bg-cyan-950 hover:rounded-[25px] hover:underline hover:scale-105 transform transition-all duration-300"
              >
                About Us
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
