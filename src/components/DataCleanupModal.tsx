
import React, { useState } from 'react';
import { Trash2, Calendar, Package, DollarSign, AlertTriangle } from 'lucide-react';
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

export const DataCleanupModal: React.FC = () => {
  const { dateSummaries, isLoading, isDeleting, deleteComandasByDate } = useDataCleanup();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleDeleteConfirm = async () => {
    if (selectedDate) {
      await deleteComandasByDate(selectedDate);
      setSelectedDate(null);
    }
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="text-red-600" size={20} />
              Limpeza de Dados Antigos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-yellow-600" size={20} />
                <span className="font-semibold text-yellow-800">Atenção!</span>
              </div>
              <p className="text-sm text-yellow-700">
                Esta ação irá deletar permanentemente todas as comandas pagas das datas selecionadas. 
                Esta operação não pode ser desfeita.
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : dateSummaries.length === 0 ? (
              <div className="text-center py-8">
                <Package className="text-gray-400 mx-auto mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Nenhum dado antigo encontrado
                </h3>
                <p className="text-gray-600">
                  Não há comandas pagas antigas para serem removidas.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {dateSummaries.map((summary) => (
                  <div
                    key={summary.date}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="text-blue-600" size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {formatDate(summary.date)}
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
                      Excluir
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={20} />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar todas as comandas pagas do dia{' '}
              <strong>{selectedDate ? formatDate(selectedDate) : ''}</strong>?
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
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deletando...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
