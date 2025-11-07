import React, { useState } from 'react';
import { Clock, User, Receipt, Edit, Trash2 } from 'lucide-react';
import { formatBrazilianDateTimeDirect } from '../utils/dateUtils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Comanda } from '@/types/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AdminAuthModal } from './AdminAuthModal';
import { EditComandaModal } from './EditComandaModal';

interface ReportTableProps {
  data: {
    comandas: any[];
    produtos: any[];
  };
  onDataChange?: () => void;
}

export const ReportTable: React.FC<ReportTableProps> = ({ data, onDataChange }) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);
  const [actionType, setActionType] = useState<'edit' | 'delete'>('edit');
  const [isDeleting, setIsDeleting] = useState(false);
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

  const getPaymentMethodDisplay = (forma_pagamento: string | null, pagamentos_divididos?: any[]) => {
    if (!forma_pagamento) return { icon: '❓', text: 'Não informado', color: 'text-gray-500' };
    
    // Tratamento para pagamento múltiplo/dividido
    if (forma_pagamento === 'multiplo' && pagamentos_divididos && pagamentos_divididos.length > 0) {
      const formas = pagamentos_divididos.map(p => {
        switch (p.forma_pagamento) {
          case 'dinheiro': return { icon: '💵', text: 'Dinheiro' };
          case 'pix': return { icon: '📱', text: 'Pix' };
          case 'debito': return { icon: '💳', text: 'Débito' };
          case 'credito': return { icon: '🏦', text: 'Crédito' };
          default: return { icon: '❓', text: 'Desconhecido' };
        }
      });
      
      const icons = formas.map(f => f.icon).join(' + ');
      const texts = formas.map(f => f.text).join(' + ');
      
      return { 
        icon: icons, 
        text: texts, 
        color: 'text-indigo-600' 
      };
    }
    
    // Pagamentos únicos
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

  const handleEditClick = (comanda: Comanda) => {
    setSelectedComanda(comanda);
    setActionType('edit');
    setAuthModalOpen(true);
  };

  const handleDeleteClick = (comanda: Comanda) => {
    setSelectedComanda(comanda);
    setActionType('delete');
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    if (actionType === 'edit') {
      setEditModalOpen(true);
    } else {
      setDeleteAlertOpen(true);
    }
  };

  const handleDeleteComanda = async () => {
    if (!selectedComanda) return;

    setIsDeleting(true);
    try {
      // Deletar itens da comanda primeiro
      const { error: itemsError } = await supabase
        .from('comanda_itens')
        .delete()
        .eq('comanda_id', selectedComanda.id);

      if (itemsError) throw itemsError;

      // Deletar comanda
      const { error: comandaError } = await supabase
        .from('comandas')
        .delete()
        .eq('id', selectedComanda.id);

      if (comandaError) throw comandaError;

      toast.success('Comanda cancelada com sucesso');
      setDeleteAlertOpen(false);
      setSelectedComanda(null);
      onDataChange?.();
    } catch (error: any) {
      console.error('Erro ao deletar comanda:', error);
      toast.error('Erro ao cancelar comanda: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedComanda(null);
    onDataChange?.();
  };

  return (
    <>
      <AdminAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        action={actionType}
      />

      {selectedComanda && (
        <EditComandaModal
          comanda={selectedComanda}
          produtos={data.produtos}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a comanda #{selectedComanda?.identificador_cliente}?
              Esta ação não pode ser desfeita e removerá todos os dados da comanda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Não, manter</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComanda}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Cancelando...' : 'Sim, cancelar comanda'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                Desconto
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
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
                        <span className="text-sm">{getPaymentMethodDisplay(comanda.forma_pagamento, comanda.pagamentos_divididos).icon}</span>
                        <span className={`hidden sm:inline ${getPaymentMethodDisplay(comanda.forma_pagamento, comanda.pagamentos_divididos).color}`}>
                          {getPaymentMethodDisplay(comanda.forma_pagamento, comanda.pagamentos_divididos).text}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                  <div className="sm:hidden">
                    {formatBrazilianDateTimeDirect(comanda.data_pagamento).split(' ')[0]}
                  </div>
                  <div className="hidden sm:block">
                    {formatBrazilianDateTimeDirect(comanda.data_pagamento)}
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
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm">
                  {comanda.desconto && comanda.desconto > 0 ? (
                    <div className="text-orange-600 font-semibold">
                      - R$ {comanda.desconto.toFixed(2)}
                      {comanda.desconto_percentual && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({comanda.desconto_percentual}%)
                        </span>
                      )}
                      {comanda.motivo_desconto && (
                        <p className="text-xs text-gray-500 italic mt-1">
                          {comanda.motivo_desconto}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  {(comanda.total || 0).toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(comanda)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      title="Editar comanda"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(comanda)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      title="Cancelar comanda"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
    </>
  );
};
