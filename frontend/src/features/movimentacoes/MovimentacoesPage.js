import React from "react";

function MovimentacoesPage() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Movimentações de Estoque</h1>

      {}
      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-600">
            Período Rápido
          </label>
          <select className="border rounded-md p-2 w-40">
            <option>Todos</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Data Início
          </label>
          <input type="date" className="border rounded-md p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Data Fim
          </label>
          <input type="date" className="border rounded-md p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">Tipo</label>
          <select className="border rounded-md p-2 w-32">
            <option>Todos</option>
            <option>Entrada</option>
            <option>Saída</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Status
          </label>
          <select className="border rounded-md p-2 w-32">
            <option>Todos</option>
            <option>Concluído</option>
            <option>Pendente</option>
          </select>
        </div>

        <button className="ml-auto bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition">
          Filtrar
        </button>
      </div>

      {}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-gray-600 text-sm border-b">
              <th className="p-3">N° MOV.</th>
              <th className="p-3">DATA</th>
              <th className="p-3">PRODUTO</th>
              <th className="p-3">TIPO</th>
              <th className="p-3">QUANTIDADE</th>
              <th className="p-3">VALOR CUSTO</th>
              <th className="p-3">VALOR VENDA</th>
              <th className="p-3">RESPONSÁVEL</th>
              <th className="p-3">STATUS</th>
            </tr>
          </thead>

          <tbody>
            {}
          </tbody>
        </table>

        {}
        <div className="text-center text-gray-400 py-10">
          Nenhuma movimentação encontrada.
        </div>
      </div>
    </div>
  );
}

export default MovimentacoesPage;
