import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Comanda } from '@/types/types';

interface StockUpdate {
  produto: string;
  quantidade: number;
  estoqueAnterior: number;
  estoqueNovo: number;
}

interface StockReductionResult {
  stockUpdates: StockUpdate[];
  lowStockAlerts: string[];
  success: boolean;
  error?: string;
}

export const useStockManager = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processStockReduction = async (comanda: Comanda): Promise<StockReductionResult> => {
    if (isProcessing) {
      return { stockUpdates: [], lowStockAlerts: [], success: false, error: 'Operação já em andamento' };
    }

    setIsProcessing(true);
    
    try {
      console.log('🔄 Iniciando processamento de baixa no estoque...');
      
      // Filtrar apenas itens com produto_id
      const itemsWithProducts = comanda.comanda_itens.filter(item => item.produto_id);
      
      if (itemsWithProducts.length === 0) {
        console.log('✅ Nenhum item com produto para processar');
        return { stockUpdates: [], lowStockAlerts: [], success: true };
      }

      // Buscar todos os produtos em uma única consulta
      const productIds = itemsWithProducts.map(item => item.produto_id);
      const { data: produtos, error: fetchError } = await supabase
        .from('produtos')
        .select('*')
        .in('id', productIds);

      if (fetchError) {
        console.error('❌ Erro ao buscar produtos:', fetchError);
        throw new Error(`Erro ao buscar produtos: ${fetchError.message}`);
      }

      if (!produtos || produtos.length === 0) {
        throw new Error('Nenhum produto encontrado');
      }

      // Calcular atualizações necessárias
      const updates = [];
      const stockUpdates: StockUpdate[] = [];
      const lowStockAlerts: string[] = [];

      for (const item of itemsWithProducts) {
        const produto = produtos.find(p => p.id === item.produto_id);
        
        if (!produto) {
          console.warn(`⚠️ Produto ${item.produto_id} não encontrado`);
          continue;
        }

        // Validar estoque disponível
        if (produto.estoque_atual < item.quantidade) {
          throw new Error(`Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque_atual}, Necessário: ${item.quantidade}`);
        }

        const novoEstoque = produto.estoque_atual - item.quantidade;

        updates.push({
          id: produto.id,
          estoque_atual: novoEstoque
        });

        stockUpdates.push({
          produto: produto.nome,
          quantidade: item.quantidade,
          estoqueAnterior: produto.estoque_atual,
          estoqueNovo: novoEstoque
        });

        // Verificar estoque baixo
        if (novoEstoque <= (produto.estoque_minimo || 0)) {
          lowStockAlerts.push(produto.nome);
        }

        console.log(`📦 Preparando baixa: ${produto.nome} - ${item.quantidade} unidades (${produto.estoque_atual} → ${novoEstoque})`);
      }

      // Executar todas as atualizações em uma única operação usando upsert
      const { error: updateError } = await supabase
        .from('produtos')
        .upsert(updates, { onConflict: 'id' });

      if (updateError) {
        console.error('❌ Erro ao atualizar estoque:', updateError);
        throw new Error(`Erro ao atualizar estoque: ${updateError.message}`);
      }

      console.log('✅ Baixa no estoque processada com sucesso');
      
      if (lowStockAlerts.length > 0) {
        console.log('⚠️ Produtos com estoque baixo:', lowStockAlerts.join(', '));
      }

      return {
        stockUpdates,
        lowStockAlerts,
        success: true
      };

    } catch (error) {
      console.error('❌ Erro no processamento de estoque:', error);
      return {
        stockUpdates: [],
        lowStockAlerts: [],
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processStockReduction,
    isProcessing
  };
};