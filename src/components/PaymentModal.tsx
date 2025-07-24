
import React from 'react';
import { DollarSign, X, CreditCard, Banknote } from 'lucide-react';
import { Comanda } from '../types/types';

interface PaymentModalProps {
  comanda: Comanda | null;
  onClose: () => void;
  onConfirmPayment: (total: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ comanda, onClose, onConfirmPayment }) => {
  if (!comanda) return null;
  
  const total = comanda.comanda_itens.reduce((acc, item) => acc + parseFloat(item.preco_unitario.toString()) * item.quantidade, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Finalizar Pagamento</h2>
          <p className="text-gray-500">Comanda #{comanda.identificador_cliente}</p>
        </div>
        
        <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between text-xl font-bold">
            <span className="text-gray-900">Total a Pagar</span>
            <span className="text-green-600">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => onConfirmPayment(total)} 
            className="w-full bg-green-500 text-white font-bold py-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-lg shadow-lg"
          >
            <CreditCard size={22} />
            Confirmar Pagamento
          </button>
          <button 
            onClick={onClose} 
            className="w-full bg-gray-200 text-gray-800 font-bold py-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 text-lg"
          >
            <X size={22} />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
