
import React from 'react';
import { DollarSign, X, UtensilsCrossed, Receipt } from 'lucide-react';
import { OrderItem } from './OrderItem';
import { Comanda, Product } from '../types/types';

interface OrderSummaryProps {
  comanda: Comanda | null;
  onRemoveItem: (id: number) => void;
  onClearComanda: () => void;
  onPagar: () => void;
  produtos?: Product[];
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  comanda, 
  onRemoveItem, 
  onClearComanda, 
  onPagar,
  produtos = []
}) => {
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
