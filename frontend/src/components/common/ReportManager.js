import React, { useState, useEffect } from 'react';
import { useReports } from '../../context/ReportProvider';
import { Search, Star, X, File, FileText, FileSpreadsheet, ChevronsLeft, ChevronsRight } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001';

const relatoriosConfig = [
    { id: 'vendas_periodo', titulo: 'Vendas por Período', endpoint: '/api/relatorios/vendas-periodo', formatos: ['pdf', 'excel'], tags: ['Vendas', 'Financeiro'], parametros: [{ name: 'dataInicial', label: 'Data Inicial', type: 'date', required: true }, { name: 'dataFinal', label: 'Data Final', type: 'date', required: true }, { name: 'vendedorId', label: 'Vendedor (Opcional)', type: 'text', placeholder: 'Nome ou ID do vendedor' }] },
    { id: 'ranking_joias_vendidas', titulo: 'Ranking de Joias Mais Vendidas', endpoint: '/api/relatorios/ranking-joias', formatos: ['pdf', 'excel'], tags: ['Vendas', 'Estoque'], parametros: [{ name: 'dataInicial', label: 'Data Inicial', type: 'date', required: true }, { name: 'dataFinal', label: 'Data Final', type: 'date', required: true }, {name: 'tipoJoia', label: 'Categoria'}] },
    { id: 'comissoes_vendedores', titulo: 'Comissões de Vendedores', endpoint: '/api/relatorios/comissoes', formatos: ['excel'], tags: ['Vendas', 'Financeiro'], parametros: [{ name: 'mes', label: 'Mês de Referência', type: 'month', required: true }] },
    { id: 'inventario_valorizado', titulo: 'Inventário Atual (Valorizado)', endpoint: '/api/relatorios/inventario', formatos: ['excel'], tags: ['Estoque', 'Financeiro'], parametros: [{ name: 'material', label: 'Material Principal', type: 'select', options: ['Todos', 'Ouro 18k', 'Prata 925', 'Outros'] }, { name: 'fornecedor', label: 'Fornecedor (Opcional)', type: 'text' }] },
    { id: 'estoque_baixo', titulo: 'Relatório de Estoque Baixo', endpoint: '/api/relatorios/estoque-baixo', formatos: ['excel'], tags: ['Estoque', 'Compras'], parametros: [{ name: 'limite', label: 'Quantidade máxima em estoque', type: 'number', defaultValue: 5, required: true }] },
    { id: 'contas_receber', titulo: 'Contas a Receber (Clientes)', endpoint: '/api/relatorios/contas-receber', formatos: ['pdf', 'excel'], tags: ['Financeiro', 'Clientes'], parametros: [{ name: 'status', label: 'Status', type: 'select', options: ['Todas', 'Em Aberto', 'Vencidas'] }] },
    { id: 'contas_pagar', titulo: 'Contas a Pagar (Fornecedores)', endpoint: '/api/relatorios/contas-pagar', formatos: ['pdf', 'excel'], tags: ['Financeiro', 'Compras'], parametros: [{ name: 'status', label: 'Status', type: 'select', options: ['Todas', 'A Pagar', 'Vencidas', 'Pagas'] }, { name: 'fornecedor', label: 'Fornecedor (Opcional)', type: 'text' }] },
    { id: 'fluxo_caixa', titulo: 'Relatório de Fluxo de Caixa', endpoint: '/api/relatorios/fluxo-caixa', formatos: ['excel'], tags: ['Financeiro'], parametros: [{ name: 'dataInicial', label: 'Data Inicial', type: 'date', required: true }, { name: 'dataFinal', label: 'Data Final', type: 'date', required: true }] }
];

