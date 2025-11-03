import React, { useState, useEffect, useContext } from 'react';
import { useReports } from '../../context/ReportProvider';
import { AuthContext } from '../../context/AuthContext';
import { X, FileText, FileSpreadsheet } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001';

const ParamsModal = ({ report, onClose, onExecute }) => {
    const [params, setParams] = useState(() => {
        const initialState = {};
        report.parametros.forEach(p => { initialState[p.name] = p.defaultValue ?? ''; });
        return initialState;
    });
    const [format, setFormat] = useState(report.formatos[0]);
    const { token } = useContext(AuthContext);

    const [categorias, setCategorias] = useState([]);
    const [loadingCategorias, setLoadingCategorias] = useState(false);
    const [errorCategorias, setErrorCategorias] = useState('');

    useEffect(() => {
        const precisaCarregar = report.parametros.some(p => p.type === 'select_categorias');
        
        if (precisaCarregar && token) {
            const fetchCategorias = async () => {
                setLoadingCategorias(true);
                setErrorCategorias('');
                try {
                    const response = await fetch('http://localhost:3001/api/categorias', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Falha ao carregar categorias');
                    const data = await response.json();
                    setCategorias(data);
                } catch (err) {
                    setErrorCategorias(err.message);
                } finally {
                    setLoadingCategorias(false);
                }
            };
            fetchCategorias();
        }
    }, [report, token]);

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
                                
                                {param.type === 'select_categorias' ? (
                                    <select 
                                        id={param.name} 
                                        name={param.name} 
                                        value={params[param.name]} 
                                        onChange={handleInputChange} 
                                        required={param.required} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        disabled={loadingCategorias}
                                    >
                                        <option value="">{loadingCategorias ? 'A carregar...' : (param.placeholder || 'Selecione')}</option>
                                        {categorias.map(cat => (
                                            <option key={cat.id_categoria} value={cat.id_categoria}>
                                                {cat.nome}
                                            </option>
                                        ))}
                                    </select>
                                ) : param.type === 'select' ? (
                                    <select id={param.name} name={param.name} value={params[param.name]} onChange={handleInputChange} required={param.required} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                        <option value="">Selecione</option>
                                        {param.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                ) : (
                                    <input type={param.type} id={param.name} name={param.name} value={params[param.name]} onChange={handleInputChange} placeholder={param.placeholder} required={param.required} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                                )}
                                {param.type === 'select_categorias' && errorCategorias && <p className="text-xs text-red-500 mt-1">{errorCategorias}</p>}
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


export default function ReportManager() {
  const { reportForParams, closeReportManager } = useReports();
  
  const handleExecute = (params, format) => {
    if (!reportForParams) return;
    const queryParams = new URLSearchParams({ formato: format, ...params });
    const url = `${API_BASE_URL}${reportForParams.endpoint}?${queryParams.toString()}`;
    window.open(url, '_blank');
    closeReportManager();
  };

  
  if (reportForParams) {
    return <ParamsModal report={reportForParams} onClose={closeReportManager} onExecute={handleExecute} />;
  }

  return null;
}