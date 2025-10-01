import React from 'react';

const formatarStatus = (status) => {
    if (!status) return 'N/A';

    return status
        .replace(/_/g, ' ') 
        .split(' ')
        .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
        .join(' ');
};

const StatusBadge = ({ status }) => {
    const statusLower = status ? status.toLowerCase() : 'default';

    const statusStyles = {
        'concluida': 'bg-green-100 text-green-800',
        'pago': 'bg-green-100 text-green-800',
        'cancelada': 'bg-red-100 text-red-800',
        'pendente': 'bg-yellow-100 text-yellow-800',
        'devolvida': 'bg-sky-100 text-sky-800',
        'aberta': 'bg-violet-100 text-violet-700',
        'em_andamento': 'bg-blue-100 text-blue-800',
        'default': 'bg-slate-100 text-slate-600',
    };

    const estiloAplicado = statusStyles[statusLower] || statusStyles['default'];

    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${estiloAplicado}`}>
            {formatarStatus(status)}
        </span>
    );
};

export default StatusBadge;