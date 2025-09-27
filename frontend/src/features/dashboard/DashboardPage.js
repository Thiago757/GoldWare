import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Componente auxiliar para os Badges de Status
const StatusBadge = ({ status }) => {
  const statusLower = status.toLowerCase();
  const statusStyles = {
    pago: 'bg-green-100 text-green-800',
    pendente: 'bg-yellow-100 text-yellow-800',
    cancelado: 'bg-red-100 text-red-800',
  };
  const defaultStyle = 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[statusLower] || defaultStyle}`}>
      {status}
    </span>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [graficoVisivel, setGraficoVisivel] = useState('both');

  useEffect(() => {
    axios.get("http://localhost:3001/api/dashboard/data")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Erro ao buscar dados:", err));
  }, []);

  const handleBotaoGraficoClick = (metrica) => {
    if (graficoVisivel === metrica) {
      setGraficoVisivel('both');
    } else {
      setGraficoVisivel(metrica);
    }
  };

  if (!data) return <p className="p-6">Carregando...</p>;

  const { kpis, vendasPorMes, ultimasVendas, tiposDeProdutos } = data;
  
  // ... (toda a lógica de dados do gráfico permanece a mesma)
  const datasetsVendas = [];
  if (graficoVisivel === 'quantidade' || graficoVisivel === 'both') {
    datasetsVendas.push({
      label: "Quantidade vendida",
      data: vendasPorMes.map(v => v.quantidade),
      backgroundColor: "#FACC15",
      borderRadius: 6,
      yAxisID: 'y',
    });
  }
  if (graficoVisivel === 'valor' || graficoVisivel === 'both') {
    datasetsVendas.push({
      label: "Valor vendido",
      data: vendasPorMes.map(v => v.valor),
      backgroundColor: "#A78BFA",
      borderRadius: 6,
      yAxisID: 'y1',
    });
  }
  const vendasChartData = {
    labels: vendasPorMes.map(v => v.mes),
    datasets: datasetsVendas,
  };
  const vendasChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { type: 'linear', display: graficoVisivel === 'quantidade' || graficoVisivel === 'both', position: 'left', beginAtZero: true },
      y1: { type: 'linear', display: graficoVisivel === 'valor' || graficoVisivel === 'both', position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { callback: function(value) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); } } },
    },
  };
  const produtosChartData = {
    labels: tiposDeProdutos.map(p => p.tipo),
    datasets: [{
      data: tiposDeProdutos.map(p => p.percentual),
      backgroundColor: ["#F87171", "#34D399", "#60A5FA", "#FBBF24", "#A78BFA", "#FACC15"],
      borderWidth: 0,
    }],
  };
  const produtosChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { display: false } },
  };


  return (
    // Container principal continua igual, definindo o limite da tela
    <div className="bg-gray-50 p-4 w-full h-screen flex flex-col gap-4">
      {/* KPIs (sem alteração) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-3 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Total de produtos</p>
          <h2 className="text-2xl font-bold">{kpis.totalProdutos}</h2>
          <p className="text-gray-400 text-xs">Itens Cadastrados</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Número de vendas</p>
          <h2 className="text-2xl font-bold">{kpis.numeroVendas}</h2>
          <p className="text-gray-400 text-xs">Vendas Registradas</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow">
          <div className="flex items-center">
            <p className="text-gray-500 text-sm">Comparado ao mês passado</p>
            <span className={`ml-2 text-xs font-semibold ${parseFloat(kpis.comparadoMesPassado) >= 0 ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'} rounded-full px-2 py-0.5`}>
              {kpis.comparadoMesPassado}
            </span>
          </div>
          <h2 className="text-2xl font-bold">{kpis.vendasAMais >= 0 ? `+${kpis.vendasAMais}` : kpis.vendasAMais}</h2>
          <p className="text-gray-400 text-xs">
            {Math.abs(kpis.vendasAMais) === 1 ? 'Venda a mais' : 'Vendas a mais'}
          </p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Pagamentos pendentes</p>
          <h2 className="text-2xl font-bold">{kpis.pagamentosPendentes}</h2>
          <p className="text-gray-400 text-xs">Clientes em débito</p>
        </div>
      </div>

      {/* NOVO WRAPPER: Esta div vai agrupar os dois blocos de baixo e ocupar o resto da tela */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">

        {/* Vendas por mês - Card com altura EXPLÍCITA de 40% (h-2/5) do wrapper */}
        <div className="bg-white p-4 rounded-xl shadow flex flex-col h-2/5">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">Vendas por mês</h2>
            <div className="flex items-center space-x-4 text-sm">
              <button onClick={() => handleBotaoGraficoClick('quantidade')} className={`flex items-center transition-colors ${(graficoVisivel === 'quantidade' || graficoVisivel === 'both') ? 'text-yellow-500 font-semibold' : 'text-gray-400'}`}>
                <div className="w-3 h-3 rounded-sm bg-yellow-400 mr-2"></div>
                Quantidade vendida
              </button>
              <button onClick={() => handleBotaoGraficoClick('valor')} className={`flex items-center transition-colors ${(graficoVisivel === 'valor' || graficoVisivel === 'both') ? 'text-purple-500 font-semibold' : 'text-gray-400'}`}>
                <div className="w-3 h-3 rounded-sm bg-purple-400 mr-2"></div>
                Valor vendido
              </button>
            </div>
          </div>
          {/* Container do gráfico com flex-1 para ocupar o espaço do card PAI */}
          <div className="flex-1 relative">
            <Bar data={vendasChartData} options={vendasChartOptions} />
          </div>
        </div>

        {/* Últimas Vendas + Tipos de Produtos - Grid com altura EXPLÍCITA de 60% (h-3/5) do wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-3/5">
          {/* Últimas Vendas */}
          <div className="bg-white p-4 rounded-xl shadow flex flex-col">
            <h2 className="text-lg font-bold mb-2">Últimas vendas</h2>
            <div className="flex-grow overflow-auto"> {/* Scroll interno se necessário */}
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-gray-400">
                    <th className="p-2 font-semibold">Cliente</th>
                    <th className="p-2 font-semibold">Data</th>
                    <th className="p-2 font-semibold">Valor</th>
                    <th className="p-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasVendas.map((v, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-medium text-gray-800">{v.cliente}</td>
                      <td className="p-2 text-gray-500">{v.data}</td>
                      <td className="p-2 text-gray-500">R$ {v.valor.toFixed(2).replace('.', ',')}</td>
                      <td className="p-2"><StatusBadge status={v.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tipos de Produtos */}
          <div className="bg-white p-4 rounded-xl shadow flex flex-col">
            <h2 className="text-lg font-bold mb-2">Tipos de Produtos</h2>
            <div className="flex-grow flex items-center justify-center space-x-6">
              <div className="relative h-32 w-32">
                  <Doughnut data={produtosChartData} options={produtosChartOptions} />
              </div>
              <div className="text-sm space-y-2">
              {tiposDeProdutos.map((p, index) => (
                  <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: produtosChartData.datasets[0].backgroundColor[index] }}></div>
                      <span className="text-gray-600">{p.tipo}</span>
                  </div>
                  <span className="font-bold text-gray-800 ml-4">{p.percentual.toFixed(1)}%</span>
                  </div>
              ))}
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}