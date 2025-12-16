import { useEffect, useState } from 'react';
import { useMovimentacoes } from '@/hooks/useMovimentacoes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Trash2, AlertTriangle, ShoppingCart, Calendar, DollarSign, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatarMoeda = (valor: number) => {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatarData = (dataStr: string) => {
  try {
    const data = new Date(dataStr);
    return format(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dataStr;
  }
};

const formatarFormaPagamento = (forma: string | null | undefined) => {
  const formas: Record<string, { label: string; icon: string; color: string }> = {
    dinheiro: { label: 'Dinheiro', icon: '💵', color: 'text-green-600' },
    pix: { label: 'PIX', icon: '📱', color: 'text-blue-600' },
    debito: { label: 'Débito', icon: '💳', color: 'text-purple-600' },
    credito: { label: 'Crédito', icon: '🏦', color: 'text-orange-600' },
    multiplo: { label: 'Múltiplo', icon: '🔀', color: 'text-indigo-600' }
  };
  return formas[forma || ''] || { label: forma || 'N/A', icon: '❓', color: 'text-gray-600' };
};

export const MovimentacoesTab = () => {
  const {
    movimentacoes,
    dadosAntigos,
    isLoading,
    isDeleting,
    fetchMovimentacoes,
    verificarDadosAntigos,
    deletarDadosAntigos
  } = useMovimentacoes();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchMovimentacoes();
    verificarDadosAntigos();
  }, [fetchMovimentacoes, verificarDadosAntigos]);

  const handleConfirmarDelete = async () => {
    setShowDeleteDialog(false);
    await deletarDadosAntigos();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerta de dados antigos */}
      {dadosAntigos.existe && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800 font-semibold">
            Dados com mais de 7 dias encontrados!
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            <div className="mt-2 space-y-1">
              <p><strong>{dadosAntigos.quantidade}</strong> comandas anteriores a {dadosAntigos.dataLimite}</p>
              <p>Valor total: <strong>{formatarMoeda(dadosAntigos.valorTotal)}</strong></p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="mt-3"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Deletar Dados Antigos
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Resumo do período */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Receipt className="h-4 w-4" />
              <span className="text-xs font-medium">Comandas</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">{movimentacoes?.totalComandas || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Valor Total</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-green-800">
              {formatarMoeda(movimentacoes?.valorTotal || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Dias</span>
            </div>
            <p className="text-2xl font-bold text-purple-800">{movimentacoes?.diasComDados || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-xs font-medium">Ticket Médio</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-orange-800">
              {movimentacoes && movimentacoes.totalComandas > 0
                ? formatarMoeda(movimentacoes.valorTotal / movimentacoes.totalComandas)
                : 'R$ 0,00'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Período */}
      {movimentacoes && (
        <p className="text-sm text-gray-500 text-center">
          📅 Período: {movimentacoes.dataInicio} até {movimentacoes.dataFim}
        </p>
      )}

      {/* Lista de comandas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Comandas Recentes (Últimos 7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {movimentacoes?.comandas && movimentacoes.comandas.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {movimentacoes.comandas.map((comanda) => {
                const formaPag = formatarFormaPagamento(comanda.forma_pagamento);
                return (
                  <div
                    key={comanda.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-gray-700">#{comanda.identificador_cliente}</span>
                      <span className="text-sm text-gray-500">
                        {comanda.data_pagamento && formatarData(comanda.data_pagamento)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                      <span className={`text-sm font-medium ${formaPag.color}`}>
                        {formaPag.icon} {formaPag.label}
                      </span>
                      <span className="font-bold text-green-600">
                        {formatarMoeda(comanda.total || 0)}
                      </span>
                      {comanda.desconto && comanda.desconto > 0 && (
                        <span className="text-xs text-red-500">
                          (-{formatarMoeda(comanda.desconto)})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Nenhuma comanda encontrada nos últimos 7 dias</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Você está prestes a deletar permanentemente:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><strong>{dadosAntigos.quantidade}</strong> comandas e seus itens</li>
                <li>Valor total: <strong>{formatarMoeda(dadosAntigos.valorTotal)}</strong></li>
                <li>Dados anteriores a <strong>{dadosAntigos.dataLimite}</strong></li>
              </ul>
              <p className="text-red-600 font-medium mt-4">
                ⚠️ Esta ação não pode ser desfeita!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar Dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
