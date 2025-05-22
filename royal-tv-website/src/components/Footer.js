// use the client-side JavaScript
'use client';

import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bottom-0 w-full gradient-dark-light-5 py-6 px-10 uppercase font-bold mt-4 z-30">
      <div className="flex justify-between items-center h-30">
        {/* Left: First Set of Links */}
        <div className="w-full md:w-1/3 flex flex-col items-center mb-4">
          <ul className="list-none space-y-4 text-center">
            <li>
              <Link
                href="/pages/contact"
                className="gradient-dark-light-5 py-1 px-4 border font-bold rounded-[25px] underline:hover hover:scale-105 transform transition-all duration-300"
              >
                Send Us Message !
              </Link>
            </li>
            <li>
              <Link
                href="/pages/transaction"
                className="gradient-dark-light-5 py-1 px-4 border font-bold rounded-[25px] underline:hover hover:scale-105 transform transition-all duration-300"
              >
                Buy Now !
              </Link>
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
          <ul className="list-none space-y-3 text-center">
            <li>
              <Link
                href="/pages/faq"
                className="gradient-dark-light-5 py-1 px-4 border font-bold rounded-[25px] underline:hover hover:scale-105 transform transition-all duration-300"
              >
                FAQ
              </Link>
            </li>
            <li>
              <Link
                href="/pages/about"
                className="gradient-dark-light-5 py-1 px-4 border font-bold rounded-[25px] underline:hover hover:scale-105 transform transition-all duration-300"
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
