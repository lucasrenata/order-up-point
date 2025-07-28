
import React, { useState } from 'react';
import { DollarSign, X, CreditCard, Banknote, Smartphone, Wallet } from 'lucide-react';
import { Comanda } from '../types/types';

interface PaymentModalProps {
  comanda: Comanda | null;
  onClose: () => void;
  onConfirmPayment: (total: number, formaPagamento: 'dinheiro' | 'pix' | 'debito' | 'credito') => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ comanda, onClose, onConfirmPayment }) => {
  const [selectedPayment, setSelectedPayment] = useState<'dinheiro' | 'pix' | 'debito' | 'credito' | null>(null);
  
  if (!comanda) return null;
  
  const total = comanda.comanda_itens.reduce((acc, item) => acc + parseFloat(item.preco_unitario.toString()) * item.quantidade, 0);

  const paymentOptions = [
    { id: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: 'bg-green-100 hover:bg-green-200 border-green-300' },
    { id: 'pix', label: 'Pix', icon: Smartphone, color: 'bg-blue-100 hover:bg-blue-200 border-blue-300' },
    { id: 'debito', label: 'Cartão Débito', icon: CreditCard, color: 'bg-purple-100 hover:bg-purple-200 border-purple-300' },
    { id: 'credito', label: 'Cartão Crédito', icon: Wallet, color: 'bg-orange-100 hover:bg-orange-200 border-orange-300' }
  ];

  const handleConfirm = () => {
    if (selectedPayment) {
      onConfirmPayment(total, selectedPayment);
    }
  };

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
        
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 text-center">Selecione a forma de pagamento</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedPayment === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedPayment(option.id as any)}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : `border-gray-200 ${option.color}`
                    }
                  `}
                >
                  <Icon size={24} className={isSelected ? 'text-blue-600' : 'text-gray-600'} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between text-xl font-bold">
            <span className="text-gray-900">Total a Pagar</span>
            <span className="text-green-600">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={handleConfirm}
            disabled={!selectedPayment}
            className={`
              w-full font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg shadow-lg
              ${selectedPayment 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <DollarSign size={22} />
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
