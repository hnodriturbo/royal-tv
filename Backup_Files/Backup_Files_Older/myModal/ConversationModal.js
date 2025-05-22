'use client';

import React from 'react';
import PropTypes from 'prop-types';
import { useEffect } from 'react';

const ConversationsModal = ({
  isOpen,
  modalType,
  title,
  text,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  closeText = 'Cancel',
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      aria-hidden={!isOpen}
      aria-modal="true"
    >
      <div
        className="container-style p-6 rounded-lg shadow-lg w-11/12 sm:w-96 max-w-lg transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <p className="mb-4">{text}</p>
        {children && <div className="mb-6">{children}</div>}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          >
            {closeText}
          </button>
          {onConfirm && (
            <button
              onClick={onConfirm}
              className={`py-2 px-4 ${
                modalType === 'delete'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white rounded-lg transition`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

useEffect(() => {
  if (typeof window !== 'undefined' && isOpen) {
    document.body.style.overflow = 'hidden';
  } else if (typeof window !== 'undefined') {
    document.body.style.overflow = '';
  }
  return () => {
    if (typeof window !== 'undefined') {
      document.body.style.overflow = '';
    }
  };
}, [isOpen]);

// Conversation Modal Prop Types
ConversationsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  modalType: PropTypes.string,
  title: PropTypes.string.isRequired,
  text: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  confirmText: PropTypes.string,
  closeText: PropTypes.string,
  children: PropTypes.node,
};

export default ConversationsModal;
