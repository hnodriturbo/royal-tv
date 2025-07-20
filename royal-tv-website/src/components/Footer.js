'use client';

import Link from 'next/link';

const footerButtonClasses =
  'flex items-center justify-center px-3 py-2 rounded-full text-md font-normal transition-all duration-200 ' +
  'hover:bg-gradient-to-br hover:from-gray-200 hover:to-gray-600 hover:text-white hover:scale-105 focus:outline-none';

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-r from-[#6f738f] via-[#55688a] to-[#202534] py-2 px-2 mt-4 z-[400] border-t border-neutral-800">
      <div className="max-w-7xl mx-auto flex md:flex-row flex-col items-start justify-between gap-8">
        {/* Left side: Buttons, left-aligned on desktop, full width on mobile */}
        <div className="w-full md:w-1/2">
          <div className="flex flex-row gap-2 md:items-start items-center md:justify-start justify-center ms-5 whitespace-nowrap">
            <Link href="/more-info" className={footerButtonClasses}>
              <span className="mr-1">💳</span>
              <span>More Info & Buy Now</span>
            </Link>
            <Link href="/faq" className={footerButtonClasses}>
              <span className="mr-1">❓</span>
              <span>FAQ</span>
            </Link>
          </div>
        </div>

        {/* Right side: Telegram only, centered on mobile/desktop */}
        <div className="w-full md:w-1/2">
          <div className="flex flex-row gap-2 items-center justify-center md:justify-center mt-0 md:mt-2">
            <a
              href="https://t.me/RoyalTVAdmin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-blue-500 hover:text-blue-900 transition-all duration-200"
            >
              <i className="bi bi-telegram text-2xl"></i>
              <span className="ml-1 font-bold inline">Telegram</span>
            </a>
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-center text-gray-400">
        © {new Date().getFullYear()} Royal TV. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
