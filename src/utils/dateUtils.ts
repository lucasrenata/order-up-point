
export const convertUTCToBrazilianTime = (utcDate: string): string => {
  const date = new Date(utcDate);
  // Usar o fuso horário brasileiro para extrair a data correta
  const brazilianDateString = date.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  });
  
  // Converter formato dd/mm/yyyy para yyyy-mm-dd
  const [day, month, year] = brazilianDateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const formatBrazilianDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo'
  });
};

export const formatBrazilianDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
};

export const getBrazilianDateRange = (date: string) => {
  // Criar uma data de referência no horário brasileiro
  const referenceDate = new Date(`${date}T12:00:00`);
  
  // Obter o início e fim do dia no horário brasileiro
  const startBrazilian = new Date(referenceDate);
  startBrazilian.setHours(0, 0, 0, 0);
  
  const endBrazilian = new Date(referenceDate);
  endBrazilian.setHours(23, 59, 59, 999);
  
  // Converter para string no formato brasileiro e depois para UTC
  const startBrazilianString = startBrazilian.toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  const endBrazilianString = endBrazilian.toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  
  // Calcular o offset brasileiro dinamicamente
  const now = new Date();
  const utcTime = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const brazilianTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const offsetHours = (utcTime.getTime() - brazilianTime.getTime()) / (1000 * 60 * 60);
  
  // Aplicar o offset para converter para UTC
  const utcStart = new Date(new Date(startBrazilianString).getTime() + (offsetHours * 60 * 60 * 1000));
  const utcEnd = new Date(new Date(endBrazilianString).getTime() + (offsetHours * 60 * 60 * 1000));
  
  return {
    start: utcStart.toISOString(),
    end: utcEnd.toISOString()
  };
};

export const getCurrentBrazilianDate = (): string => {
  const now = new Date();
  const brazilianDateString = now.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  });
  
  // Converter formato dd/mm/yyyy para yyyy-mm-dd
  const [day, month, year] = brazilianDateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const getYesterdayBrazilianDate = (): string => {
  // Obter a data atual no horário brasileiro
  const now = new Date();
  const brazilianDateString = now.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  });
  
  // Converter para formato yyyy-mm-dd
  const [day, month, year] = brazilianDateString.split('/');
  const currentBrazilianDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
  // Subtrair 1 dia da data brasileira atual
  const yesterday = new Date(currentBrazilianDate);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Retornar no formato yyyy-mm-dd
  return yesterday.toISOString().split('T')[0];
};
