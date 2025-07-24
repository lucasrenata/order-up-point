
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
  // Criar o início e fim do dia no fuso horário brasileiro
  const startDate = new Date(`${date}T00:00:00`);
  const endDate = new Date(`${date}T23:59:59`);
  
  // Ajustar para UTC considerando o fuso horário brasileiro (UTC-3)
  const utcStart = new Date(startDate.getTime() + (3 * 60 * 60 * 1000));
  const utcEnd = new Date(endDate.getTime() + (3 * 60 * 60 * 1000));
  
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
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const brazilianDateString = yesterday.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  });
  
  // Converter formato dd/mm/yyyy para yyyy-mm-dd
  const [day, month, year] = brazilianDateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};