const ParamsModal = ({ report, onClose, onExecute }) => {
    const [params, setParams] = useState(() => {
        const initialState = {};
        report.parametros.forEach(p => { initialState[p.name] = p.defaultValue ?? ''; });
        return initialState;
    });
    const [format, setFormat] = useState(report.formatos[0]);
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setParams(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onExecute(params, format);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start z-50 p-4 pt-10 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl transform transition-all">
                <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
                    <h3 className="text-xl font-semibold text-gray-800">Executando: {report.titulo}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-h-[70vh] overflow-y-auto">
                        {report.parametros.length === 0 && <p className="text-sm text-gray-500 col-span-2">Este relatório não requer parâmetros.</p>}
                        {report.parametros.map(param => (
                            <div key={param.name} className="md:col-span-2">
                                <label htmlFor={param.name} className="block text-sm font-medium text-gray-700 mb-1">{param.label} {param.required && <span className="text-red-500">*</span>}</label>
                                {param.type === 'select' ? (
                                    <select id={param.name} name={param.name} value={params[param.name]} onChange={handleInputChange} required={param.required} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                        <option value="">Selecione</option>
                                        {param.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                ) : (
                                    <input type={param.type} id={param.name} name={param.name} value={params[param.name]} onChange={handleInputChange} placeholder={param.placeholder} required={param.required} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                                )}
                            </div>
                        ))}
                    </div>
                     <div className="p-6 border-t">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Saída</label>
                        <div className="flex items-center space-x-4">
                            {report.formatos.map(f => (
                                <label key={f} className="flex items-center cursor-pointer">
                                    <input type="radio" name="format" value={f} checked={format === f} onChange={() => setFormat(f)} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"/>
                                    <span className="ml-2 text-sm text-gray-700 capitalize flex items-center">
                                        {f === 'pdf' ? <FileText size={16} className="mr-1 text-red-500"/> : <FileSpreadsheet size={16} className="mr-1 text-green-600"/>} {f}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 flex justify-end gap-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="bg-white hover:bg-gray-100 text-gray-700 font-bold py-2 px-6 border border-gray-300 rounded-md transition-colors">Cancelar</button>
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md transition-colors">Executar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ListModal = ({ onSelect, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('reportFavorites')) || []);
    const [activeTab, setActiveTab] = useState('Relatórios');
    const [activeTag, setActiveTag] = useState(null);
    const allTags = [...new Set(relatoriosConfig.flatMap(r => r.tags))];

    useEffect(() => {
        localStorage.setItem('reportFavorites', JSON.stringify(favorites));
    }, [favorites]);

    const handleToggleFavorite = (reportId, e) => {
        e.stopPropagation();
        const newFavorites = favorites.includes(reportId) ? favorites.filter(id => id !== reportId) : [...favorites, reportId];
        setFavorites(newFavorites);
    };
    
    const reportsToShow = relatoriosConfig
        .filter(report => activeTab === 'Relatórios Favoritos' ? favorites.includes(report.id) : true)
        .filter(report => activeTag ? report.tags.includes(activeTag) : true)
        .filter(report => report.titulo.toLowerCase().includes(searchTerm.toLowerCase()));

    const FilterButton = ({ label }) => (
        <button onClick={() => setActiveTab(label)} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${activeTab === label ? 'bg-gray-800 text-white font-semibold' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`}>
            {label}
        </button>
    );

    const TagButton = ({ tag }) => (
         <button onClick={() => setActiveTag(prev => prev === tag ? null : tag)} className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${activeTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
            {tag}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl flex flex-col transform transition-all h-full max-h-[800px]">
                <header className="flex justify-between items-center p-4 border-b flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900">Assistente (F4)</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </header>
                
                <section className="p-4 border-b space-y-4 flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input type="text" placeholder="Busque por nome do relatório..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
                        <span>FILTRAR POR</span>
                        <div className="flex items-center gap-2">
                           <FilterButton label="Relatórios" />
                           <FilterButton label="Relatórios Favoritos" />
                        </div>
                    </div>
                     <div className="flex flex-wrap items-center gap-2">
                        {allTags.map(tag => <TagButton key={tag} tag={tag} />)}
                    </div>
                </section>
                
                <ul className="overflow-y-auto flex-grow">
                    {reportsToShow.length > 0 ? reportsToShow.map(report => (
                        <li key={report.id} onClick={() => onSelect(report)} className="flex items-center p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer group">
                            <button onClick={(e) => handleToggleFavorite(report.id, e)} className="p-2 text-gray-400 hover:text-yellow-500">
                                <Star size={18} className={`transition-colors ${favorites.includes(report.id) ? 'text-yellow-400 fill-current' : ''}`} />
                            </button>
                            <File size={18} className="text-gray-400 mx-2" />
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-blue-700 group-hover:underline">{report.titulo}</p>
                                {report.tags.map(tag => (
                                    <span key={tag} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                                ))}
                            </div>
                        </li>
                    )) : (
                        <li className="p-10 text-center text-gray-500">Nenhum relatório encontrado para os filtros selecionados.</li>
                    )}
                </ul>
                
                <footer className="p-3 border-t flex justify-end items-center gap-4 flex-shrink-0">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"><ChevronsLeft size={16} className="mr-1" /> ANTERIOR</button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">PRÓXIMA <ChevronsRight size={16} className="ml-1" /></button>
                </footer>
            </div>
        </div>
    );
};


export default function ReportManager() {
  const { isManagerOpen, closeReportManager, reportForParams, openParamsForReport } = useReports();
  
  const handleExecute = (params, format) => {
    if (!reportForParams) return;
    const queryParams = new URLSearchParams({ formato: format, ...params });
    const url = `${API_BASE_URL}${reportForParams.endpoint}?${queryParams.toString()}`;
    window.open(url, '_blank');
    closeReportManager();
  };

  if (isManagerOpen) {
    return <ListModal onSelect={openParamsForReport} onClose={closeReportManager} />;
  }

  if (reportForParams) {
    return <ParamsModal report={reportForParams} onClose={closeReportManager} onExecute={handleExecute} />;
  }

  return null;
}