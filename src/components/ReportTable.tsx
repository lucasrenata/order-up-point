
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

  const getPaymentMethodDisplay = (forma_pagamento: string | null) => {
    if (!forma_pagamento) return { icon: '❓', text: 'Não informado', color: 'text-gray-500' };
    
    switch (forma_pagamento) {
      case 'dinheiro':
        return { icon: '💵', text: 'Dinheiro', color: 'text-green-600' };
      case 'pix':
        return { icon: '📱', text: 'Pix', color: 'text-blue-600' };
      case 'debito':
        return { icon: '💳', text: 'Cartão Débito', color: 'text-purple-600' };
      case 'credito':
        return { icon: '🏦', text: 'Cartão Crédito', color: 'text-orange-600' };
      default:
        return { icon: '❓', text: 'Não informado', color: 'text-gray-500' };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Receipt className="text-blue-600" size={20} />
          <span className="truncate">Detalhamento das Vendas</span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <User size={16} />
                  <span className="hidden sm:inline">Comanda</span>
                </div>
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span className="hidden sm:inline">Data/Hora</span>
                  <span className="sm:hidden">Data</span>
                </div>
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Itens
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.comandas.map((comanda) => (
              <tr key={comanda.id} className="hover:bg-gray-50">
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Receipt className="text-blue-600" size={14} />
                    </div>
                    <div className="ml-2 sm:ml-4 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        #{comanda.identificador_cliente}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {comanda.comanda_itens?.length || 0} item(s)
                      </div>
                      <div className="text-xs flex items-center gap-1 mt-1">
                        <span className="text-sm">{getPaymentMethodDisplay(comanda.forma_pagamento).icon}</span>
                        <span className={`hidden sm:inline ${getPaymentMethodDisplay(comanda.forma_pagamento).color}`}>
                          {getPaymentMethodDisplay(comanda.forma_pagamento).text}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                  <div className="sm:hidden">
                    {formatBrazilianDateTime(comanda.data_pagamento).split(' ')[0]}
                  </div>
                  <div className="hidden sm:block">
                    {formatBrazilianDateTime(comanda.data_pagamento)}
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4">
                  <div className="space-y-1 sm:space-y-2">
                    {comanda.comanda_itens?.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        <span className="text-base sm:text-lg flex-shrink-0">{getProductEmoji(item.produto_id)}</span>
                        <span className="text-gray-900 truncate flex-1">{getProductName(item.produto_id)}</span>
                        <span className="bg-gray-100 text-gray-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium flex-shrink-0">
                          {item.quantidade}x
                        </span>
                        <span className="text-gray-600 text-xs sm:text-sm flex-shrink-0">
                          {parseFloat(item.preco_unitario).toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
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
        <div className="text-center py-8 sm:py-12 px-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhuma venda encontrada</h3>
          <p className="text-gray-600 text-sm sm:text-base">Não há vendas registradas para o período selecionado.</p>
        </div>
      )}
    </div>
  );
};
