'use client';

import React, { createContext, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useTranslations } from 'next-intl';
import { SafeString } from '@/lib/ui/SafeString';

// Create the ModalContext to provide modal functionality globally.
const ModalContext = createContext();

// ModalProvider holds modal state and handlers, and renders the modal via a portal.
export const ModalProvider = ({ children }) => {
  if (!children) throw new Error('ModalProvider must wrap components.');
  const t = useTranslations(); // 🗣️ translate button fallbacks
  // Controls if the modal is rendered.
  const [modalOpen, setModalOpen] = useState(false);
  // Controls the CSS transition for a smooth appearance/disappearance.
  const [isVisible, setIsVisible] = useState(false);
  // Stores additional modal configuration (type, title, content, etc.).
  const [modalType, setModalType] = useState(null);
  const [modalProps, setModalProps] = useState({});

  // 🟢 Color class mapping
  const confirmButtonTypeToClass = {
    Danger: 'btn-danger',
    Success: 'btn-success',
    Purple: 'bg-purple-600 hover:bg-purple-800',
    Info: 'btn-info',
    Secondary: 'btn-secondary w-1/4'
  };
  // 🟢 Modal size mapping (extend as needed)
  const modalSizeToClass = {
    sm: 'max-w-sm',
    md: 'max-w-md', // default
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };
  // 🟢 Text color mapping (optional, can add more)
  const modalTextToClass = {
    default: 'text-base-600',
    error: 'text-red-600',
    info: 'text-blue-300',
    success: 'text-green-600',
    white: 'text-white'
  };
  // openModal: sets modal options and shows the modal with a transition.
  const openModal = useCallback((type, props = {}) => {
    setModalType(type);
    setModalProps(props);
    setModalOpen(true);
    // Use a slight delay to trigger the CSS transition.
    setTimeout(() => {
      setIsVisible(true);
    }, 300);
  }, []);

  // hideModal: triggers the closing transition and then unmounts the modal.
  const hideModal = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setModalOpen(false);
      setModalType(null);
      setModalProps({});
    }, 300); // Transition duration
  }, []);

  return (
    <ModalContext.Provider value={{ modalOpen, modalType, modalProps, openModal, hideModal }}>
      {children}
      {modalOpen &&
        ReactDOM.createPortal(
          <div
            className="fixed lg:ml-64 inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ease-out"
            style={{ opacity: isVisible ? 1 : 0 }}
          >
            {/* Backdrop: clicking it hides the modal */}
            <div className="absolute inset-0 bg-black opacity-50" onClick={hideModal}></div>
            {/* Modal container with container-style and transitions */}
            <div
              className={`
                relative p-6 rounded shadow-lg z-10 w-full
                ${modalSizeToClass[modalProps.size || 'lg']}   
                ${modalTextToClass[modalProps.textClass || 'default']}   
                ${modalProps.customClass || ''}              
                container-style border-none
                transition-all duration-300 ease-out transform
                ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
              `}
            >
              {/* Close "X" button */}
              <button className="absolute top-2 right-2 text-xl font-bold" onClick={hideModal}>
                ❌
              </button>
              {/* Title (if provided) */}
              {modalProps.title && <h2 className="text-2xl font-bold mb-4">{modalProps.title}</h2>}
              {/* Description (if provided) */}
              {modalProps.description && <p className="mb-4">{modalProps.description}</p>}
              {/* Render custom content: if it's a function, call it; otherwise, render as-is */}
              {typeof modalProps.customContent === 'function'
                ? modalProps.customContent()
                : modalProps.customContent || <div>{/* Default content */}</div>}
              {/* Action buttons */}
              <div className="flex justify-end space-x-2 mt-4">
                {modalProps.cancelButtonText && (
                  <button
                    type="button"
                    onClick={() => {
                      modalProps.onCancel?.();
                      hideModal();
                    }}
                    className="btn-secondary"
                  >
                    <span>
                      {SafeString(modalProps.cancelButtonText ?? t('common.buttons.cancel'), '')}
                    </span>
                  </button>
                )}

                {modalProps.confirmButtonText && (
                  <button
                    className={`px-4 py-2 rounded text-white font-bold transition-all duration-200
                      ${
                        modalProps.confirmButtonClass
                          ? modalProps.confirmButtonClass
                          : confirmButtonTypeToClass[modalProps.confirmButtonType || 'Info']
                      }
                    `}
                    onClick={() => {
                      if (modalProps.onConfirm) modalProps.onConfirm(); // ✅ Handle confirm
                      hideModal(); // ✅ Close the modal
                    }}
                  >
                    <span>
                      {SafeString(modalProps.confirmButtonText ?? t('common.buttons.confirm'), '')}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </ModalContext.Provider>
  );
};

export { ModalContext };
