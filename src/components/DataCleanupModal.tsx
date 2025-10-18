
import React, { useState } from 'react';
import { Trash2, Calendar, Package, DollarSign, AlertTriangle, List, RefreshCw, Database } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { useDataCleanup } from '../hooks/useDataCleanup';
import { formatBrazilianDateDirect, getCurrentBrazilianDate } from '../utils/dateUtils';

export const DataCleanupModal: React.FC = () => {
  const { 
    dateSummaries, 
    allPaidSummary,
    allComandasSummary,
    cleanupMode,
    isLoading, 
    isDeleting, 
    setCleanupMode,
    fetchDateSummaries,
    fetchAllPaidComandas,
    fetchAllComandas,
    deleteComandasByDate,
    deleteAllPaidComandas,
    deleteAllComandas
  } = useDataCleanup();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAllPaidConfirmation, setShowAllPaidConfirmation] = useState(false);
  const [showDeleteAllConfirmation, setShowDeleteAllConfirmation] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [deleteAllConfirmationChecked, setDeleteAllConfirmationChecked] = useState(false);

  const handleDeleteByDate = async () => {
    if (selectedDate) {
      await deleteComandasByDate(selectedDate);
      setSelectedDate(null);
    }
  };

  const handleDeleteAllPaid = async () => {
    await deleteAllPaidComandas();
    setShowAllPaidConfirmation(false);
    setConfirmationChecked(false);
  };

  const handleDeleteAll = async () => {
    await deleteAllComandas();
    setShowDeleteAllConfirmation(false);
    setDeleteAllConfirmationChecked(false);
  };

  const handleRefreshData = () => {
    console.log('🔄 Recarregando dados manualmente...');
    if (cleanupMode === 'by-date') {
      fetchDateSummaries();
    } else if (cleanupMode === 'all-paid') {
      fetchAllPaidComandas();
    } else {
      fetchAllComandas();
    }
  };

  const renderByDateContent = () => {
    console.log('🎨 Renderizando conteúdo por data:', { isLoading, dateSummariesLength: dateSummaries.length });
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Carregando dados...</span>
        </div>
      );
    }

    if (dateSummaries.length === 0) {
      return (
        <div className="text-center py-8">
          <Package className="text-gray-400 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Nenhuma comanda paga encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            Não há comandas pagas para serem removidas.
          </p>
          <Button 
            onClick={handleRefreshData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Recarregar
          </Button>
        </div>
      );
    }

    const currentDate = getCurrentBrazilianDate();

    return (
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {dateSummaries.map((summary) => {
          const isToday = summary.date === currentDate;
          
          return (
            <div
              key={summary.date}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                isToday ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isToday ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  <Calendar className={isToday ? 'text-yellow-600' : 'text-blue-600'} size={16} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 flex items-center gap-2">
                    {formatBrazilianDateDirect(summary.date)}
                    {isToday && (
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                        HOJE
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Package size={14} />
                      {summary.count} comandas
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={14} />
                      {summary.totalValue.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setSelectedDate(summary.date)}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                <Trash2 size={14} />
                {isDeleting ? 'Deletando...' : 'Excluir'}
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAllPaidContent = () => {
    console.log('🎨 Renderizando conteúdo todas as comandas:', { 
      isLoading, 
      allPaidSummary: {
        count: allPaidSummary.count,
        totalValue: allPaidSummary.totalValue,
        comandasLength: allPaidSummary.comandas.length
      }
    });
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Carregando comandas...</span>
        </div>
      );
    }

    if (allPaidSummary.count === 0) {
      return (
        <div className="text-center py-8">
          <Package className="text-gray-400 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Nenhuma comanda paga encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            Não há comandas pagas para serem removidas.
          </p>
          <Button 
            onClick={handleRefreshData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Recarregar
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-600" size={20} />
            <span className="font-semibold text-red-800">Atenção Máxima!</span>
          </div>
          <p className="text-sm text-red-700">
            Esta ação irá deletar <strong>TODAS</strong> as comandas pagas do sistema, 
            independente da data. Esta operação é irreversível!
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <List className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Resumo Geral</h3>
              <p className="text-sm text-gray-600">Todas as comandas pagas</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Package size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Total de Comandas</span>
              </div>
              <span className="text-xl font-bold text-gray-800">{allPaidSummary.count}</span>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center justify-center gap-2 mb-1">
                <DollarSign size={16} className="text-green-600" />
                <span className="text-sm font-medium text-gray-600">Valor Total</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {allPaidSummary.totalValue.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="destructive"
          onClick={() => setShowAllPaidConfirmation(true)}
          disabled={isDeleting}
          className="w-full flex items-center gap-2 bg-red-600 hover:bg-red-700"
        >
          <Trash2 size={16} />
          {isDeleting ? 'Deletando...' : 'Deletar Todas as Comandas Pagas'}
        </Button>
      </div>
    );
  };

  const renderDeleteAllContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Carregando comandas...</span>
        </div>
      );
    }

    if (allComandasSummary.count === 0) {
      return (
        <div className="text-center py-8">
          <Database className="text-gray-400 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Nenhuma comanda encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            O banco de dados está vazio.
          </p>
          <Button 
            onClick={handleRefreshData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Recarregar
          </Button>
        </div>
      );
    }

    // Calcular estatísticas por status
    const statusStats: Record<string, { count: number; value: number }> = allComandasSummary.comandas.reduce((acc: Record<string, { count: number; value: number }>, comanda: any) => {
      const status = comanda.status || 'desconhecido';
      if (!acc[status]) {
        acc[status] = { count: 0, value: 0 };
      }
      acc[status].count++;
      acc[status].value += comanda.total || 0;
      return acc;
    }, {});

    return (
      <div className="space-y-4">
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-600" size={24} />
            <span className="font-bold text-red-900 text-lg">PERIGO MÁXIMO!</span>
          </div>
          <p className="text-sm text-red-800 font-medium">
            Esta ação irá deletar <strong>ABSOLUTAMENTE TODAS</strong> as comandas do sistema, 
            incluindo comandas abertas, pagas e canceladas. O banco de dados será completamente limpo!
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Database className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Todas as Comandas</h3>
              <p className="text-sm text-gray-600">Todos os status incluídos</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Package size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Total de Comandas</span>
              </div>
              <span className="text-xl font-bold text-gray-800">{allComandasSummary.count}</span>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center justify-center gap-2 mb-1">
                <DollarSign size={16} className="text-green-600" />
                <span className="text-sm font-medium text-gray-600">Valor Total</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {allComandasSummary.totalValue.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </span>
            </div>
          </div>

          {/* Mostrar breakdown por status */}
          <div className="bg-white p-3 rounded border">
            <p className="text-sm font-semibold text-gray-700 mb-2">Comandas por Status:</p>
            <div className="space-y-1">
              {Object.entries(statusStats).map(([status, stats]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{status}:</span>
                  <span className="font-medium text-gray-800">
                    {stats.count} comandas ({stats.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button
          variant="destructive"
          onClick={() => setShowDeleteAllConfirmation(true)}
          disabled={isDeleting}
          className="w-full flex items-center gap-2 bg-red-700 hover:bg-red-800"
        >
          <Trash2 size={16} />
          {isDeleting ? 'Deletando...' : 'DELETAR TUDO'}
        </Button>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 size={18} />
            Limpar Dados Antigos
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="text-red-600" size={20} />
              Limpeza de Dados Antigos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {/* Tabs para alternar entre modos */}
            <div className="flex border-b">
              <button
                onClick={() => setCleanupMode('by-date')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  cleanupMode === 'by-date'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar size={16} className="inline mr-2" />
                Por Data
              </button>
              <button
                onClick={() => setCleanupMode('all-paid')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  cleanupMode === 'all-paid'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <List size={16} className="inline mr-2" />
                Todas as Comandas
              </button>
              <button
                onClick={() => setCleanupMode('delete-all')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  cleanupMode === 'delete-all'
                    ? 'border-red-700 text-red-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Database size={16} className="inline mr-2" />
                Deletar Tudo
              </button>
            </div>

            {/* Aviso geral */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-yellow-600" size={20} />
                <span className="font-semibold text-yellow-800">Atenção!</span>
              </div>
              <p className="text-sm text-yellow-700">
                {cleanupMode === 'by-date' 
                  ? 'Esta ação irá deletar permanentemente todas as comandas pagas das datas selecionadas. Esta operação não pode ser desfeita.'
                  : cleanupMode === 'all-paid'
                  ? 'Esta ação irá deletar permanentemente TODAS as comandas pagas do sistema. Esta operação não pode ser desfeita.'
                  : 'Esta ação irá deletar permanentemente TODAS as comandas do sistema (abertas, pagas, canceladas). Esta operação não pode ser desfeita.'
                }
              </p>
            </div>

            {/* Conteúdo baseado no modo selecionado */}
            {cleanupMode === 'by-date' 
              ? renderByDateContent() 
              : cleanupMode === 'all-paid'
              ? renderAllPaidContent()
              : renderDeleteAllContent()
            }
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para deletar por data */}
      <AlertDialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={20} />
              Confirmar Exclusão por Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar todas as comandas pagas do dia{' '}
              <strong>{selectedDate ? formatBrazilianDateDirect(selectedDate) : ''}</strong>?
              {selectedDate === getCurrentBrazilianDate() && (
                <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
                  <strong>⚠️ ATENÇÃO:</strong> Esta é a data de hoje! Comandas podem estar sendo processadas.
                </div>
              )}
              <br />
              <br />
              Esta ação não pode ser desfeita e removerá permanentemente:
              <br />
              • Todas as comandas pagas desta data
              <br />
              • Todos os itens relacionados a essas comandas
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteByDate}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deletando...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para deletar todas as comandas */}
      <AlertDialog open={showAllPaidConfirmation} onOpenChange={() => {
        setShowAllPaidConfirmation(false);
        setConfirmationChecked(false);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={20} />
              Confirmar Exclusão Total
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="text-red-700 font-medium">
                ATENÇÃO: Esta ação irá deletar <strong>TODAS</strong> as {allPaidSummary.count} comandas pagas do sistema!
              </div>
              
              <div className="bg-red-50 p-3 rounded border">
                <p className="text-sm">
                  <strong>Comandas a serem deletadas:</strong> {allPaidSummary.count}
                  <br />
                  <strong>Valor total:</strong> {allPaidSummary.totalValue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
              </div>

              <div className="text-sm text-gray-600">
                Esta operação é <strong>irreversível</strong> e removerá permanentemente:
                <br />
                • Todas as comandas pagas (independente da data)
                <br />
                • Todos os itens relacionados a essas comandas
                <br />
                • Todo o histórico de vendas
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                <input
                  type="checkbox"
                  id="confirm-checkbox"
                  checked={confirmationChecked}
                  onChange={(e) => setConfirmationChecked(e.target.checked)}
                  className="h-4 w-4 text-red-600"
                />
                <label htmlFor="confirm-checkbox" className="text-sm font-medium">
                  Entendo que esta ação é irreversível e aceito a responsabilidade
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllPaid}
              disabled={isDeleting || !confirmationChecked}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deletando...' : 'Confirmar Exclusão Total'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para deletar TUDO */}
      <AlertDialog open={showDeleteAllConfirmation} onOpenChange={() => {
        setShowDeleteAllConfirmation(false);
        setDeleteAllConfirmationChecked(false);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-red-700" size={24} />
              CONFIRMAR EXCLUSÃO TOTAL DO SISTEMA
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="text-red-800 font-bold text-lg border-2 border-red-500 p-3 rounded bg-red-50">
                ⚠️ ATENÇÃO MÁXIMA: Esta ação irá deletar <strong>TODAS</strong> as {allComandasSummary.count} comandas do banco de dados!
              </div>
              
              <div className="bg-red-50 p-3 rounded border-2 border-red-300">
                <p className="text-sm font-semibold mb-2">O que será deletado:</p>
                <ul className="text-sm space-y-1">
                  <li>✗ Todas as comandas ABERTAS (em andamento)</li>
                  <li>✗ Todas as comandas PAGAS (histórico de vendas)</li>
                  <li>✗ Todas as comandas CANCELADAS</li>
                  <li>✗ Todos os itens relacionados</li>
                  <li>✗ TODO o histórico do sistema</li>
                </ul>
              </div>

              <div className="bg-gray-100 p-3 rounded border">
                <p className="text-sm">
                  <strong>Total de comandas:</strong> {allComandasSummary.count}
                  <br />
                  <strong>Valor total:</strong> {allComandasSummary.totalValue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
              </div>

              <div className="text-sm text-red-700 font-medium border-l-4 border-red-500 pl-3">
                Esta operação é <strong>IRREVERSÍVEL</strong> e resultará na perda completa de todos os dados. 
                O sistema ficará completamente vazio, como se fosse uma instalação nova.
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border-2">
                <input
                  type="checkbox"
                  id="delete-all-checkbox"
                  checked={deleteAllConfirmationChecked}
                  onChange={(e) => setDeleteAllConfirmationChecked(e.target.checked)}
                  className="h-5 w-5 text-red-600"
                />
                <label htmlFor="delete-all-checkbox" className="text-sm font-bold">
                  Entendo que vou perder TODOS os dados e aceito total responsabilidade
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isDeleting || !deleteAllConfirmationChecked}
              className="bg-red-700 hover:bg-red-800 disabled:opacity-50"
            >
              {isDeleting ? 'Deletando...' : 'CONFIRMAR EXCLUSÃO TOTAL'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
