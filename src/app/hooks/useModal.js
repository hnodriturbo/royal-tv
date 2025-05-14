'use client';

/*
 * useModal.js
 * Custom hook to access the ModalContext.
 * Provides modal state and handlers (openModal, hideModal, etc.) to any component.
 */

import { useContext } from 'react';
import { ModalContext } from '@/context/ModalContext';

const useModal = () => {
  // Retrieve modal context using useContext
  const context = useContext(ModalContext);
  if (!context) {
    // Throw an error if the hook is used outside a ModalProvider
    throw new Error('useModal must be used within a ModalProvider');
  }
  // Return the modal context values:
  // modalOpen, modalType, modalProps, openModal, hideModal, etc.
  return context;
};

export default useModal;
