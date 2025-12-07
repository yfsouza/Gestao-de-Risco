export const statusBadge = (status: 'Aberto'|'Em Andamento'|'Mitigando'|'Encerrado') => {
  const map = {
    Aberto: { bg: '#e8f4fc', fg: '#3498db' },
    'Em Andamento': { bg: '#e3f2fd', fg: '#1976d2' },
    Mitigando: { bg: '#fef5e7', fg: '#f39c12' },
    Encerrado: { bg: '#d5f4e6', fg: '#27ae60' },
  } as const;
  return map[status] || map.Aberto;
};

export const probBadge = (p: 'Baixa'|'Média'|'Alta') => {
  const map = {
    Baixa: { bg: '#d5f4e6', fg: '#27ae60' },
    Média: { bg: '#e8f4fc', fg: '#3498db' },
    Alta: { bg: '#fdeaea', fg: '#e74c3c' },
  } as const;
  return map[p] || map.Média;
};

export const impactoBadge = (i: 'Baixo'|'Médio'|'Alto') => {
  const map = {
    Baixo: { bg: '#d5f4e6', fg: '#27ae60' },
    Médio: { bg: '#fef5e7', fg: '#f39c12' },
    Alto: { bg: '#fdeaea', fg: '#e74c3c' },
  } as const;
  return map[i] || map.Médio;
};

export const badgeStyle = (bg: string, fg: string) => ({
  display: 'inline-block', padding: '4px 8px', borderRadius: 20, background: bg, color: fg
});
