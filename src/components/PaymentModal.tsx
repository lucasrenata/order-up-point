
import React, { useState, useRef, useEffect } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Banknote, AlertCircle } from 'lucide-react';
import { Comanda, PaymentSplit, Caixa } from '../types/types';
import { supabase } from '../lib/supabase';

interface PaymentModalProps {
  comanda: Comanda | null;
  multiComandas?: Comanda[];
  isMultiMode?: boolean;
  onClose: () => void;
  onConfirmPayment: (
    total: number, 
    formaPagamento: 'dinheiro' | 'pix' | 'debito' | 'credito' | 'voucher' | 'multiplo',
    paymentSplits?: PaymentSplit[],
    caixaId?: number,
    desconto?: number,
    descontoPercentual?: number,
    motivoDesconto?: string
  ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ comanda, multiComandas = [], isMultiMode = false, onClose, onConfirmPayment }) => {
  const [selectedPayment, setSelectedPayment] = useState<'dinheiro' | 'pix' | 'debito' | 'credito' | 'voucher' | null>(null);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [isSubmittingCash, setIsSubmittingCash] = useState(false);
  const cashInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para modo múltiplas formas
  const [isMultiPaymentMode, setIsMultiPaymentMode] = useState(false);
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([]);
  const [currentPaymentForm, setCurrentPaymentForm] = useState<'dinheiro' | 'pix' | 'debito' | 'credito' | 'voucher' | null>(null);
  const [currentPaymentValue, setCurrentPaymentValue] = useState('');
  const [showValueInput, setShowValueInput] = useState(false);
  
  // Estados para seleção de caixa
  const [selectedCaixa, setSelectedCaixa] = useState<Caixa | null>(null);
  const [caixasAbertos, setCaixasAbertos] = useState<Caixa[]>([]);
  const [showCaixaSelection, setShowCaixaSelection] = useState(true);
  
  // Estados para desconto
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountType, setDiscountType] = useState<'valor' | 'percentual'>('valor');
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  
  useEffect(() => {
    const fetchCaixasAbertos = async () => {
      const { data } = await supabase
        .from('caixas')
        .select('*')
        .eq('status', 'aberto')
        .order('numero_caixa', { ascending: true });
      
      setCaixasAbertos(data || []);
      
      // Se só tem 1 caixa aberto, seleciona automaticamente
      if (data && data.length === 1) {
        setSelectedCaixa(data[0]);
        setShowCaixaSelection(false);
      }
    };
    
    fetchCaixasAbertos();
  }, []);
  
  useEffect(() => {
    if (showCashModal && cashInputRef.current) {
      cashInputRef.current.focus();
    }
  }, [showCashModal]);

  if (!comanda && !isMultiMode) return null;
  
  const getSubtotal = (): number => {
    return isMultiMode 
      ? multiComandas.reduce((acc, cmd) => {
          return acc + cmd.comanda_itens.reduce(
            (sum, item) => sum + parseFloat(item.preco_unitario.toString()) * item.quantidade,
            0
          );
        }, 0)
      : comanda 
        ? comanda.comanda_itens.reduce(
            (acc, item) => acc + parseFloat(item.preco_unitario.toString()) * item.quantidade,
            0
          )
        : 0;
  };
  
  const total = getSubtotal() - appliedDiscount;

  // Helper functions for currency handling
  const parseCurrencyBR = (str: string): number => {
    const cleanStr = str.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };

  const formatCurrencyBR = (num: number): string => {
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getChange = (): number => {
    const received = parseCurrencyBR(cashReceived);
    return Math.max(received - total, 0);
  };

  const isCashAmountSufficient = (): boolean => {
    return parseCurrencyBR(cashReceived) >= total;
  };

  // Funções auxiliares para modo múltiplo
  const getTotalPaid = (): number => {
    return paymentSplits.reduce((sum, split) => sum + split.valor, 0);
  };

  const getRemainingAmount = (): number => {
    return Math.max(total - getTotalPaid(), 0);
  };

  const isPaymentComplete = (): boolean => {
    return getTotalPaid() >= total;
  };

  const formatValue = (value: string): number => {
    const cleanStr = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };

  const handleAddPaymentSplit = () => {
    if (!currentPaymentForm) return;
    
    const valor = formatValue(currentPaymentValue);
    const remaining = getRemainingAmount();
    
    if (valor <= 0) {
      return;
    }
    
    const adjustedValor = valor > remaining ? remaining : valor;
    const newSplit: PaymentSplit = {
      forma_pagamento: currentPaymentForm,
      valor: adjustedValor
    };
    
    setPaymentSplits([...paymentSplits, newSplit]);
    setCurrentPaymentForm(null);
    setCurrentPaymentValue('');
    setShowValueInput(false);
  };

  const handleRemovePaymentSplit = (index: number) => {
    setPaymentSplits(paymentSplits.filter((_, i) => i !== index));
  };

  const calculateDiscountValue = (): number => {
    const subtotal = getSubtotal();
    
    if (discountType === 'percentual') {
      const percentage = parseFloat(discountValue) || 0;
      if (percentage < 0 || percentage > 100) return 0;
      return (subtotal * percentage) / 100;
    } else {
      const valor = parseFloat(discountValue.replace(',', '.')) || 0;
      return Math.min(Math.max(valor, 0), subtotal);
    }
  };

  const handleApplyDiscount = () => {
    const discountAmount = calculateDiscountValue();
    
    if (discountAmount === 0) {
      alert('Valor de desconto inválido');
      return;
    }
    
    setAppliedDiscount(discountAmount);
    setShowDiscountInput(false);
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(0);
    setDiscountValue('');
    setDiscountReason('');
    setDiscountType('valor');
  };

  const paymentOptions = [
    { id: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: 'hover:bg-green-50' },
    { id: 'pix', label: 'PIX', icon: Smartphone, color: 'hover:bg-blue-50' },
    { id: 'debito', label: 'Cartão Débito', icon: CreditCard, color: 'hover:bg-purple-50' },
    { id: 'credito', label: 'Cartão Crédito', icon: CreditCard, color: 'hover:bg-orange-50' },
    { id: 'voucher', label: 'Voucher', icon: CreditCard, color: 'hover:bg-teal-50' },
  ];

  const handlePaymentSelection = (paymentId: 'dinheiro' | 'pix' | 'debito' | 'credito' | 'voucher') => {
    if (isMultiPaymentMode) {
      setCurrentPaymentForm(paymentId);
      setShowValueInput(true);
      setCurrentPaymentValue('');
    } else {
      setSelectedPayment(paymentId);
      if (paymentId === 'dinheiro') {
        setShowCashModal(true);
        setCashReceived('');
      }
    }
  };

  const handleConfirm = () => {
    if (!selectedCaixa) return;
    
    const descontoPercentual = discountType === 'percentual' 
      ? parseFloat(discountValue) 
      : undefined;
    
    if (isMultiPaymentMode) {
      if (isPaymentComplete()) {
        onConfirmPayment(
          total, 
          'multiplo', 
          paymentSplits, 
          selectedCaixa.id,
          appliedDiscount > 0 ? appliedDiscount : undefined,
          descontoPercentual,
          discountReason || undefined
        );
      }
    } else {
      if (selectedPayment && selectedPayment !== 'dinheiro') {
        onConfirmPayment(
          total, 
          selectedPayment, 
          undefined, 
          selectedCaixa.id,
          appliedDiscount > 0 ? appliedDiscount : undefined,
          descontoPercentual,
          discountReason || undefined
        );
      }
    }
  };

  const handleCashConfirm = () => {
    if (isCashAmountSufficient() && !isSubmittingCash && selectedCaixa) {
      setIsSubmittingCash(true);
      setShowCashModal(false);
      
      const descontoPercentual = discountType === 'percentual' 
        ? parseFloat(discountValue) 
        : undefined;
      
      onConfirmPayment(
        total, 
        'dinheiro', 
        undefined, 
        selectedCaixa.id,
        appliedDiscount > 0 ? appliedDiscount : undefined,
        descontoPercentual,
        discountReason || undefined
      );
    }
  };

  const handleCashCancel = () => {
    setShowCashModal(false);
    setSelectedPayment(null);
    setCashReceived('');
  };

  const renderMultiPaymentMode = () => {
    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {isMultiPaymentMode ? 'Múltiplas Formas' : 'Forma Única'}
          </h3>
          <button
            onClick={() => {
              setIsMultiPaymentMode(!isMultiPaymentMode);
              setPaymentSplits([]);
              setSelectedPayment(null);
            }}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all text-sm
              ${isMultiPaymentMode 
                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            {isMultiPaymentMode ? '✓ Modo Múltiplo' : 'Ativar Múltiplo'}
          </button>
        </div>

        {isMultiPaymentMode && paymentSplits.length > 0 && (
          <div className="mb-4 space-y-2 bg-gray-50 p-3 rounded-lg border">
            <p className="text-sm font-semibold text-gray-700 mb-2">Pagamentos Adicionados:</p>
            {paymentSplits.map((split, index) => {
              const option = paymentOptions.find(opt => opt.id === split.forma_pagamento);
              const Icon = option?.icon || DollarSign;
              return (
                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-gray-600" />
                    <span className="text-sm font-medium">{option?.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-green-600">
                      {split.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <button
                      onClick={() => handleRemovePaymentSplit(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
            
            <div className="pt-2 border-t mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Pago:</span>
                <span className="font-bold text-green-600">
                  {getTotalPaid().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-gray-800">Restante:</span>
                <span className={getRemainingAmount() > 0 ? 'text-red-600' : 'text-green-600'}>
                  {getRemainingAmount().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>
        )}

        {isMultiPaymentMode && !isPaymentComplete() && (
          <div className="space-y-3 mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Adicionar forma de pagamento:
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {paymentOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => handlePaymentSelection(option.id as any)}
                    className={`
                      p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2
                      border-gray-200 ${option.color}
                    `}
                  >
                    <Icon size={20} className="text-gray-600" />
                    <span className="text-xs font-medium text-gray-700">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Pagamento
          </h2>
          <p className="text-gray-500">
            {isMultiMode 
              ? `${multiComandas.length} comandas: ${multiComandas.map(c => `#${c.identificador_cliente}`).join(', ')}`
              : `Comanda #${comanda?.identificador_cliente}`
            }
          </p>
          <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200">
            {appliedDiscount > 0 && (
              <div className="mb-2 pb-2 border-b border-green-300">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span className="line-through">
                    {getSubtotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-orange-600 font-semibold">
                  <span>Desconto:</span>
                  <span>- {appliedDiscount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-600 mb-1">Total a pagar</p>
            <p className="text-3xl font-bold text-green-600">
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        {/* Seção de Desconto */}
        {!showDiscountInput && appliedDiscount === 0 && (
          <button
            onClick={() => setShowDiscountInput(true)}
            className="w-full mb-4 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-orange-600"
          >
            <span className="text-xl">🏷️</span>
            <span className="font-semibold">Adicionar Desconto</span>
          </button>
        )}

        {showDiscountInput && (
          <div className="mb-4 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                🏷️ Aplicar Desconto
              </h3>
              <button
                onClick={() => {
                  setShowDiscountInput(false);
                  setDiscountValue('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setDiscountType('valor')}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  discountType === 'valor'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                R$ Valor
              </button>
              <button
                onClick={() => setDiscountType('percentual')}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  discountType === 'percentual'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                % Percentual
              </button>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {discountType === 'valor' ? 'Valor do desconto (R$)' : 'Percentual (%)'}
              </label>
              <input
                type="number"
                step={discountType === 'valor' ? '0.01' : '1'}
                min="0"
                max={discountType === 'percentual' ? '100' : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'valor' ? '0.00' : '0'}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-semibold"
                autoFocus
              />
              {discountType === 'valor' && (
                <p className="text-xs text-gray-500 mt-1">
                  Máximo: {getSubtotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              )}
            </div>
            
            {discountValue && parseFloat(discountValue) > 0 && (
              <div className="mb-3 p-2 bg-white rounded border border-orange-300">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Desconto:</span>
                  <span className="font-bold text-orange-600">
                    - {calculateDiscountValue().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-800">Total com desconto:</span>
                  <span className="text-green-600">
                    {(getSubtotal() - calculateDiscountValue()).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            )}
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo (opcional)
              </label>
              <input
                type="text"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="Ex: Cliente frequente, promoção... (opcional)"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                maxLength={100}
              />
            </div>
            
            <button
              onClick={handleApplyDiscount}
              disabled={!discountValue || parseFloat(discountValue) <= 0}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Aplicar Desconto
            </button>
          </div>
        )}

        {appliedDiscount > 0 && !showDiscountInput && (
          <div className="mb-4 p-3 bg-orange-50 rounded-lg border-2 border-orange-300">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-orange-800 flex items-center gap-2">
                🏷️ Desconto Aplicado
              </h4>
              <button
                onClick={handleRemoveDiscount}
                className="text-red-500 hover:text-red-700 text-sm underline"
              >
                Remover
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">
                  {getSubtotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Desconto:</span>
                <span className="font-semibold text-orange-600">
                  - {appliedDiscount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              {discountReason && (
                <p className="text-xs text-gray-500 italic">"{discountReason}"</p>
              )}
            </div>
          </div>
        )}

        {/* Seleção de Caixa */}
        {showCaixaSelection && caixasAbertos.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Selecione o caixa
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {caixasAbertos.map((caixa) => (
                <button
                  key={caixa.id}
                  onClick={() => {
                    setSelectedCaixa(caixa);
                    setShowCaixaSelection(false);
                  }}
                  className={`
                    p-3 rounded-lg border-2 transition-all duration-200 text-left
                    ${selectedCaixa?.id === caixa.id 
                      ? 'border-blue-500 bg-blue-100' 
                      : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">Caixa {caixa.numero_caixa}</p>
                      <p className="text-sm text-gray-600">{caixa.nome_operador}</p>
                    </div>
                    {selectedCaixa?.id === caixa.id && (
                      <div className="text-blue-600">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {selectedCaixa && (
              <button
                onClick={() => setShowCaixaSelection(false)}
                className="w-full mt-3 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
              >
                Continuar
              </button>
            )}
          </div>
        )}

        {caixasAbertos.length === 0 && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border-2 border-red-200">
            <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Nenhum caixa aberto
            </h3>
            <p className="text-sm text-red-600 mb-3">
              Para processar pagamentos, é necessário abrir um caixa primeiro.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Fechar
            </button>
          </div>
        )}

        {selectedCaixa && !showCaixaSelection && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Processando no:</p>
              <p className="font-semibold text-gray-800">
                Caixa {selectedCaixa.numero_caixa} - {selectedCaixa.nome_operador}
              </p>
            </div>
            <button
              onClick={() => setShowCaixaSelection(true)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Trocar
            </button>
          </div>
        )}

        {selectedCaixa && !showCaixaSelection && caixasAbertos.length > 0 && (
          <div className="space-y-4 mb-6">
            {renderMultiPaymentMode()}
            
            {!isMultiPaymentMode && (
              <>
                <h3 className="text-lg font-semibold text-gray-800 text-center">Selecione a forma de pagamento</h3>
            
                <div className="grid grid-cols-2 gap-3">
                  {paymentOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedPayment === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handlePaymentSelection(option.id as any)}
                      className={`
                        p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : `border-gray-200 ${option.color}`
                        }
                      `}
                    >
                      <Icon size={24} className={isSelected ? 'text-blue-600' : 'text-gray-600'} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
                </div>
              </>
            )}
          </div>
        )}

        {selectedCaixa && !showCaixaSelection && caixasAbertos.length > 0 && (
          <div className="space-y-3">
            {isMultiPaymentMode ? (
            <button 
              onClick={handleConfirm}
              disabled={!isPaymentComplete()}
              className={`
                w-full font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg shadow-lg
                ${isPaymentComplete()
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <DollarSign size={22} />
              Confirmar Pagamento Dividido
            </button>
          ) : (
            selectedPayment !== 'dinheiro' && (
              <button 
                onClick={handleConfirm}
                disabled={!selectedPayment}
                className={`
                  w-full font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg shadow-lg
                  ${selectedPayment 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <DollarSign size={22} />
                Confirmar Pagamento
              </button>
            )
          )}
          <button 
            onClick={onClose} 
            className="w-full bg-gray-200 text-gray-800 font-bold py-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 text-lg"
          >
              <X size={22} />
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Cash Payment Modal */}
      {showCashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Pagamento em Dinheiro</h2>
              <p className="text-gray-500">
                {isMultiMode 
                  ? `${multiComandas.length} comandas`
                  : `Comanda #${comanda?.identificador_cliente}`
                }
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor recebido
              </label>
              <input
                ref={cashInputRef}
                type="text"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="R$ 0,00"
                className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {cashReceived && (
                <p className={`mt-2 text-sm ${isCashAmountSufficient() ? 'text-green-600' : 'text-red-500'}`}>
                  {isCashAmountSufficient() 
                    ? `✓ Troco: ${getChange().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                    : '⚠ Valor insuficiente'
                  }
                </p>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCashConfirm}
                disabled={!isCashAmountSufficient() || isSubmittingCash}
                className={`
                  w-full font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2
                  ${isCashAmountSufficient() && !isSubmittingCash
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {isSubmittingCash ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <DollarSign size={18} />
                    Confirmar Dinheiro
                  </>
                )}
              </button>
              <button
                onClick={handleCashCancel}
                disabled={isSubmittingCash}
                className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Value Input Modal for Multi-Payment */}
      {showValueInput && currentPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {paymentOptions.find(opt => opt.id === currentPaymentForm)?.label}
              </h2>
              <p className="text-sm text-gray-600">
                Valor restante: {getRemainingAmount().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor a pagar nesta forma:
              </label>
              <input
                type="text"
                value={currentPaymentValue}
                onChange={(e) => setCurrentPaymentValue(e.target.value)}
                placeholder="0,00"
                autoFocus
                className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {currentPaymentValue && formatValue(currentPaymentValue) > getRemainingAmount() && (
                <p className="text-orange-500 text-sm mt-1">
                  Valor será ajustado para {getRemainingAmount().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={handleAddPaymentSplit}
                disabled={!currentPaymentValue || formatValue(currentPaymentValue) <= 0}
                className={`
                  w-full font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2
                  ${currentPaymentValue && formatValue(currentPaymentValue) > 0
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <DollarSign size={18} />
                Adicionar
              </button>
              <button
                onClick={() => {
                  setShowValueInput(false);
                  setCurrentPaymentForm(null);
                  setCurrentPaymentValue('');
                }}
                className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
