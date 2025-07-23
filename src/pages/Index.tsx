
import React, { useState, useEffect, useCallback } from 'react';
import { Barcode, FileText } from 'lucide-react';
import { NotificationModal } from '../components/NotificationModal';
import { PaymentModal } from '../components/PaymentModal';
import { OrderSummary } from '../components/OrderSummary';
import { InputPanel } from '../components/InputPanel';
import { mockProducts } from '../data/mockProducts';
import { Comanda, ComandaItem, Product } from '../types/types';
import { toast } from 'sonner';

export default function Index() {
  const [activeComanda, setActiveComanda] = useState<Comanda | null>(null);
  const [comandaCodeInput, setComandaCodeInput] = useState('');
  const [notification, setNotification] = useState({ message: '', type: 'info' as 'info' | 'error' | 'success' });
  const [produtos, setProdutos] = useState<Product[]>(mockProducts);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [nextComandaId, setNextComandaId] = useState(1);

  const showNotification = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ message, type });
    toast[type](message);
  };

  const reloadActiveComanda = (comandaId: number) => {
    const comanda = comandas.find(c => c.id === comandaId);
    if (comanda) {
      setActiveComanda(comanda);
    }
  };

  const handleAddItem = (itemData: Omit<ComandaItem, 'id'>) => {
    if (!activeComanda) return;
    
    const newItem: ComandaItem = {
      ...itemData,
      id: Date.now() + Math.random()
    };

    const updatedComandas = comandas.map(c => 
      c.id === activeComanda.id 
        ? { ...c, comanda_itens: [...c.comanda_itens, newItem] }
        : c
    );
    
    setComandas(updatedComandas);
    reloadActiveComanda(activeComanda.id);
  };

  const handleAddProduto = (produto: Product) => {
    if (!activeComanda) return;
    
    handleAddItem({
      comanda_id: activeComanda.id,
      produto_id: produto.id,
      quantidade: 1,
      preco_unitario: produto.preco,
      descricao: produto.nome,
      produtos: produto
    });
    showNotification(`${produto.nome} adicionado!`, 'success');
  };

  const handleAddPratoPorPeso = (valor: number) => {
    if (!activeComanda) return;
    
    handleAddItem({
      comanda_id: activeComanda.id,
      descricao: 'Prato por Quilo',
      quantidade: 1,
      preco_unitario: valor,
      produto_id: null,
      produtos: null
    });
    showNotification(`Prato de ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} adicionado!`, 'success');
  };

  const handleRemoveItem = (comandaItemId: number) => {
    if (!activeComanda) return;
    
    const updatedComandas = comandas.map(c => 
      c.id === activeComanda.id 
        ? { ...c, comanda_itens: c.comanda_itens.filter(item => item.id !== comandaItemId) }
        : c
    );
    
    setComandas(updatedComandas);
    reloadActiveComanda(activeComanda.id);
    showNotification('Item removido.', 'info');
  };

  const handleClearComanda = () => {
    if (!activeComanda) return;
    
    const updatedComandas = comandas.map(c => 
      c.id === activeComanda.id 
        ? { ...c, comanda_itens: [] }
        : c
    );
    
    setComandas(updatedComandas);
    reloadActiveComanda(activeComanda.id);
    showNotification("Itens da comanda removidos.", 'info');
  };

  const handleActivateComanda = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && comandaCodeInput.trim() !== '') {
      setIsLoading(true);
      const comandaId = comandaCodeInput.trim();
      
      let comanda = comandas.find(c => c.identificador_cliente === comandaId && c.status === 'aberta');
      
      if (!comanda) {
        const newComanda: Comanda = {
          id: nextComandaId,
          identificador_cliente: comandaId,
          status: 'aberta',
          comanda_itens: [],
          total: 0,
          data_pagamento: null
        };
        
        setComandas([...comandas, newComanda]);
        setNextComandaId(nextComandaId + 1);
        comanda = newComanda;
        showNotification(`Nova comanda #${comandaId} criada!`, 'success');
      } else {
        showNotification(`Comanda #${comandaId} carregada!`, 'info');
      }

      setActiveComanda(comanda);
      setComandaCodeInput('');
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = (total: number) => {
    if (!activeComanda) return;
    
    const updatedComandas = comandas.map(c => 
      c.id === activeComanda.id 
        ? { ...c, status: 'paga' as const, total, data_pagamento: new Date().toISOString() }
        : c
    );
    
    setComandas(updatedComandas);
    showNotification(`Comanda #${activeComanda.identificador_cliente} paga com sucesso!`, 'success');
    setActiveComanda(null);
    setPaymentModalOpen(false);
  };

  const handleGenerateReport = () => {
    const vendas = comandas.filter(c => c.status === 'paga');
    
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;
    
    let reportHTML = `
      <html>
        <head>
          <title>Relatório de Vendas</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .total { font-weight: bold; margin-top: 20px; text-align: right; font-size: 1.2em; color: #059669; }
            h1, p { text-align: center; }
            h1 { color: #1f2937; }
            .summary { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>🍽️ Relatório de Vendas - Restaurante por Quilo</h1>
          <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <div class="summary">
            <p><strong>Total de Comandas Pagas:</strong> ${vendas.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Comanda</th>
                <th>Data/Hora Pagamento</th>
                <th>Total Pago</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    let totalGeral = 0;
    vendas.forEach(venda => {
      totalGeral += venda.total;
      reportHTML += `
        <tr>
          <td>#${venda.identificador_cliente}</td>
          <td>${new Date(venda.data_pagamento!).toLocaleString('pt-BR')}</td>
          <td>${venda.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        </tr>
      `;
    });
    
    reportHTML += `
            </tbody>
          </table>
          <div class="total">
            💰 Total Geral: ${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </body>
      </html>
    `;
    
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
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
              🍽️ PDV - Restaurante por Quilo
            </h1>
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                value={comandaCodeInput} 
                onChange={(e) => setComandaCodeInput(e.target.value)} 
                onKeyDown={handleActivateComanda} 
                placeholder="Ler código da COMANDA e pressionar Enter" 
                className="w-full md:w-96 bg-white border border-gray-300 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
          </div>
          <button 
            onClick={handleGenerateReport} 
            className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <FileText size={18} />
            Gerar Relatório
          </button>
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
            />
          </div>
        </div>
      </main>
    </div>
  );
}
