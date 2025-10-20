
import React, { useState, useEffect } from 'react';
import { Weight, Barcode, Zap, Search } from 'lucide-react';
import { Product } from '../types/types';

interface InputPanelProps {
  produtos: Product[];
  onAddProduto: (produto: Product) => void;
  onAddPratoPorPeso: (valor: number) => void;
  onAddMarmitex: (valor: number) => void;
  activeComandaId?: number;
}


export const InputPanel: React.FC<InputPanelProps> = ({ produtos, onAddProduto, onAddPratoPorPeso, onAddMarmitex, activeComandaId }) => {
  const [categoriaAtiva, setCategoriaAtiva] = useState<'bebidas' | 'sobremesas'>('bebidas');
  const [valorPeso, setValorPeso] = useState('');
  const [valorMarmitex, setValorMarmitex] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para busca de produtos
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // useEffect para busca em tempo real
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = produtos
        .filter(produto => 
          produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 8); // Limitar a 8 resultados
      setFilteredProducts(filtered);
      setShowSearchResults(true);
    } else {
      setFilteredProducts([]);
      setShowSearchResults(false);
    }
  }, [searchTerm, produtos]);

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

  const handleAddMarmitex = async () => {
    if (!activeComandaId) { 
      alert("Por favor, ative uma comanda primeiro."); 
      return; 
    }
    
    const valor = parseFloat(valorMarmitex.replace(',', '.'));
    if (!isNaN(valor) && valor > 0) {
      setIsLoading(true);
      await onAddMarmitex(valor);
      setValorMarmitex('');
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
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchProduct = async (produto: Product) => {
    if (!activeComandaId) { 
      alert("Ative uma comanda primeiro."); 
      return; 
    }
    setIsLoading(true);
    await onAddProduto(produto);
    setSearchTerm(''); // Limpar campo após adicionar
    setShowSearchResults(false);
    setIsLoading(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSearchResults(false);
      setSearchTerm('');
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

  // Função para verificar se o produto deve aparecer nos atalhos rápidos
  const getQuickShortcutProducts = () => {
    return produtos
      .filter(produto => 
        produto.categoria === categoriaAtiva && 
        produto.atalho_rapido === true &&
        produto.ativo !== false
      )
      .slice(0, 12); // Limitar a 12 itens por categoria
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
              id="valor-peso"
              type="text" 
              value={valorPeso} 
              onChange={(e) => setValorPeso(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleAddPeso()} 
              placeholder="0,00" 
              className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 sm:py-3 pl-8 sm:pl-10 pr-3 sm:pr-4 text-base sm:text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" 
              disabled={!activeComandaId}
              aria-label="Valor do prato por peso em reais"
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

      {/* Lançar Marmitex */}
      <div className="border-2 border-gray-200 rounded-xl p-3 sm:p-4 hover:border-blue-300 transition-colors">
        <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-pink-100 rounded-full flex items-center justify-center">
            <span className="text-sm">🍱</span>
          </div>
          <span className="text-sm sm:text-base">Lançar Marmitex</span>
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-grow">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm sm:text-base">R$</span>
            <input 
              id="valor-marmitex"
              type="text" 
              value={valorMarmitex} 
              onChange={(e) => setValorMarmitex(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleAddMarmitex()} 
              placeholder="0,00" 
              className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 sm:py-3 pl-8 sm:pl-10 pr-3 sm:pr-4 text-base sm:text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" 
              disabled={!activeComandaId}
              aria-label="Valor da marmitex em reais"
            />
          </div>
          <button 
            onClick={handleAddMarmitex} 
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
          id="scanner-barcode"
          type="text" 
          value={scannedBarcode} 
          onChange={(e) => setScannedBarcode(e.target.value)} 
          onKeyDown={handleScanProduct} 
          placeholder="Leia o código de barras do produto aqui" 
          className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" 
          disabled={!activeComandaId}
          aria-label="Campo para inserir código de barras do produto"
        />
      </div>

      {/* Buscar por Nome */}
      <div className="relative border-2 border-gray-200 rounded-xl p-3 sm:p-4 hover:border-blue-300 transition-colors">
        <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Search className="text-green-600" size={14} />
          </div>
          <span className="text-sm sm:text-base">Buscar por Nome</span>
        </h3>
        <input 
          type="text" 
          value={searchTerm} 
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          placeholder="Digite o nome do produto..." 
          className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" 
          disabled={!activeComandaId}
        />
        
        {/* Lista de resultados da busca */}
        {showSearchResults && filteredProducts.length > 0 && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {filteredProducts.map(produto => (
              <div
                key={produto.id}
                onClick={() => handleSearchProduct(produto)}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="text-2xl">{produto.img}</div>
                <div className="flex-grow">
                  <p className="font-semibold text-gray-800 text-sm">{produto.nome}</p>
                  <p className="text-green-600 font-bold text-xs">
                    {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Mensagem quando não há resultados */}
        {showSearchResults && filteredProducts.length === 0 && searchTerm.length >= 2 && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3">
            <p className="text-gray-500 text-sm text-center">Nenhum produto encontrado</p>
          </div>
        )}
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
          {getQuickShortcutProducts().map(produto => (
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
