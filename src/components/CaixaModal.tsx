import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGerenciamentoCaixa } from '@/hooks/useGerenciamentoCaixa';
import { Caixa } from '@/types/types';
import {
  Wallet,
  CheckCircle,
  XCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { generatePDFFechamentoCaixa } from '@/utils/pdfGeneratorCaixa';
import { toast } from '@/hooks/use-toast';

interface CaixaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ViewType = 'list' | 'details' | 'open';

export const CaixaModal = ({ open, onOpenChange }: CaixaModalProps) => {
  const {
    caixas,
    retiradas,
    entradas,
    pagamentosReserva,
    vendasDinheiro,
    vendasPorForma,
    totalComandas,
    loading,
    fetchCaixas,
    abrirCaixa,
    fecharCaixa,
    adicionarRetirada,
    adicionarEntrada,
    adicionarPagamentoReserva,
    fetchRetiradas,
    buscarDadosCompletosCaixa,
    deletarDadosCaixa,
  } = useGerenciamentoCaixa();

  const [view, setView] = useState<ViewType>('list');
  const [selectedCaixa, setSelectedCaixa] = useState<Caixa | null>(null);
  const [showFechamentoDialog, setShowFechamentoDialog] = useState(false);
  
  // Form states
  const [nomeOperador, setNomeOperador] = useState('');
  const [valorAbertura, setValorAbertura] = useState('');
  const [valorRetirada, setValorRetirada] = useState('');
  const [observacaoRetirada, setObservacaoRetirada] = useState('');
  const [valorEntrada, setValorEntrada] = useState('');
  const [observacaoEntrada, setObservacaoEntrada] = useState('');
  const [valorReserva, setValorReserva] = useState('');
  const [formaPagamentoReserva, setFormaPagamentoReserva] = useState<'dinheiro' | 'pix' | 'debito' | 'credito'>('dinheiro');
  const [clienteNomeReserva, setClienteNomeReserva] = useState('');
  const [observacaoReserva, setObservacaoReserva] = useState('');

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

    const saldoAtual = calcularSaldo();

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

  const handleAdicionarEntrada = async () => {
    if (!selectedCaixa || !valorEntrada) return;

    const valor = parseFloat(valorEntrada);
    if (isNaN(valor) || valor <= 0) {
      alert('Valor de entrada inválido');
      return;
    }

    if (!observacaoEntrada.trim()) {
      alert('Observação obrigatória para entradas de dinheiro');
      return;
    }

    try {
      await adicionarEntrada(selectedCaixa.id, valor, observacaoEntrada);
      setValorEntrada('');
      setObservacaoEntrada('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleAdicionarPagamentoReserva = async () => {
    if (!selectedCaixa || !valorReserva || !clienteNomeReserva.trim()) return;

    const valor = parseFloat(valorReserva);
    if (isNaN(valor) || valor <= 0) {
      alert('Valor inválido');
      return;
    }

    if (clienteNomeReserva.trim().length < 3) {
      alert('Nome do cliente deve ter no mínimo 3 caracteres');
      return;
    }

    try {
      await adicionarPagamentoReserva(
        selectedCaixa.id,
        valor,
        formaPagamentoReserva,
        clienteNomeReserva.trim(),
        observacaoReserva.trim()
      );
      setValorReserva('');
      setFormaPagamentoReserva('dinheiro');
      setClienteNomeReserva('');
      setObservacaoReserva('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleFecharCaixa = async () => {
    if (!selectedCaixa) return;
    setShowFechamentoDialog(true);
  };

  const handleConfirmarFechamento = async () => {
    if (!selectedCaixa) return;
    
    try {
      setShowFechamentoDialog(false);

      // 1. Buscar dados completos do caixa
      toast({
        title: 'Preparando fechamento...',
        description: 'Gerando relatório em PDF',
      });

      const dadosCompletos = await buscarDadosCompletosCaixa(selectedCaixa.id);

      // 2. Gerar PDF de fechamento
      await generatePDFFechamentoCaixa(dadosCompletos);
      
      toast({
        title: '📄 PDF gerado',
        description: 'Aguarde a limpeza dos dados...',
      });

      // 3. Aguardar 2 segundos para garantir que o download começou
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 4. Fechar o caixa (atualizar status)
      await fecharCaixa(selectedCaixa.id);

      // 5. Deletar dados do banco
      await deletarDadosCaixa(selectedCaixa.id);

      toast({
        title: '✅ Caixa fechado',
        description: 'Dados limpos e relatório gerado',
      });

      // 6. Voltar para lista
      setView('list');
      
    } catch (error: any) {
      toast({
        title: '❌ Erro no fechamento',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const calcularSaldo = () => {
    if (!selectedCaixa) return 0;
    const totalRetiradas = retiradas.reduce((acc, r) => acc + r.valor, 0);
    const totalEntradas = entradas.reduce((acc, e) => acc + e.valor, 0);
    const totalReservasDinheiro = pagamentosReserva
      .filter(p => p.forma_pagamento === 'dinheiro')
      .reduce((acc, p) => acc + p.valor, 0);
    return selectedCaixa.valor_abertura + vendasDinheiro + totalReservasDinheiro + totalEntradas - totalRetiradas;
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
              <div className="flex justify-between text-sm">
                <span>💵 Vendas (Dinheiro):</span>
                <span className="font-semibold text-green-600">
                  + R$ {vendasDinheiro.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>🎫 Reservas (Dinheiro):</span>
                <span className="font-semibold text-indigo-600">
                  + R$ {pagamentosReserva.filter(p => p.forma_pagamento === 'dinheiro').reduce((acc, p) => acc + p.valor, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>📥 Entradas:</span>
                <span className="font-semibold text-green-600">
                  + R$ {entradas.reduce((acc, e) => acc + e.valor, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>💸 Retiradas:</span>
                <span className="font-semibold text-red-600">
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
              <CardTitle className="text-base">📊 Resumo de Recebimentos Hoje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Vendas (Comandas)</p>
                <div className="flex justify-between text-sm">
                  <span>💵 Dinheiro:</span>
                  <span className="font-semibold text-green-600">
                    R$ {(vendasPorForma.dinheiro || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>📱 PIX:</span>
                  <span className="font-semibold text-blue-600">
                    R$ {(vendasPorForma.pix || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>💳 Débito:</span>
                  <span className="font-semibold text-purple-600">
                    R$ {(vendasPorForma.debito || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>💳 Crédito:</span>
                  <span className="font-semibold text-orange-600">
                    R$ {(vendasPorForma.credito || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="border-t pt-2"></div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                  🎫 Reservas ({pagamentosReserva.length})
                </p>
                <div className="flex justify-between text-sm">
                  <span>Total Reservas:</span>
                  <span className="font-semibold text-indigo-600">
                    R$ {pagamentosReserva.reduce((acc, p) => acc + p.valor, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between border-t pt-2">
                <span className="font-bold">TOTAL GERAL:</span>
                <span className="font-bold text-green-600 text-lg">
                  R$ {totalVendas.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-1 text-gray-600 text-sm">
                <span>🧾 Comandas processadas:</span>
                <span className="font-semibold">{totalComandas}</span>
              </div>
            </CardContent>
          </Card>

          {/* Pagamento de Reserva */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                🎫 Pagamento de Reserva
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="cliente-nome-reserva">Nome do Cliente *</Label>
                <Input
                  id="cliente-nome-reserva"
                  type="text"
                  value={clienteNomeReserva}
                  onChange={(e) => setClienteNomeReserva(e.target.value)}
                  placeholder="Nome completo do cliente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor-reserva">Valor (R$) *</Label>
                <Input
                  id="valor-reserva"
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorReserva}
                  onChange={(e) => setValorReserva(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forma-pagamento-reserva">Forma de Pagamento *</Label>
                <Select
                  value={formaPagamentoReserva}
                  onValueChange={(value: 'dinheiro' | 'pix' | 'debito' | 'credito') => 
                    setFormaPagamentoReserva(value)
                  }
                >
                  <SelectTrigger id="forma-pagamento-reserva">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                    <SelectItem value="pix">📱 PIX</SelectItem>
                    <SelectItem value="debito">💳 Débito</SelectItem>
                    <SelectItem value="credito">🏦 Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacao-reserva">Observação</Label>
                <Textarea
                  id="observacao-reserva"
                  value={observacaoReserva}
                  onChange={(e) => setObservacaoReserva(e.target.value)}
                  placeholder=""
                  rows={2}
                />
              </div>
              <Button
                onClick={handleAdicionarPagamentoReserva}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={loading || !valorReserva || !clienteNomeReserva.trim()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  '🎫 Registrar Pagamento'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Nova Entrada */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-green-600" />
                Nova Entrada de Dinheiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="valor-entrada">Valor (R$)</Label>
                <Input
                  id="valor-entrada"
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorEntrada}
                  onChange={(e) => setValorEntrada(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacao-entrada">Observação (obrigatório)</Label>
                <Textarea
                  id="observacao-entrada"
                  value={observacaoEntrada}
                  onChange={(e) => setObservacaoEntrada(e.target.value)}
                  placeholder="Ex: Troco adicional, suprimento..."
                  rows={2}
                />
              </div>
              <Button
                onClick={handleAdicionarEntrada}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading || !valorEntrada || !observacaoEntrada.trim()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Adicionar Entrada'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Nova Retirada */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-red-600" />
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
                className="w-full bg-red-600 hover:bg-red-700"
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

          {/* Histórico de Pagamentos de Reserva */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">🎫 Histórico de Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              {pagamentosReserva.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pagamento de reserva registrado
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pagamentosReserva.map((pagamento) => {
                    const formaIcon = {
                      dinheiro: '💵',
                      pix: '📱',
                      debito: '💳',
                      credito: '🏦',
                    }[pagamento.forma_pagamento];
                    
                    const formaColor = {
                      dinheiro: 'text-green-600',
                      pix: 'text-blue-600',
                      debito: 'text-purple-600',
                      credito: 'text-orange-600',
                    }[pagamento.forma_pagamento];

                    return (
                      <div
                        key={pagamento.id}
                        className="border rounded-lg p-3 space-y-1 bg-indigo-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-indigo-900">
                              👤 {pagamento.cliente_nome}
                            </p>
                            <p className={`text-sm font-semibold ${formaColor}`}>
                              {formaIcon} R$ {pagamento.valor.toFixed(2)}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(
                              new Date(pagamento.data_pagamento),
                              'dd/MM/yyyy HH:mm'
                            )}
                          </span>
                        </div>
                        {pagamento.observacao && (
                          <p className="text-xs text-muted-foreground">
                            "{pagamento.observacao}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Entradas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">📋 Histórico de Entradas</CardTitle>
            </CardHeader>
            <CardContent>
              {entradas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma entrada registrada
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {entradas.map((entrada) => (
                    <div
                      key={entrada.id}
                      className="border rounded-lg p-3 space-y-1 bg-green-50"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-green-600">
                          + R$ {entrada.valor.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(
                            new Date(entrada.data_entrada),
                            'dd/MM/yyyy HH:mm'
                          )}
                        </span>
                      </div>
                      {entrada.observacao && (
                        <p className="text-xs text-muted-foreground">
                          "{entrada.observacao}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {view === 'list' && renderListView()}
          {view === 'open' && renderOpenView()}
          {view === 'details' && renderDetailsView()}
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Fechamento */}
      <AlertDialog open={showFechamentoDialog} onOpenChange={setShowFechamentoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              📄 Fechamento de Caixa
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-base">
                Será realizado um <strong>download do relatório de fechamento</strong> para armazenar no seu PC.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-semibold">
                  ⚠️ Atenção: Após o download, todos os dados deste caixa serão <strong>deletados permanentemente</strong> do sistema.
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Certifique-se de salvar o PDF em um local seguro para consultas futuras.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarFechamento}>
              OK, Fechar e Baixar PDF
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
