
import React from 'react';
import { DollarSign, X, UtensilsCrossed, Receipt } from 'lucide-react';
import { OrderItem } from './OrderItem';
import { Comanda, Product } from '../types/types';

interface OrderSummaryProps {
  comanda: Comanda | null;
  multiComandas?: Comanda[];
  isMultiMode?: boolean;
  onRemoveItem: (id: number) => void;
  onRemoveComanda?: (comandaId: number) => void;
  onClearComanda: () => void;
  onClearMultiSelection?: () => void;
  onPagar: () => void;
  onUpdateQuantity: (id: number, newQuantity: number) => void;
  produtos?: Product[];
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  comanda, 
  multiComandas = [],
  isMultiMode = false,
  onRemoveItem,
  onRemoveComanda,
  onClearComanda,
  onClearMultiSelection,
  onPagar,
  onUpdateQuantity,
  produtos = []
}) => {
  
  if (isMultiMode) {
    if (multiComandas.length === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-lg flex flex-col h-full items-center justify-center text-center text-gray-400 p-4 sm:p-8">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-orange-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
            <Receipt size={32} className="text-orange-500 sm:hidden" />
            <Receipt size={48} className="text-orange-500 hidden sm:block" />
          </div>
          <h3 className="font-bold text-base sm:text-lg mb-2 text-orange-800">Modo Múltiplas Comandas</h3>
          <p className="text-sm text-gray-500">Leia o código de cada comanda para adicionar à cobrança.</p>
        </div>
      );
    }

    const totalGeral = multiComandas.reduce((acc, cmd) => {
      const cmdTotal = cmd.comanda_itens.reduce(
        (sum, item) => sum + parseFloat(item.preco_unitario.toString()) * item.quantidade,
        0
      );
      return acc + cmdTotal;
    }, 0);

    return (
      <div className="bg-white rounded-2xl shadow-lg flex flex-col h-full">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-orange-50">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Receipt className="text-orange-600" size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-orange-800 truncate">
                Múltiplas Comandas ({multiComandas.length})
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {multiComandas.reduce((sum, cmd) => sum + cmd.comanda_itens.length, 0)} item(s) no total
              </p>
            </div>
          </div>
          {multiComandas.length > 0 && (
            <button 
              onClick={onClearMultiSelection}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-red-500 hover:text-red-700 font-semibold hover:bg-red-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg transition-colors flex-shrink-0"
            >
              <X size={14} />
              <span className="hidden sm:inline">Limpar Seleção</span>
            </button>
          )}
        </div>

        <div className="flex-grow overflow-y-auto px-2 sm:px-4 py-2">
          {multiComandas.map((cmd, index) => {
            const cmdTotal = cmd.comanda_itens.reduce(
              (sum, item) => sum + parseFloat(item.preco_unitario.toString()) * item.quantidade,
              0
            );
            
            return (
              <div key={cmd.id} className={`mb-4 border-2 rounded-lg p-3 ${
                index === 0 
                  ? 'border-green-400 bg-green-50 ring-2 ring-green-300' 
                  : 'border-orange-200 bg-orange-50'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800">Comanda #{cmd.identificador_cliente}</h3>
                    {index === 0 && (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                        Recebe novos itens
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-green-600">
                      {cmdTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <button
                      onClick={() => onRemoveComanda?.(cmd.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  {cmd.comanda_itens.length === 0 ? (
                    <div className="text-sm text-gray-500 italic bg-white p-2 rounded text-center">
                      Comanda vazia (será marcada como paga)
                    </div>
                  ) : (
                    cmd.comanda_itens.map(item => (
                      <div key={item.id} className="flex justify-between text-sm text-gray-700 bg-white p-2 rounded">
                        <span>{item.quantidade}x {item.descricao}</span>
                        <span className="font-medium">
                          {(parseFloat(item.preco_unitario.toString()) * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-b-2xl">
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            <div className="flex justify-between text-lg sm:text-xl font-bold">
              <span className="text-gray-900">Total Geral</span>
              <span className="text-green-600">{totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          </div>
          
          <button 
            onClick={onPagar}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 sm:py-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center justify-center gap-2 text-base sm:text-lg shadow-lg"
          >
            <DollarSign size={18} />
            <span>Pagar {multiComandas.length} Comandas</span>
          </button>
        </div>
      </div>
    );
  }
  
  if (!comanda) {
    return (
      <div className="bg-white rounded-2xl shadow-lg flex flex-col h-full items-center justify-center text-center text-gray-400 p-4 sm:p-8">
        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
          <UtensilsCrossed size={32} className="text-gray-300 sm:hidden" />
          <UtensilsCrossed size={48} className="text-gray-300 hidden sm:block" />
        </div>
        <h3 className="font-bold text-base sm:text-lg mb-2">Nenhuma Comanda Ativa</h3>
        <p className="text-sm text-gray-500">Leia o código de uma comanda para começar a adicionar itens.</p>
      </div>
    );
  }

  const total = comanda.comanda_itens.reduce((acc, item) => acc + parseFloat(item.preco_unitario.toString()) * item.quantidade, 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Receipt className="text-blue-600" size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">Comanda #{comanda.identificador_cliente}</h2>
            <p className="text-xs sm:text-sm text-gray-500">{comanda.comanda_itens.length} item(s)</p>
          </div>
        </div>
        {comanda.comanda_itens.length > 0 && (
          <button 
            onClick={onClearComanda} 
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-red-500 hover:text-red-700 font-semibold hover:bg-red-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={14} />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        )}
      </div>

      <div className="flex-grow overflow-y-auto px-2 sm:px-4">
        {comanda.comanda_itens.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-4 sm:p-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <UtensilsCrossed size={24} className="text-gray-300 sm:hidden" />
              <UtensilsCrossed size={32} className="text-gray-300 hidden sm:block" />
            </div>
            <p className="font-semibold text-gray-600 mb-2 text-sm sm:text-base">Comanda vazia</p>
            <p className="text-xs sm:text-sm text-gray-500">Adicione itens à comanda para continuar.</p>
          </div>
        ) : (
          <div className="py-2">
            {comanda.comanda_itens.map(item => (
              <OrderItem 
                key={item.id} 
                item={item} 
                onRemove={onRemoveItem}
                onUpdateQuantity={onUpdateQuantity}
                produtos={produtos}
              />
            ))}
          </div>
        )}
      </div>

      {comanda.comanda_itens.length > 0 && (
        <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-b-2xl">
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            <div className="flex justify-between text-lg sm:text-xl font-bold">
              <span className="text-gray-900">Total</span>
              <span className="text-green-600">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          </div>
          
          <button 
            onClick={onPagar} 
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 sm:py-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 text-base sm:text-lg shadow-lg"
          >
            <DollarSign size={18} />
            <span className="hidden sm:inline">Pagar / Fechar Comanda</span>
            <span className="sm:hidden">Pagar</span>
          </button>
        </div>
      )}
    </div>
  );
};
