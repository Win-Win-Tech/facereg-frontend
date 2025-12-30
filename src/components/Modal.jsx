import React from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

const Modal = ({ title, children, onClose, actions, fullScreen = false }) => {
  const modalContent = (
    <div className={`modal-backdrop ${fullScreen ? 'modal-fullscreen' : ''}`} role="dialog" aria-modal="true">
      <div className={`modal-window ${fullScreen ? 'modal-window-fullscreen' : ''}`}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-footer">{actions}</div>}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
