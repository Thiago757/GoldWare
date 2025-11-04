import React from 'react';
import './ImagemModal.css';

function ImageModal({ isOpen, imageUrl, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="image-modal-overlay" onClick={onClose}>
            <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="image-modal-close-btn" onClick={onClose}>
                    &times;
                </button>
                <img src={imageUrl} alt="Imagem do Produto" />
            </div>
        </div>
    );
}

export default ImageModal;