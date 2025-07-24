
// Funções utilitárias para trabalhar com datas no timezone brasileiro (UTC-3)

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte uma data UTC para string no formato brasileiro (dd/mm/yyyy)
 */
export const formatBrazilianDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: BRAZIL_TIMEZONE
  });
};

/**
 * Converte uma data UTC para string no formato brasileiro com horário (dd/mm/yyyy HH:mm)
 */
export const formatBrazilianDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BRAZIL_TIMEZONE
  });
};

/**
 * Obter a data atual no timezone brasileiro no formato yyyy-mm-dd
 */
export const getCurrentBrazilianDate = (): string => {
  const now = new Date();
  
  // Usar Intl.DateTimeFormat para obter a data brasileira
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const brazilianDate = formatter.format(now);
  console.log(`🇧🇷 Data atual brasileira: ${brazilianDate}`);
  
  return brazilianDate;
};

/**
 * Obter a data de ontem no timezone brasileiro no formato yyyy-mm-dd
 */
export const getYesterdayBrazilianDate = (): string => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const yesterdayDate = formatter.format(yesterday);
  console.log(`🇧🇷 Data de ontem brasileira: ${yesterdayDate}`);
  
  return yesterdayDate;
};

/**
 * Obter a data/hora atual no timezone brasileiro no formato ISO
 */
export const getCurrentBrazilianDateTime = (): string => {
  const now = new Date();
  
  // Criar uma data no timezone brasileiro
  const brazilianDateTime = new Date(now.toLocaleString('en-US', {
    timeZone: BRAZIL_TIMEZONE
  }));
  
  const isoString = brazilianDateTime.toISOString();
  console.log(`🇧🇷 Data/hora atual brasileira (ISO): ${isoString}`);
  
  return isoString;
};

/**
 * Converter data UTC para data brasileira no formato yyyy-mm-dd
 */
export const convertUTCToBrazilianDate = (utcDate: string): string => {
  const date = new Date(utcDate);
  
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return formatter.format(date);
};

/**
 * Obter range UTC que corresponde a um dia brasileiro completo
 */
export const getBrazilianDateRange = (brazilianDate: string) => {
  console.log(`🔍 Calculando range UTC para data brasileira: ${brazilianDate}`);
  
  // Criar início do dia brasileiro (00:00:00)
  const startBrazilian = new Date(`${brazilianDate}T00:00:00`);
  const endBrazilian = new Date(`${brazilianDate}T23:59:59.999`);
  
  console.log(`🇧🇷 Início do dia brasileiro: ${startBrazilian.toLocaleString('pt-BR', { timeZone: BRAZIL_TIMEZONE })}`);
  console.log(`🇧🇷 Fim do dia brasileiro: ${endBrazilian.toLocaleString('pt-BR', { timeZone: BRAZIL_TIMEZONE })}`);
  
  // Converter para UTC considerando o timezone brasileiro
  const utcStart = new Date(startBrazilian.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
  const utcEnd = new Date(endBrazilian.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
  
  // Ajustar para UTC baseado no offset brasileiro
  const brazilianOffset = -3 * 60; // UTC-3 em minutos
  const utcOffset = utcStart.getTimezoneOffset();
  const offsetDiff = (utcOffset - brazilianOffset) * 60 * 1000;
  
  const finalStart = new Date(utcStart.getTime() + offsetDiff);
  const finalEnd = new Date(utcEnd.getTime() + offsetDiff);
  
  const result = {
    start: finalStart.toISOString(),
    end: finalEnd.toISOString()
  };
  
  console.log(`🌍 Range UTC final:`);
  console.log(`  Início: ${result.start} (${finalStart.toLocaleString('pt-BR', { timeZone: BRAZIL_TIMEZONE })})`);
  console.log(`  Fim: ${result.end} (${finalEnd.toLocaleString('pt-BR', { timeZone: BRAZIL_TIMEZONE })})`);
  
  return result;
};

/**
 * Converter Date para formato brasileiro yyyy-mm-dd
 */
export const dateToStringBrazilian = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return formatter.format(date);
};

/**
 * Converter string yyyy-mm-dd para Date no timezone brasileiro
 */
export const stringToDateBrazilian = (dateString: string): Date => {
  // Criar date assumindo timezone brasileiro
  const date = new Date(`${dateString}T12:00:00`);
  return date;
};
