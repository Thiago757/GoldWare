import React, { useState, useEffect } from 'react';
import { useReports } from '../../context/ReportProvider';
import { Search, Star, File } from 'lucide-react';

const relatoriosConfig = [
  { 
    id: 'vendas_periodo', 
    titulo: 'Vendas por Período', 
    endpoint: '/api/relatorios/vendas-periodo', 
    formatos: ['pdf', 'excel'], 
    tags: ['Vendas', 'Financeiro'], 
    parametros: [
      { name: 'dataInicial', label: 'Data Inicial', type: 'date', required: true }, 
      { name: 'dataFinal', label: 'Data Final', type: 'date', required: true }
    ] 
  },
  { 
    id: 'ranking_joias_vendidas', 
    titulo: 'Ranking de Joias Mais Vendidas', 
    endpoint: '/api/relatorios/ranking-joias', 
    formatos: ['pdf', 'excel'], 
    tags: ['Vendas', 'Estoque'], 
    parametros: [
      { name: 'dataInicial', label: 'Data Inicial', type: 'date', required: true },
      { name: 'dataFinal', label: 'Data Final', type: 'date', required: true },
      { name: 'id_categoria', label: 'Categoria (Opcional)', type: 'select_categorias', placeholder: 'Todas as categorias' }
    ] 
  },
  { 
    id: 'comissoes_vendedores', 
    titulo: 'Comissões de Vendedores', 
    endpoint: '/api/relatorios/comissoes', 
    formatos: ['pdf', 'excel'], 
    tags: ['Vendas', 'Financeiro'], 
    parametros: [
    { name: 'dataInicial', label: 'Data Inicial', type: 'date', required: true },
    { name: 'dataFinal', label: 'Data Final', type: 'date', required: true }
    ]
  },
  { 
    id: 'inventario_valorizado', 
    titulo: 'Inventário Atual (Valorizado)', 
    endpoint: '/api/relatorios/inventario', 
    formatos: ['pdf', 'excel'], 
    tags: ['Estoque', 'Financeiro'], 
    parametros: [
      { name: 'id_categoria', label: 'Categoria (Opcional)', type: 'select_categorias', placeholder: 'Todas as categorias' }
    ] 
  },
  { 
    id: 'estoque_baixo', 
    titulo: 'Relatório de Estoque Baixo', 
    endpoint: '/api/relatorios/estoque-baixo', 
    formatos: ['pdf', 'excel'], 
    tags: ['Estoque', 'Compras'], 
    parametros: [
      { name: 'limite', label: 'Quantidade máxima em estoque', type: 'number', defaultValue: 5, required: true }
    ] 
  },
  { 
    id: 'contas_receber', 
    titulo: 'Contas a Receber (Clientes)', 
    endpoint: '/api/relatorios/contas-receber', 
    formatos: ['pdf', 'excel'], 
    tags: ['Financeiro', 'Clientes'], 
    parametros: [
      { name: 'status', label: 'Status', type: 'select', options: ['Todas', 'Em Aberto', 'Vencidas'], required: true }
    ] 
  },
  { 
    id: 'contas_pagar', 
    titulo: 'Contas a Pagar (Fornecedores)', 
    endpoint: '/api/relatorios/contas-pagar', 
    formatos: ['pdf', 'excel'], 
    tags: ['Financeiro', 'Compras'], 
    parametros: [
      { name: 'status', label: 'Status', type: 'select', options: ['Todas', 'A Pagar', 'Vencidas', 'Pagas'], required: true}, 
      { name: 'fornecedor', label: 'Fornecedor (Opcional)', type: 'text' }
    ] 
  },
  { 
    id: 'fluxo_caixa', 
    titulo: 'Relatório de Fluxo de Caixa', 
    endpoint: '/api/relatorios/fluxo-caixa', 
    formatos: ['pdf', 'excel'], 
    tags: ['Financeiro'], 
    parametros: [
      { name: 'dataInicial', label: 'Data Inicial', type: 'date', required: true }, 
      { name: 'dataFinal', label: 'Data Final', type: 'date', required: true }
    ] 
  },
  { 
    id: 'lista_clientes_historico', 
    titulo: 'Lista de Clientes Cadastrados', 
    endpoint: '/api/relatorios/lista-clientes', 
    formatos: ['pdf', 'excel'], 
    tags: ['Clientes', 'CRM'], 
    parametros: [] 
  },
];

export default function RelatoriosPage() {
    const { openParamsForReport } = useReports();
    const [searchTerm, setSearchTerm] = useState('');
    const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('reportFavorites')) || []);
    const [activeTab, setActiveTab] = useState('Relatórios');
    const [activeTag, setActiveTag] = useState(null);
    
    useEffect(() => {
        localStorage.setItem('reportFavorites', JSON.stringify(favorites));
    }, [favorites]);

    const handleToggleFavorite = (reportId, e) => {
        e.stopPropagation();
        const newFavorites = favorites.includes(reportId) ? favorites.filter(id => id !== reportId) : [...favorites, reportId];
        setFavorites(newFavorites);
    };
    
    const handleReportClick = (report) => {
        // Encontra o relatório mais atualizado no config (caso o config mude)
        const reportConfig = relatoriosConfig.find(r => r.id === report.id);
        openParamsForReport(reportConfig || report);
    };

    const reportsToShow = relatoriosConfig
        .filter(report => activeTab === 'Relatórios Favoritos' ? favorites.includes(report.id) : true)
        .filter(report => activeTag ? report.tags.includes(activeTag) : true)
        .filter(report => report.titulo.toLowerCase().includes(searchTerm.toLowerCase()));

    const FilterButton = ({ label }) => ( <button onClick={() => setActiveTab(label)} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${activeTab === label ? 'bg-gray-800 text-white font-semibold' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`}>{label}</button> );
    const TagButton = ({ tag }) => ( <button onClick={() => setActiveTag(prev => prev === tag ? null : tag)} className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${activeTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>{tag}</button> );
    const allTags = [...new Set(relatoriosConfig.flatMap(r => r.tags))];

    return (
        <div className="bg-white rounded-lg shadow h-full flex flex-col">
            <header className="p-4 border-b">
                <h1 className="text-2xl font-bold text-gray-800">Central de Relatórios</h1>
                <p className="text-sm text-gray-500">Selecione, filtre e gere os relatórios necessários para a sua gestão.</p>
            </header>

            <section className="p-4 border-b space-y-4 flex-shrink-0">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Busque por nome do relatório..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" /></div>
                <div className="flex items-center gap-4 text-xs font-semibold text-gray-500"><span>FILTRAR POR</span><div className="flex items-center gap-2"><FilterButton label="Relatórios" /><FilterButton label="Relatórios Favoritos" /></div></div>
                <div className="flex flex-wrap items-center gap-2">{allTags.map(tag => <TagButton key={tag} tag={tag} />)}</div>
            </section>

            <ul className="overflow-y-auto flex-grow">
                {reportsToShow.map(report => (
                    <li key={report.id} onClick={() => handleReportClick(report)} className="flex items-center p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer group">
                        <button onClick={(e) => handleToggleFavorite(report.id, e)} className="p-2 text-gray-400 hover:text-yellow-500"><Star size={18} className={`transition-colors ${favorites.includes(report.id) ? 'text-yellow-400 fill-current' : ''}`} /></button>
                        <File size={18} className="text-gray-400 mx-2" />
                        <div className="flex items-center gap-2"><p className="font-medium text-blue-700 group-hover:underline">{report.titulo}</p>{report.tags.map(tag => (<span key={tag} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>))}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
}