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
  stakeholders: () => req('/api/stakeholders-grupos'),

  // Riscos
  riscos: () => req('/api/riscos'),
  addRisco: (data: any) => req('/api/riscos', 'POST', data),
  updateRisco: (id: string, data: any) => req(`/api/riscos/${id}`, 'PUT', data),
  deleteRisco: (id: string) => req(`/api/riscos/${id}`, 'DELETE'),
  gerarProjeto: (id: string) => req(`/api/riscos/${id}/gerar-projeto`, 'POST'),

  // Projetos
  projetos: () => req('/api/projetos'),
  updateProjeto: (id: string, data: any) => req(`/api/projetos/${id}`, 'PUT', data),

  // Relatórios
  dashboard: () => req('/api/relatorios/dashboard'),
};
