import React from 'react';
import './ConfirmationModal.css';

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{title}</h2>
                <p>{message}</p>
                <div className="modal-actions">
                    <button onClick={onClose} className="modal-button cancel">
                        Não
                    </button>
                    <button onClick={onConfirm} className="modal-button confirm">
                        Sim
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;