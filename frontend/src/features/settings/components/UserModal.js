import React, { useState, useEffect } from 'react';
import '../SettingsPage.css'; 

function UserModal({ isOpen, onClose, userToEdit, onSave }) {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        tipo: 'vendedor'
    });

    useEffect(() => {
        if (userToEdit) {
            setFormData({ 
                nome: userToEdit.nome, 
                email: userToEdit.email, 
                tipo: userToEdit.tipo, 
                senha: '' 
            });
        } else {
            setFormData({ nome: '', email: '', senha: '', tipo: 'vendedor' });
        }
    }, [userToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="config-content" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
                <h2 style={{marginTop: 0, fontSize: '1.25rem'}}>{userToEdit ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                
                <form onSubmit={handleSubmit} className="config-form">
                    <div className="form-group">
                        <label>Nome</label>
                        <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} required />
                    </div>
                    
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    </div>

                    <div className="form-group">
                        <label>Tipo de Permissão</label>
                        <select value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})}>
                            <option value="admin">Administrador</option>
                            <option value="vendedor">Vendedor</option>
                            <option value="estoquista">Estoquista</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Senha {userToEdit && <small>(Deixe em branco para não alterar)</small>}</label>
                        <input type="password" value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})} required={!userToEdit} placeholder={userToEdit ? "********" : ""} />
                    </div>

                    <div className="form-actions" style={{justifyContent: 'flex-end'}}>
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UserModal;