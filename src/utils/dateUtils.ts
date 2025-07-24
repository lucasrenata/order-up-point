

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
  // Criar datas para início e fim do dia no horário brasileiro
  // Usar o timezone brasileiro para garantir que o range seja correto
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59.999`);
  
  // Converter para UTC considerando o timezone brasileiro
  // No horário brasileiro, precisamos ajustar para UTC
  const brazilianOffset = getBrazilianTimezoneOffset();
  
  const utcStart = new Date(startOfDay.getTime() + (brazilianOffset * 60 * 60 * 1000));
  const utcEnd = new Date(endOfDay.getTime() + (brazilianOffset * 60 * 60 * 1000));
  
  return {
    start: utcStart.toISOString(),
    end: utcEnd.toISOString()
  };
};

// Função auxiliar para obter o offset do timezone brasileiro
const getBrazilianTimezoneOffset = (): number => {
  // Criar uma data de referência para verificar o offset atual
  const now = new Date();
  
  // Obter o horário brasileiro usando toLocaleString
  const brazilianTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const utcTime = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  
  // Calcular a diferença em horas
  const offsetMs = utcTime.getTime() - brazilianTime.getTime();
  return offsetMs / (1000 * 60 * 60);
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

