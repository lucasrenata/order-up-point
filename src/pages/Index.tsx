import React, { useState, useEffect, useCallback } from 'react';
import { Barcode, FileText, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationModal } from '../components/NotificationModal';
import { PaymentModal } from '../components/PaymentModal';
import { OrderSummary } from '../components/OrderSummary';
import { InputPanel } from '../components/InputPanel';
import { supabase } from '../lib/supabase';
import { Comanda, ComandaItem, Product } from '../types/types';
import { useStockManager } from '../hooks/useStockManager';
import { toast } from 'sonner';
import { getCurrentBrazilianDateTime } from '../utils/dateUtils';

export default function Index() {
  const navigate = useNavigate();
  const { processStockReduction, isProcessing } = useStockManager();
  const [activeComanda, setActiveComanda] = useState<Comanda | null>(null);
  const [comandaCodeInput, setComandaCodeInput] = useState('');
  const [notification, setNotification] = useState({ message: '', type: 'info' as 'info' | 'error' | 'success' });
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const showNotification = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ message, type });
    toast[type](message);
  };

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from('produtos').select('*');
    if (error) {
      console.error('Erro ao carregar produtos:', error);
      showNotification('Erro ao carregar produtos.', 'error');
    } else {
      setProdutos(data || []);
      console.log('Produtos carregados:', data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const reloadActiveComanda = async (comandaId: number) => {
    const { data, error } = await supabase
      .from('comandas')
      .select(`
        *,
        comanda_itens (
          id,
          created_at,
          comanda_id,
          produto_id,
          quantidade,
          preco_unitario,
          descricao
        )
      `)
      .eq('id', comandaId)
      .single();
    
    if (error) {
      console.error('Erro ao recarregar comanda:', error);
      showNotification('Erro ao recarregar a comanda.', 'error');
      return;
    }
    
    // Enriquecer os itens com dados dos produtos
    const enrichedComanda = {
      ...data,
      comanda_itens: data.comanda_itens || []
    };
    
    setActiveComanda(enrichedComanda);
    console.log('Comanda recarregada:', enrichedComanda);
  };

  const handleAddItem = async (itemData: Omit<ComandaItem, 'id' | 'created_at'>) => {
    if (!activeComanda) return;
    
    console.log('Inserindo item:', itemData);
    
    const { data, error } = await supabase
      .from('comanda_itens')
      .insert({
        comanda_id: itemData.comanda_id,
        produto_id: itemData.produto_id,
        quantidade: itemData.quantidade,
        preco_unitario: itemData.preco_unitario,
        descricao: itemData.descricao
      })
      .select();
    
    if (error) {
      console.error('Erro ao adicionar item:', error);
      showNotification('Erro ao adicionar item.', 'error');
    } else {
      console.log('Item adicionado com sucesso:', data);
      await reloadActiveComanda(activeComanda.id);
    }
  };

  const handleAddProduto = async (produto: Product) => {
    if (!activeComanda) return;
    
    await handleAddItem({
      comanda_id: activeComanda.id,
      produto_id: produto.id,
      quantidade: 1,
      preco_unitario: produto.preco,
      descricao: produto.nome
    });
    showNotification(`${produto.nome} adicionado!`, 'success');
  };

  const handleAddPratoPorPeso = async (valor: number) => {
    if (!activeComanda) return;
    
    await handleAddItem({
      comanda_id: activeComanda.id,
      produto_id: null,
      quantidade: 1,
      preco_unitario: valor,
      descricao: 'Prato por Quilo'
    });
    showNotification(`Prato de ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} adicionado!`, 'success');
  };

  const handleRemoveItem = async (comandaItemId: number) => {
    if (!activeComanda) return;
    
    const { error } = await supabase.from('comanda_itens').delete().eq('id', comandaItemId);
    if (error) {
      console.error('Erro ao remover item:', error);
      showNotification('Erro ao remover item.', 'error');
    } else {
      showNotification('Item removido.', 'info');
      await reloadActiveComanda(activeComanda.id);
    }
  };

  const handleClearComanda = async () => {
    if (!activeComanda) return;
    
    const { error } = await supabase.from('comanda_itens').delete().eq('comanda_id', activeComanda.id);
    if (error) {
      console.error('Erro ao limpar itens:', error);
      showNotification('Erro ao limpar itens.', 'error');
    } else {
      showNotification("Itens da comanda removidos.", 'info');
      await reloadActiveComanda(activeComanda.id);
    }
  };

  const handleActivateComanda = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && comandaCodeInput.trim() !== '') {
      setIsLoading(true);
      const comandaId = comandaCodeInput.trim();
      
      console.log('Buscando comanda:', comandaId);
      
      let { data: comanda, error } = await supabase
        .from('comandas')
        .select(`
          *,
          comanda_itens (
            id,
            created_at,
            comanda_id,
            produto_id,
            quantidade,
            preco_unitario,
            descricao
          )
        `)
        .eq('identificador_cliente', comandaId)
        .eq('status', 'aberta')
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar comanda:', error);
        showNotification('Erro ao buscar comanda.', 'error');
        setIsLoading(false);
        return;
      }
      
      if (!comanda) {
        console.log('Comanda não encontrada, criando nova...');
        const { data: newComanda, error: createError } = await supabase
          .from('comandas')
          .insert({ 
            identificador_cliente: comandaId, 
            status: 'aberta',
            created_at: getCurrentBrazilianDateTime()
          })
          .select(`
            *,
            comanda_itens (
              id,
              created_at,
              comanda_id,
              produto_id,
              quantidade,
              preco_unitario,
              descricao
            )
          `)
          .single();
        
        if (createError) {
          console.error('Erro ao criar comanda:', createError);
          showNotification('Erro ao criar nova comanda.', 'error');
          setIsLoading(false);
          return;
        }
        
        comanda = {
          ...newComanda,
          comanda_itens: newComanda.comanda_itens || []
        };
        showNotification(`Nova comanda #${comandaId} criada!`, 'success');
      } else {
        comanda = {
          ...comanda,
          comanda_itens: comanda.comanda_itens || []
        };
        showNotification(`Comanda #${comandaId} carregada!`, 'info');
      }

      console.log('Comanda ativa:', comanda);
      setActiveComanda(comanda);
      setComandaCodeInput('');
      setIsLoading(false);
    }
  };


  const handleConfirmPayment = async (total: number, formaPagamento: 'dinheiro' | 'pix' | 'debito' | 'credito') => {
    if (!activeComanda || isProcessing) return;
    
    setIsLoading(true);
    
    try {
      console.log(`💳 Processando pagamento: Comanda ${activeComanda.identificador_cliente}`);
      
      // Primeiro, processar a baixa no estoque com validação
      const stockResult = await processStockReduction(activeComanda);
      
      if (!stockResult.success) {
        throw new Error(stockResult.error || 'Erro ao processar baixa no estoque');
      }
      
      // Usar data/hora brasileira atual para o pagamento
      const brazilianPaymentDateTime = getCurrentBrazilianDateTime();
      
      // Confirmar o pagamento apenas se a baixa no estoque foi bem-sucedida
      const { error } = await supabase
        .from('comandas')
        .update({ 
          status: 'paga', 
          total: total, 
          data_pagamento: brazilianPaymentDateTime,
          forma_pagamento: formaPagamento
        })
        .eq('id', activeComanda.id);

      if (error) {
        console.error('❌ Erro ao confirmar pagamento:', error);
        throw new Error(`Erro ao processar pagamento: ${error.message}`);
      }

      console.log('✅ Pagamento processado com sucesso');
      
      // Atualizar lista de produtos apenas uma vez
      await fetchProducts();
      
      // Exibir confirmação com detalhes
      let message = `Pagamento de ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} confirmado!`;
      
      if (stockResult.stockUpdates.length > 0) {
        message += ` Baixa realizada em ${stockResult.stockUpdates.length} produto(s).`;
      }
      
      if (stockResult.lowStockAlerts.length > 0) {
        toast.warning(`Estoque baixo: ${stockResult.lowStockAlerts.join(', ')}`);
      }

      showNotification(message, 'success');
      
      // Resetar estados
      setActiveComanda(null);
      setPaymentModalOpen(false);
      
    } catch (error) {
      console.error('❌ Erro no processamento do pagamento:', error);
      showNotification(
        error instanceof Error ? error.message : 'Erro ao processar pagamento', 
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = () => {
    navigate('/relatorio');
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen font-sans text-gray-800 p-4">
      <NotificationModal 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ message: '', type: 'info' })} 
      />
      
      {isPaymentModalOpen && (
        <PaymentModal 
          comanda={activeComanda} 
          onClose={() => setPaymentModalOpen(false)} 
          onConfirmPayment={handleConfirmPayment} 
        />
      )}
      
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      <main className="max-w-screen-2xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-700 mb-2 flex items-center gap-2">
              🍽️ Parceria Com IA - PDV
            </h1>
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                id="comanda-input"
                type="text" 
                value={comandaCodeInput} 
                onChange={(e) => setComandaCodeInput(e.target.value)} 
                onKeyDown={handleActivateComanda} 
                placeholder="Ler código da COMANDA ou 300 avulso" 
                className="w-full md:w-96 bg-white border border-gray-300 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                aria-label="Campo para inserir código da comanda"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/estoque')} 
              className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Package size={18} />
              Estoque
            </button>
            <button 
              onClick={handleGenerateReport} 
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
            >
              <FileText size={18} />
              Relatório
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 180px)' }}>
          <div className="lg:col-span-1">
            <InputPanel 
              produtos={produtos} 
              onAddProduto={handleAddProduto} 
              onAddPratoPorPeso={handleAddPratoPorPeso} 
              activeComandaId={activeComanda?.id}
            />
          </div>
          <div className="lg:col-span-1">
            <OrderSummary 
              comanda={activeComanda} 
              onRemoveItem={handleRemoveItem} 
              onClearComanda={handleClearComanda} 
              onPagar={() => setPaymentModalOpen(true)}
              produtos={produtos}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
