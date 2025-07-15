// For client side usage
'use client';
// Import React
import { React } from 'react';

// Export the function directly with the name whatsAppLogo for importing in layout.js
export default function WhatsAppLogo() {
  return (
    <a href="https://wa.me/3547624845" target="_blank" rel="noopener noreferrer" className="">
      <i className="bi-whatsapp w-16 h-16 text-4xl z-[500] fixed bottom-6 right-6 bg-green-500 flex items-center justify-center rounded-full shadow-lg hover:bg-green-700 transition duration-300"></i>
    </a>
  );
}
