import React, { useEffect, useState } from "react";

function MovimentacoesPage() {
  const [todasMovimentacoes, setTodasMovimentacoes] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [filtros, setFiltros] = useState({
    periodoRapido: "todos",
    dataInicio: "",
    dataFim: "",
    tipo: "todos",
    status: "todos",
  });

  const carregarMovimentacoes = async () => {
    try {
      setLoading(true);
      setErro(null);

      const res = await fetch("http://localhost:3001/api/movimentacoes", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.error("Erro ao buscar movimentações:", res.status);
        setErro(`Erro ao buscar movimentações (status ${res.status}).`);
        setTodasMovimentacoes([]);
        setMovimentacoes([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log("Movimentações recebidas:", data);

      setTodasMovimentacoes(data || []);
      setMovimentacoes(data || []); // começa mostrando tudo
      setLoading(false);
    } catch (err) {
      console.error("Erro de rede ao buscar movimentações:", err);
      setErro("Erro de rede ao buscar movimentações.");
      setTodasMovimentacoes([]);
      setMovimentacoes([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMovimentacoes();
  }, []);

  const formatarData = (valor) => {
    if (!valor) return "-";
    return new Date(valor).toLocaleDateString("pt-BR");
  };

  const formatarTipo = (tipo) => {
    if (!tipo) return "-";
    const t = tipo.toLowerCase();
    if (t === "entrada")
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Entrada
        </span>
      );
    if (t === "saida")
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Saída
        </span>
      );
    return tipo;
  };

  // Atualiza o estado dos filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  // Aplica os filtros no array completo
  const aplicarFiltros = () => {
    let lista = [...todasMovimentacoes];

    // Datas
    let dataInicio = filtros.dataInicio ? new Date(filtros.dataInicio) : null;
    let dataFim = filtros.dataFim ? new Date(filtros.dataFim) : null;

    // Se não tiver datas manuais, usa período rápido
    if (!dataInicio && !dataFim && filtros.periodoRapido !== "todos") {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      if (filtros.periodoRapido === "hoje") {
        dataInicio = new Date(hoje);
        dataFim = new Date(hoje);
      } else if (filtros.periodoRapido === "7dias") {
        dataFim = new Date(hoje);
        dataInicio = new Date(hoje);
        dataInicio.setDate(dataInicio.getDate() - 6);
      } else if (filtros.periodoRapido === "30dias") {
        dataFim = new Date(hoje);
        dataInicio = new Date(hoje);
        dataInicio.setDate(dataInicio.getDate() - 29);
      }
    }

    if (dataInicio || dataFim) {
      lista = lista.filter((mov) => {
        if (!mov.data_movimentacao) return false;
        const d = new Date(mov.data_movimentacao);
        d.setHours(0, 0, 0, 0);
        if (dataInicio && d < dataInicio) return false;
        if (dataFim && d > dataFim) return false;
        return true;
      });
    }

    // Tipo (entrada / saída)
    if (filtros.tipo !== "todos") {
      const tipoFiltro = filtros.tipo.toLowerCase();
      lista = lista.filter(
        (mov) =>
          mov.tipo_movimentacao &&
          mov.tipo_movimentacao.toLowerCase() === tipoFiltro
      );
    }

    // Status (quando tiver campo vindo da API, ajuste aqui)
    if (filtros.status !== "todos") {
      const statusFiltro = filtros.status.toLowerCase();
      lista = lista.filter((mov) => {
        const statusMov = (mov.status || "").toLowerCase(); // ajuste o nome do campo depois
        return statusMov === statusFiltro;
      });
    }

    setMovimentacoes(lista);
  };

  // Limpar filtros e voltar tudo
  const limparFiltros = () => {
    setFiltros({
      periodoRapido: "todos",
      dataInicio: "",
      dataFim: "",
      tipo: "todos",
      status: "todos",
    });
    setMovimentacoes(todasMovimentacoes);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Movimentações de Estoque
        </h1>

        {/* Filtros */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-6 py-5 mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">
              Período Rápido
            </label>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtros.periodoRapido}
              onChange={(e) =>
                handleFiltroChange("periodoRapido", e.target.value)
              }
            >
              <option value="todos">Todos</option>
              <option value="hoje">Hoje</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">
              Data Início
            </label>
            <input
              type="date"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtros.dataInicio}
              onChange={(e) =>
                handleFiltroChange("dataInicio", e.target.value)
              }
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtros.dataFim}
              onChange={(e) => handleFiltroChange("dataFim", e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">
              Tipo
            </label>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtros.tipo}
              onChange={(e) => handleFiltroChange("tipo", e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">
              Status
            </label>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtros.status}
              onChange={(e) => handleFiltroChange("status", e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="concluido">Concluído</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>

          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={aplicarFiltros}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-xl shadow-sm transition-all"
            >
              Filtrar
            </button>
            <button
              type="button"
              onClick={limparFiltros}
              className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm hover:bg-gray-50 transition-all"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {erro && (
            <div className="px-6 pt-4 text-sm text-red-500">{erro}</div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-6 py-3">N° MOV.</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Produto</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3 text-center">Quantidade</th>
                  <th className="px-6 py-3 text-right">Valor Custo</th>
                  <th className="px-6 py-3 text-right">Valor Venda</th>
                  <th className="px-6 py-3">Responsável</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-10 text-center text-gray-400 text-sm"
                    >
                      Carregando movimentações...
                    </td>
                  </tr>
                ) : movimentacoes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-10 text-center text-gray-400 text-sm"
                    >
                      Nenhuma movimentação encontrada.
                    </td>
                  </tr>
                ) : (
                  movimentacoes.map((mov, index) => (
                    <tr
                      key={mov.id_movimentacao}
                      className={`text-sm ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                      } border-t border-gray-100`}
                    >
                      <td className="px-6 py-3 text-gray-700">
                        <span className="text-xs text-gray-400 mr-1">#</span>
                        {mov.id_movimentacao}
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        {formatarData(mov.data_movimentacao)}
                      </td>
                      <td className="px-6 py-3 text-gray-800">
                        {mov.produto || "-"}
                      </td>
                      <td className="px-6 py-3">
                        {formatarTipo(mov.tipo_movimentacao)}
                      </td>
                      <td className="px-6 py-3 text-center text-gray-800">
                        {mov.quantidade}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-400">-</td>
                      <td className="px-6 py-3 text-right text-gray-400">-</td>
                      <td className="px-6 py-3 text-gray-700">
                        {mov.responsavel || "-"}
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-sm">-</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovimentacoesPage;

