'use client';

import { useModal } from '@/hooks/useModal';

const GlobalModal = () => {
  const { isOpen, modalType, modalProps, closeModal } = useModal();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="container-style p-6 rounded-lg shadow-lg w-11/12 sm:w-96 max-w-lg">
        <h2 className="text-xl font-semibold mb-4">
          {modalProps.title || 'Are you sure?'}
        </h2>

        {/* Edit Message Modal */}
        {modalType === 'editMessage' && (
          <textarea
            className="w-full p-2 border rounded-lg"
            value={modalProps.message || ''}
            onChange={modalProps.onChange}
          />
        )}

        {/* Confirmation Modal */}
        {modalType.includes('delete') && (
          <p className="text-center text-gray-700">
            {modalProps.message || 'Are you sure you want to proceed?'}
          </p>
        )}

        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={closeModal}
            className="py-2 px-4 bg-gray-300 rounded"
          >
            {modalProps.cancelText || 'Cancel'}
          </button>

          {(modalType === 'editMessage' || modalType.includes('delete')) && (
            <button
              onClick={modalProps.onConfirm}
              className={`py-2 px-4 ${
                modalType.includes('delete') ? 'bg-red-600' : 'bg-blue-600'
              } text-white rounded`}
            >
              {modalProps.confirmText ||
                (modalType.includes('delete') ? 'Delete' : 'Save')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalModal;
