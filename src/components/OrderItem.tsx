
import React from 'react';
import { Trash2 } from 'lucide-react';
import { ComandaItem } from '../types/types';

interface OrderItemProps {
  item: ComandaItem;
  onRemove: (id: number) => void;
}

export const OrderItem: React.FC<OrderItemProps> = ({ item, onRemove }) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors rounded-lg px-2">
    <div className="flex-1 pr-3">
      <div className="flex items-center gap-3">
        <div className="text-2xl">
          {item.produtos?.img || '🍽️'}
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-800">
            {item.descricao || (item.produtos && item.produtos.nome)}
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {item.quantidade}x
            </span>
            {parseFloat(item.preco_unitario.toString()).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="text-right font-bold text-gray-900 min-w-[80px]">
        {(parseFloat(item.preco_unitario.toString()) * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </div>
      <button 
        onClick={() => onRemove(item.id)} 
        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  </div>
);
