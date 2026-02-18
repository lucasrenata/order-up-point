import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OldDataAlertModalProps {
  quantidade: number;
  valorTotal: number;
  dataLimite: string;
  onClose: () => void;
}

export const OldDataAlertModal: React.FC<OldDataAlertModalProps> = ({
  quantidade,
  valorTotal,
  dataLimite,
  onClose,
}) => {
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleGoToReport = () => {
    onClose();
    navigate('/relatorio');
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative max-w-md w-full mx-4 animate-fade-in-up">
        {/* Pulsing border wrapper */}
        <div className="absolute -inset-[3px] rounded-2xl bg-red-500 animate-pulse-border" />

        <div className="relative bg-white rounded-2xl p-7 shadow-2xl border-4 border-red-500">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 rounded-full p-3">
              <AlertTriangle className="text-red-600" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-700">Dados Antigos Detectados!</h2>
              <p className="text-sm text-gray-500">Mais de 7 dias sem limpeza</p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200">
            <p className="text-gray-700 mb-1">
              <span className="font-bold text-red-600">{quantidade}</span> comandas anteriores a{' '}
              <span className="font-semibold">{dataLimite}</span>
            </p>
            <p className="text-gray-700">
              Valor total:{' '}
              <span className="font-bold text-red-600">
                {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </p>
          </div>

          {/* Alert message */}
          <div className="bg-red-600 rounded-xl p-4 mb-5">
            <p className="text-white font-bold text-center text-sm leading-relaxed">
              ⚠️ Faça o download dos relatórios do ultimo acampamento e delete os dados POR FAVOR!
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleGoToReport}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow"
            >
              📄 Ir para Relatórios
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
            >
              Fechar (lembrar depois)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
