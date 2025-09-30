import React, { useState, useEffect } from 'react';

const initialState = {
    nome: '',
    descricao: '',
    preco_base: '',
    prazo_estimado: '',
    id_tipo_servico: '',
    ativo: 'S'
};

function ServicoModal({ isOpen, onClose, onSave, servicoEmEdicao, tiposDeServico }) {
    const [formData, setFormData] = useState(initialState);

    useEffect(() => {
        if (isOpen) {
            if (servicoEmEdicao) {
                setFormData({
                    ...initialState, // Garante que todos os campos existam
                    ...servicoEmEdicao,
                    id_tipo_servico: servicoEmEdicao.id_tipo_servico || '' // Garante que não seja nulo
                });
            } else {
                setFormData(initialState);
            }
        }
    }, [servicoEmEdicao, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.nome || !formData.preco_base) {
            alert('Nome e Preço Base são obrigatórios.');
            return;
        }
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>{servicoEmEdicao ? 'Editar Serviço' : 'Novo Serviço'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="nome">Nome do Serviço</label>
                        <input id="nome" name="nome" type="text" value={formData.nome} onChange={handleChange} required />
                    </div>

                    {/* ESTE É O DROPDOWN QUE USA OS TIPOS DE SERVIÇO */}
                    <div className="form-group">
                        <label htmlFor="id_tipo_servico">Tipo de Serviço</label>
                        <select id="id_tipo_servico" name="id_tipo_servico" value={formData.id_tipo_servico} onChange={handleChange}>
                            <option value="">Selecione um tipo...</option>
                            {tiposDeServico.map(tipo => (
                                <option key={tipo.id_tipo_servico} value={tipo.id_tipo_servico}>
                                    {tipo.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="descricao">Descrição</label>
                        <textarea id="descricao" name="descricao" value={formData.descricao} onChange={handleChange}></textarea>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="preco_base">Preço Base (R$)</label>
                            <input id="preco_base" name="preco_base" type="number" step="0.01" value={formData.preco_base} onChange={handleChange} required />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="prazo_estimado">Prazo Estimado (dias)</label>
                            <input id="prazo_estimado" name="prazo_estimado" type="number" value={formData.prazo_estimado} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="modal-button cancel">Cancelar</button>
                        <button type="submit" className="modal-button confirm">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ServicoModal;