
import React, { useState } from 'react';
import { Weight, Barcode, Zap } from 'lucide-react';
import { Product } from '../types/types';

interface InputPanelProps {
  produtos: Product[];
  onAddProduto: (produto: Product) => void;
  onAddPratoPorPeso: (valor: number) => void;
  activeComandaId?: number;
}

export const InputPanel: React.FC<InputPanelProps> = ({ produtos, onAddProduto, onAddPratoPorPeso, activeComandaId }) => {
  const [categoriaAtiva, setCategoriaAtiva] = useState<'bebidas' | 'sobremesas'>('bebidas');
  const [valorPeso, setValorPeso] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPeso = async () => {
    if (!activeComandaId) { 
      alert("Por favor, ative uma comanda primeiro."); 
      return; 
    }
    
    const valor = parseFloat(valorPeso.replace(',', '.'));
    if (!isNaN(valor) && valor > 0) {
      setIsLoading(true);
      await onAddPratoPorPeso(valor);
      setValorPeso('');
      setIsLoading(false);
    } else { 
      alert("Por favor, insira um valor válido."); 
    }
  };

  const handleScanProduct = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!activeComandaId) { 
        alert("Por favor, ative uma comanda primeiro."); 
        return; 
      }
      
      const produto = produtos.find(p => p.barcode === scannedBarcode);
      if (produto) {
        setIsLoading(true);
        await onAddProduto(produto);
        setScannedBarcode('');
        setIsLoading(false);
      } else { 
        alert("Produto não encontrado."); 
      }
    }
  };
  
  const handleAddQuickProduct = async (produto: Product) => {
    if (!activeComandaId) { 
      alert("Ative uma comanda primeiro."); 
      return; 
    }
    setIsLoading(true);
    await onAddProduto(produto);
    setIsLoading(false);
  };

  return (
    <div className={`relative flex flex-col h-full bg-white rounded-2xl shadow-lg p-3 sm:p-6 gap-4 sm:gap-6 ${isLoading ? 'opacity-50' : ''}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Prato por Peso */}
      <div className="border-2 border-gray-200 rounded-xl p-3 sm:p-4 hover:border-blue-300 transition-colors">
        <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <Weight className="text-orange-600" size={14} />
          </div>
          <span className="text-sm sm:text-base">Lançar Prato por Peso</span>
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-grow">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm sm:text-base">R$</span>
            <input 
              type="text" 
              value={valorPeso} 
              onChange={(e) => setValorPeso(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleAddPeso()} 
              placeholder="0,00" 
              className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 sm:py-3 pl-8 sm:pl-10 pr-3 sm:pr-4 text-base sm:text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" 
              disabled={!activeComandaId}
            />
          </div>
          <button 
            onClick={handleAddPeso} 
            disabled={!activeComandaId} 
            className="bg-green-500 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 shadow-md text-sm sm:text-base"
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* Scanner */}
      <div className="border-2 border-gray-200 rounded-xl p-3 sm:p-4 hover:border-blue-300 transition-colors">
        <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Barcode className="text-blue-600" size={14} />
          </div>
          <span className="text-sm sm:text-base">Adicionar por Código</span>
        </h3>
        <input 
          type="text" 
          value={scannedBarcode} 
          onChange={(e) => setScannedBarcode(e.target.value)} 
          onKeyDown={handleScanProduct} 
          placeholder="Leia o código de barras do produto aqui" 
          className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" 
          disabled={!activeComandaId}
        />
      </div>

      {/* Atalhos Rápidos */}
      <div className="flex flex-col flex-grow border-2 border-gray-200 rounded-xl p-3 sm:p-4 hover:border-blue-300 transition-colors">
        <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Zap className="text-purple-600" size={14} />
          </div>
          <span className="text-sm sm:text-base">Atalhos Rápidos</span>
        </h3>
        
        <div className="flex items-center bg-gray-100 rounded-lg p-1 mb-3 sm:mb-4">
          {(['bebidas', 'sobremesas'] as const).map(key => (
            <button 
              key={key} 
              onClick={() => setCategoriaAtiva(key)} 
              className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 text-xs sm:text-sm font-semibold rounded-md transition-all duration-300 ${
                categoriaAtiva === key 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 overflow-y-auto">
          {produtos.filter(p => p.categoria === categoriaAtiva).map(produto => (
            <div 
              key={produto.id} 
              onClick={() => handleAddQuickProduct(produto)} 
              className={`text-center p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                activeComandaId 
                  ? 'hover:bg-blue-50 hover:border-blue-400 hover:shadow-md' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{produto.img}</div>
              <p className="text-xs font-semibold text-gray-700 mb-1 truncate">{produto.nome}</p>
              <p className="text-xs text-green-600 font-bold">
                {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
