
import React from 'react';
import { DollarSign, X, UtensilsCrossed, Receipt } from 'lucide-react';
import { OrderItem } from './OrderItem';
import { Comanda } from '../types/types';

interface OrderSummaryProps {
  comanda: Comanda | null;
  onRemoveItem: (id: number) => void;
  onClearComanda: () => void;
  onPagar: () => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ comanda, onRemoveItem, onClearComanda, onPagar }) => {
  if (!comanda) {
    return (
      <div className="bg-white rounded-2xl shadow-lg flex flex-col h-full items-center justify-center text-center text-gray-400 p-8">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <UtensilsCrossed size={48} className="text-gray-300" />
        </div>
        <h3 className="font-bold text-lg mb-2">Nenhuma Comanda Ativa</h3>
        <p className="text-sm text-gray-500">Leia o código de uma comanda para começar a adicionar itens.</p>
      </div>
    );
  }

  const subtotal = comanda.comanda_itens.reduce((acc, item) => acc + parseFloat(item.preco_unitario.toString()) * item.quantidade, 0);
  const taxaServico = subtotal * 0.10;
  const total = subtotal + taxaServico;

  return (
    <div className="bg-white rounded-2xl shadow-lg flex flex-col h-full">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Receipt className="text-blue-600" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Comanda #{comanda.identificador_cliente}</h2>
            <p className="text-sm text-gray-500">{comanda.comanda_itens.length} item(s)</p>
          </div>
        </div>
        {comanda.comanda_itens.length > 0 && (
          <button 
            onClick={onClearComanda} 
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-semibold hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
          >
            <X size={16} />
            Limpar
          </button>
        )}
      </div>

      <div className="flex-grow overflow-y-auto px-4">
        {comanda.comanda_itens.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <UtensilsCrossed size={32} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-600 mb-2">Comanda vazia</p>
            <p className="text-sm text-gray-500">Adicione itens à comanda para continuar.</p>
          </div>
        ) : (
          <div className="py-2">
            {comanda.comanda_itens.map(item => (
              <OrderItem key={item.id} item={item} onRemove={onRemoveItem} />
            ))}
          </div>
        )}
      </div>

      {comanda.comanda_itens.length > 0 && (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-b-2xl">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-800">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Taxa de Serviço (10%)</span>
              <span className="font-semibold text-gray-800">{taxaServico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t border-gray-200 pt-3 mt-3">
              <span className="text-gray-900">Total</span>
              <span className="text-green-600">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          </div>
          
          <button 
            onClick={onPagar} 
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 text-lg shadow-lg"
          >
            <DollarSign size={20} />
            Pagar / Fechar Comanda
          </button>
        </div>
      )}
    </div>
  );
};
