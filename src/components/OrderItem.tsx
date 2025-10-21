
import React, { useState } from 'react';
import { Trash2, Check, X, Minus, Plus } from 'lucide-react';
import { ComandaItem, Product } from '../types/types';

interface OrderItemProps {
  item: ComandaItem;
  onRemove: (id: number) => void;
  onUpdateQuantity: (id: number, newQuantity: number) => void;
  produtos?: Product[];
}

export const OrderItem: React.FC<OrderItemProps> = ({ item, onRemove, onUpdateQuantity, produtos = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState(item.quantidade);
  
  // Buscar produto relacionado se existir produto_id
  const produto = item.produto_id ? produtos.find(p => p.id === item.produto_id) : null;
  
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditQuantity(item.quantidade);
  };
  
  const handleConfirm = () => {
    if (editQuantity >= 1 && editQuantity <= 999 && editQuantity !== item.quantidade) {
      onUpdateQuantity(item.id, editQuantity);
    }
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditQuantity(item.quantidade);
  };
  
  const handleIncrement = () => {
    if (editQuantity < 999) {
      setEditQuantity(prev => prev + 1);
    }
  };
  
  const handleDecrement = () => {
    if (editQuantity > 1) {
      setEditQuantity(prev => prev - 1);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };
  
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors rounded-lg px-2">
      <div className="flex-1 pr-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {produto?.img || '🍽️'}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-800">
              {item.descricao || produto?.nome || 'Item'}
            </p>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-1 bg-white border-2 border-green-500 rounded-lg px-2 py-1">
                  <button
                    onClick={handleDecrement}
                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded p-1"
                    title="Diminuir quantidade"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setEditQuantity(Math.min(999, Math.max(1, val)));
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-12 text-center font-medium text-gray-800 border-0 focus:outline-none focus:ring-0"
                    min="1"
                    max="999"
                    autoFocus
                  />
                  <button
                    onClick={handleIncrement}
                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded p-1"
                    title="Aumentar quantidade"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded p-1 ml-1"
                    title="Confirmar (Enter)"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded p-1"
                    title="Cancelar (Esc)"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartEdit}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors cursor-pointer"
                  title="Clique para editar quantidade"
                >
                  {item.quantidade}x
                </button>
              )}
              <span>{parseFloat(item.preco_unitario.toString()).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
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
};
