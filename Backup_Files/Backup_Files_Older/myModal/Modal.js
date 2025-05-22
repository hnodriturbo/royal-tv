'use client';

import React from 'react';

const Modal = ({
  isOpen,
  title,
  text,
  onClose,
  onConfirm,
  confirmText,
  closeText,
}) => {
  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 ${
        isOpen
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-95 pointer-events-none'
      } transition-all duration-300`}
    >
      <div
        className="container-style p-6 rounded-lg shadow-lg w-11/12 sm:w-96 max-w-lg transform transition-all"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <p className="mb-6">{text}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onConfirm}
            className="py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          >
            {closeText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
