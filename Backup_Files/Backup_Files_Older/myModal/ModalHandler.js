'use client';

/*
 * ModalHandler.js
 * A global component to handle modals dynamically based on the modal state.
 */

import React from 'react';
import { useModal } from '@context/ModalContext';

const ModalHandler = () => {
  const { modalState, closeModal } = useModal();

  if (!modalState.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-96 max-w-lg">
        <h2 className="text-xl font-semibold mb-4">
          {modalState.type === 'edit' ? 'Edit Item' : 'Delete Item'}
        </h2>
        <p>{modalState.data?.message || 'Are you sure?'}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={closeModal}
            className="py-2 px-4 bg-gray-300 rounded"
          >
            Cancel
          </button>
          <button className="py-2 px-4 bg-red-600 text-white rounded">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalHandler;

/*
 * Key Features:
 * - Dynamically adjusts the content and actions based on modal type and data.
 * - Styled for a consistent modal appearance.
 */
