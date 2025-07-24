
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
  console.log(`🔍 Calculando range para data brasileira: ${date}`);
  
  // Criar data base no formato brasileiro
  const baseDate = new Date(`${date}T00:00:00`);
  console.log(`📅 Data base criada: ${baseDate.toISOString()}`);
  
  // Criar início do dia brasileiro (00:00:00)
  const startOfDay = new Date(baseDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  // Criar fim do dia brasileiro (23:59:59.999)
  const endOfDay = new Date(baseDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  console.log(`🇧🇷 Dia brasileiro - Início: ${startOfDay.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  console.log(`🇧🇷 Dia brasileiro - Fim: ${endOfDay.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  
  // Converter para strings ISO considerando o timezone brasileiro
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  // Formatar as datas no timezone brasileiro
  const startBrazilian = formatter.format(startOfDay).replace(' ', 'T');
  const endBrazilian = formatter.format(endOfDay).replace(' ', 'T');
  
  console.log(`🇧🇷 Início formatado (BR): ${startBrazilian}`);
  console.log(`🇧🇷 Fim formatado (BR): ${endBrazilian}`);
  
  // Converter para UTC considerando o offset brasileiro
  const now = new Date();
  const utcOffset = now.getTimezoneOffset();
  const brazilianOffset = -180; // Brasil é UTC-3 (ou -180 minutos)
  const offsetDiff = (utcOffset - brazilianOffset) * 60 * 1000;
  
  console.log(`🌍 UTC offset: ${utcOffset} minutos`);
  console.log(`🇧🇷 Brasil offset: ${brazilianOffset} minutos`);
  console.log(`⚖️ Diferença: ${offsetDiff / (60 * 1000)} horas`);
  
  // Aplicar correção de timezone
  const utcStart = new Date(new Date(startBrazilian).getTime() + offsetDiff);
  const utcEnd = new Date(new Date(endBrazilian).getTime() + offsetDiff);
  
  const result = {
    start: utcStart.toISOString(),
    end: utcEnd.toISOString()
  };
  
  console.log(`🌍 Range UTC final:`);
  console.log(`  Início: ${result.start}`);
  console.log(`  Fim: ${result.end}`);
  
  return result;
};

export const getCurrentBrazilianDate = (): string => {
  const now = new Date();
  console.log(`🕐 Hora atual UTC: ${now.toISOString()}`);
  console.log(`🇧🇷 Hora atual Brasil: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  
  const brazilianDateString = now.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  });
  
  console.log(`🇧🇷 Data brasileira string: ${brazilianDateString}`);
  
  // Converter formato dd/mm/yyyy para yyyy-mm-dd
  const [day, month, year] = brazilianDateString.split('/');
  const result = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
  console.log(`🇧🇷 Data brasileira formatada: ${result}`);
  return result;
};

export const getCurrentBrazilianDateTime = (): string => {
  const now = new Date();
  
  // Obter a data/hora atual no timezone brasileiro
  const brazilianDateTime = now.toLocaleString('sv-SE', {
    timeZone: 'America/Sao_Paulo'
  });
  
  // Converter para formato ISO
  const isoDateTime = brazilianDateTime.replace(' ', 'T') + '.000Z';
  
  console.log(`🇧🇷 Data/hora atual (Brasil): ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  console.log(`🌍 Convertida para ISO: ${isoDateTime}`);
  
  return isoDateTime;
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
  
  console.log(`🇧🇷 Data atual brasileira: ${currentBrazilianDate}`);
  
  // Subtrair 1 dia da data brasileira atual
  const yesterday = new Date(currentBrazilianDate);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const result = yesterday.toISOString().split('T')[0];
  console.log(`🇧🇷 Data de ontem brasileira: ${result}`);
  
  return result;
};
