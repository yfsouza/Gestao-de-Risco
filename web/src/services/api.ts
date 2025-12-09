export type HttpMethod = 'GET'|'POST'|'PUT'|'DELETE';

const req = async (url: string, method: HttpMethod = 'GET', body?: any) => {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${url} failed: ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
};

export const api = {
  // Base data
  empresas: () => req('/api/empresas'),
  colaboradores: () => req('/api/colaboradores'),
  addColaborador: (data: { nome: string; email?: string; setor?: string; telefone?: string }) => req('/api/colaboradores', 'POST', data),
  stakeholders: () => req('/api/stakeholders-grupos'),
  stakeholdersPessoas: () => req('/api/stakeholders'),
  addStakeholderPessoa: (data: any) => req('/api/stakeholders', 'POST', data),
  deleteStakeholderPessoa: (id: string) => req(`/api/stakeholders/${id}`, 'DELETE'),

  // Riscos
  riscos: () => req('/api/riscos'),
  risco: (id: string) => req(`/api/riscos/${id}`),
  addRisco: (data: any) => req('/api/riscos', 'POST', data),
  updateRisco: (id: string, data: any) => req(`/api/riscos/${id}`, 'PUT', data),
  deleteRisco: (id: string) => req(`/api/riscos/${id}`, 'DELETE'),
  gerarProjeto: (id: string) => req(`/api/riscos/${id}/gerar-projeto`, 'POST'),
  informarOcorrencia: (id: string, data: { 
    data?: string; 
    impedimento: string; 
    acoes: string; 
    responsavel: string; 
    stakeholdersGruposIds?: string[]; 
    stakeholdersIds?: string[];
    temInvestimento?: boolean;
    descricaoInvestimento?: string;
    itens?: { descricao: string; quantidade: number; valorUnitario: number }[];
    servicos?: { descricao: string; valor: number }[];
    orcamento?: number;
  }) => req(`/api/riscos/${id}/ocorrencias`, 'POST', data),

  // Projetos
  projetos: () => req('/api/projetos'),
  updateProjeto: (id: string, data: any) => req(`/api/projetos/${id}`, 'PUT', data),
  runArchiveCron: () => req('/api/projetos/cron/archive', 'POST'),
  getConfig: () => req('/api/config'),
  updateConfig: (data: any) => req('/api/config', 'PUT', data),

  // Relatórios
  dashboard: () => req('/api/relatorios/dashboard'),
};
