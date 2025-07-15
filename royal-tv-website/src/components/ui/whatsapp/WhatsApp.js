// For client side usage
'use client';
// Import React
import { React } from 'react';
// Import the logo itself
import { BsWhatsapp } from 'react-icons/bs';

// Export the function directly with the name whatsAppLogo for importing in layout.js
export default function WhatsAppLogo() {
  return (
    <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="">
      <BsWhatsapp className="w-20 h-20 z-[500] fixed bottom-12 right-12 bg-green-500 flex items-center justify-center rounded-full shadow-lg hover:bg-green-600 transition duration-300" />
    </a>
  );
}
