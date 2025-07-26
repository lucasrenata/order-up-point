import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Comanda } from '@/types/types';

interface UsePaymentReturn {
  isProcessing: boolean;
  processPayment: (comanda: Comanda, showNotification: (message: string, type: 'success' | 'error') => void) => Promise<boolean>;
}

export const usePayment = (): UsePaymentReturn => {
  const [isProcessing, setIsProcessing] = useState(false);

  const updateStockAtomic = useCallback(async (comanda: Comanda): Promise<boolean> => {
    try {
      // Agrupa itens por produto para otimizar atualizações
      const produtoQuantidades = new Map<number, number>();
      
      comanda.comanda_itens.forEach(item => {
        if (item.produto_id) {
          const quantidadeAtual = produtoQuantidades.get(item.produto_id) || 0;
          produtoQuantidades.set(item.produto_id, quantidadeAtual + item.quantidade);
        }
      });

      // Executa todas as atualizações de estoque em paralelo
      const updatePromises = Array.from(produtoQuantidades.entries()).map(async ([produtoId, quantidade]) => {
        const { data: produto, error: fetchError } = await supabase
          .from('produtos')
          .select('estoque_atual')
          .eq('id', produtoId)
          .single();

        if (fetchError) throw new Error(`Erro ao buscar produto ${produtoId}: ${fetchError.message}`);
        
        const novoEstoque = (produto.estoque_atual || 0) - quantidade;
        
        if (novoEstoque < 0) {
          throw new Error(`Estoque insuficiente para produto ID ${produtoId}`);
        }

        const { error: updateError } = await supabase
          .from('produtos')
          .update({ estoque_atual: novoEstoque })
          .eq('id', produtoId);

        if (updateError) throw new Error(`Erro ao atualizar estoque do produto ${produtoId}: ${updateError.message}`);
        
        return { produtoId, novoEstoque };
      });

      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error('Erro na atualização atômica do estoque:', error);
      throw error;
    }
  }, []);

  const processPayment = useCallback(async (
    comanda: Comanda, 
    showNotification: (message: string, type: 'success' | 'error') => void
  ): Promise<boolean> => {
    if (isProcessing) return false;
    
    setIsProcessing(true);
    
    try {
      // 1. Atualizar estoque atomicamente
      await updateStockAtomic(comanda);
      
      // 2. Atualizar status da comanda
      const { error: comandaError } = await supabase
        .from('comandas')
        .update({ 
          status: 'paga',
          data_pagamento: new Date().toISOString()
        })
        .eq('id', comanda.id);

      if (comandaError) {
        throw new Error(`Erro ao atualizar comanda: ${comandaError.message}`);
      }

      showNotification('Pagamento realizado com sucesso!', 'success');
      return true;
      
    } catch (error) {
      console.error('Erro no processamento do pagamento:', error);
      showNotification(
        error instanceof Error ? error.message : 'Erro no processamento do pagamento',
        'error'
      );
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, updateStockAtomic]);

  return {
    isProcessing,
    processPayment
  };
};