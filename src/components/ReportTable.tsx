
import React from 'react';
import { Clock, User, Receipt } from 'lucide-react';
import { formatBrazilianDateTime } from '../utils/dateUtils';

interface ReportTableProps {
  data: {
    comandas: any[];
    produtos: any[];
  };
}

export const ReportTable: React.FC<ReportTableProps> = ({ data }) => {
  const getProductName = (produtoId: number | null) => {
    if (!produtoId) return 'Prato por Quilo';
    const produto = data.produtos.find(p => p.id === produtoId);
    return produto?.nome || 'Produto não encontrado';
  };

  const getProductEmoji = (produtoId: number | null) => {
    if (!produtoId) return '🍽️';
    const produto = data.produtos.find(p => p.id === produtoId);
    return produto?.img || '🍽️';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Receipt className="text-blue-600" size={20} />
          Detalhamento das Vendas
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <User size={16} />
                  Comanda
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  Data/Hora (Horário Brasileiro)
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Itens
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.comandas.map((comanda) => (
              <tr key={comanda.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Receipt className="text-blue-600" size={16} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        #{comanda.identificador_cliente}
                      </div>
                      <div className="text-sm text-gray-500">
                        {comanda.comanda_itens?.length || 0} item(s)
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatBrazilianDateTime(comanda.data_pagamento)}
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    {comanda.comanda_itens?.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-lg">{getProductEmoji(item.produto_id)}</span>
                        <span className="text-gray-900">{getProductName(item.produto_id)}</span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                          {item.quantidade}x
                        </span>
                        <span className="text-gray-600">
                          {parseFloat(item.preco_unitario).toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  {(comanda.total || 0).toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.comandas.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhuma venda encontrada</h3>
          <p className="text-gray-600">Não há vendas registradas para o período selecionado.</p>
        </div>
      )}
    </div>
  );
};
