import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGerenciamentoCaixa } from '@/hooks/useGerenciamentoCaixa';
import { Caixa } from '@/types/types';
import {
  Wallet,
  CheckCircle,
  XCircle,
  ArrowDownCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

interface CaixaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ViewType = 'list' | 'details' | 'open';

export const CaixaModal = ({ open, onOpenChange }: CaixaModalProps) => {
  const {
    caixas,
    retiradas,
    vendasDinheiro,
    vendasPorForma,
    totalComandas,
    loading,
    fetchCaixas,
    abrirCaixa,
    fecharCaixa,
    adicionarRetirada,
    fetchRetiradas,
  } = useGerenciamentoCaixa();

  const [view, setView] = useState<ViewType>('list');
  const [selectedCaixa, setSelectedCaixa] = useState<Caixa | null>(null);
  
  // Form states
  const [nomeOperador, setNomeOperador] = useState('');
  const [valorAbertura, setValorAbertura] = useState('');
  const [valorRetirada, setValorRetirada] = useState('');
  const [observacaoRetirada, setObservacaoRetirada] = useState('');

  useEffect(() => {
    if (open) {
      fetchCaixas();
      setView('list');
    }
  }, [open]);

  const handleSelectCaixa = (caixa: Caixa) => {
    setSelectedCaixa(caixa);
    if (caixa.status === 'aberto' && caixa.id !== 0) {
      setView('details');
      fetchRetiradas(caixa.id);
    } else {
      setView('open');
    }
  };

  const handleAbrirCaixa = async () => {
    if (!selectedCaixa || !nomeOperador.trim() || !valorAbertura) return;

    if (nomeOperador.length < 3) {
      alert('Nome do operador deve ter no mínimo 3 caracteres');
      return;
    }

    const valor = parseFloat(valorAbertura);
    if (isNaN(valor) || valor < 0) {
      alert('Valor de abertura inválido');
      return;
    }

    try {
      await abrirCaixa(selectedCaixa.numero_caixa, nomeOperador, valor);
      setNomeOperador('');
      setValorAbertura('');
      setView('list');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleAdicionarRetirada = async () => {
    if (!selectedCaixa || !valorRetirada) return;

    const valor = parseFloat(valorRetirada);
    if (isNaN(valor) || valor <= 0) {
      alert('Valor de retirada inválido');
      return;
    }

    if (valor > 100 && !observacaoRetirada.trim()) {
      alert('Observação obrigatória para retiradas acima de R$ 100,00');
      return;
    }

    const totalRetiradas = retiradas.reduce((acc, r) => acc + r.valor, 0);
    const saldoAtual = selectedCaixa.valor_abertura - totalRetiradas;

    if (valor > saldoAtual) {
      alert('Valor de retirada maior que o saldo disponível');
      return;
    }

    try {
      await adicionarRetirada(selectedCaixa.id, valor, observacaoRetirada);
      setValorRetirada('');
      setObservacaoRetirada('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleFecharCaixa = async () => {
    if (!selectedCaixa) return;

    const confirmar = window.confirm(
      `Tem certeza que deseja fechar o Caixa ${selectedCaixa.numero_caixa}?`
    );

    if (confirmar) {
      try {
        await fecharCaixa(selectedCaixa.id);
        setView('list');
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  const calcularSaldo = () => {
    if (!selectedCaixa) return 0;
    const totalRetiradas = retiradas.reduce((acc, r) => acc + r.valor, 0);
    return selectedCaixa.valor_abertura - totalRetiradas + vendasDinheiro;
  };

  const renderListView = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Gerenciamento de Caixa
        </DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
        {caixas.map((caixa) => (
          <Card key={caixa.numero_caixa} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Caixa {caixa.numero_caixa}</span>
                {caixa.status === 'aberto' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Status:</span>{' '}
                  <span
                    className={
                      caixa.status === 'aberto'
                        ? 'text-green-600 font-semibold'
                        : 'text-gray-500'
                    }
                  >
                    {caixa.status === 'aberto' ? 'Aberto' : 'Fechado'}
                  </span>
                </p>
                {caixa.status === 'aberto' && caixa.nome_operador && (
                  <p className="text-sm">
                    <span className="font-semibold">Operador:</span>{' '}
                    {caixa.nome_operador}
                  </p>
                )}
                <Button
                  onClick={() => handleSelectCaixa(caixa)}
                  variant={caixa.status === 'aberto' ? 'default' : 'outline'}
                  className="w-full mt-2"
                  disabled={loading}
                >
                  {caixa.status === 'aberto' ? 'Detalhes' : 'Abrir'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );

  const renderOpenView = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView('list')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          Abrir Caixa {selectedCaixa?.numero_caixa}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="nome-operador">Nome do Operador</Label>
          <Input
            id="nome-operador"
            value={nomeOperador}
            onChange={(e) => setNomeOperador(e.target.value)}
            placeholder="Digite o nome do operador"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="valor-abertura">Valor de Abertura (R$)</Label>
          <Input
            id="valor-abertura"
            type="number"
            step="0.01"
            min="0"
            value={valorAbertura}
            onChange={(e) => setValorAbertura(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setView('list')}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAbrirCaixa}
            className="flex-1"
            disabled={loading || !nomeOperador.trim() || !valorAbertura}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Abrir Caixa'
            )}
          </Button>
        </div>
      </div>
    </>
  );

  const renderDetailsView = () => {
    const totalRetiradas = retiradas.reduce((acc, r) => acc + r.valor, 0);
    const saldo = calcularSaldo();
    const totalVendas = Object.values(vendasPorForma).reduce((acc, val) => acc + val, 0);

    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView('list')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            Caixa {selectedCaixa?.numero_caixa} - {selectedCaixa?.nome_operador}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Informações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">📊 Saldo do Caixa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>💰 Abertura:</span>
                <span className="font-semibold">
                  R$ {selectedCaixa?.valor_abertura.toFixed(2)}{' '}
                  {selectedCaixa?.data_abertura &&
                    `(${format(
                      new Date(selectedCaixa.data_abertura),
                      'HH:mm'
                    )})`}
                </span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>💵 Vendas (Dinheiro):</span>
                <span className="font-semibold">
                  + R$ {vendasDinheiro.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>💸 Retiradas:</span>
                <span className="font-semibold">
                  - R$ {totalRetiradas.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Saldo Total:</span>
                <span className="font-bold text-green-600 text-lg">
                  R$ {saldo.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Vendas por Forma de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">📊 Vendas Hoje (Todas as Formas)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>💵 Dinheiro:</span>
                <span className="font-semibold text-green-600">
                  R$ {(vendasPorForma.dinheiro || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>📱 PIX:</span>
                <span className="font-semibold text-blue-600">
                  R$ {(vendasPorForma.pix || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>💳 Débito:</span>
                <span className="font-semibold text-purple-600">
                  R$ {(vendasPorForma.debito || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>💳 Crédito:</span>
                <span className="font-semibold text-orange-600">
                  R$ {(vendasPorForma.credito || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold">TOTAL:</span>
                <span className="font-bold text-green-600 text-lg">
                  R$ {totalVendas.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-1 text-gray-600">
                <span>🧾 Comandas processadas:</span>
                <span className="font-semibold">{totalComandas}</span>
              </div>
            </CardContent>
          </Card>

          {/* Nova Retirada */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4" />
                Nova Retirada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="valor-retirada">Valor (R$)</Label>
                <Input
                  id="valor-retirada"
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorRetirada}
                  onChange={(e) => setValorRetirada(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacao-retirada">Observação</Label>
                <Textarea
                  id="observacao-retirada"
                  value={observacaoRetirada}
                  onChange={(e) => setObservacaoRetirada(e.target.value)}
                  placeholder="Ex: Depósito bancário, troco..."
                  rows={2}
                />
              </div>
              <Button
                onClick={handleAdicionarRetirada}
                className="w-full"
                disabled={loading || !valorRetirada}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Adicionar Retirada'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Histórico de Retiradas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">📋 Histórico de Retiradas</CardTitle>
            </CardHeader>
            <CardContent>
              {retiradas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma retirada registrada
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {retiradas.map((retirada) => (
                    <div
                      key={retirada.id}
                      className="border rounded-lg p-3 space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-red-600">
                          R$ {retirada.valor.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(
                            new Date(retirada.data_retirada),
                            'dd/MM/yyyy HH:mm'
                          )}
                        </span>
                      </div>
                      {retirada.observacao && (
                        <p className="text-xs text-muted-foreground">
                          "{retirada.observacao}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão Fechar Caixa */}
          <Button
            onClick={handleFecharCaixa}
            variant="destructive"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Fechar Caixa'
            )}
          </Button>
        </div>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {view === 'list' && renderListView()}
        {view === 'open' && renderOpenView()}
        {view === 'details' && renderDetailsView()}
      </DialogContent>
    </Dialog>
  );
};
