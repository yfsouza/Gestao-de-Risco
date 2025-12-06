import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'server', 'data');
const filePath = path.join(dataDir, 'db.json');

type Empresa = { id: string; nome: string };
type Colaborador = { id: string; nome: string; email: string; empresaId: string };
type StakeholdersGrupo = { id: string; nome: string; emails: string[] };

type Risco = {
  id: string;
  empresaId: string;
  titulo: string;
  descricao: string;
  analistaId?: string;
  probabilidade: 'Baixa'|'Média'|'Alta';
  impacto: 'Baixo'|'Médio'|'Alto';
  status: 'Aberto'|'Mitigando'|'Encerrado';
  matriz: string;
  historico: { data: string; evento: string; autor: string }[];
};

type Projeto = {
  id: string;
  titulo: string;
  riscoId?: string;
  etapa: 'Backlog'|'Planejamento'|'Execução'|'Concluído';
  prazo?: string;
  responsavelId?: string;
  escopo: { objetivo?: string; entregas?: string; recursos?: string };
  historico: { data: string; evento: string; autor: string }[];
};

type DB = {
  empresas: Empresa[];
  colaboradores: Colaborador[];
  stakeholdersGrupos: StakeholdersGrupo[];
  riscos: Risco[];
  projetos: Projeto[];
};

const ensureData = () => {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(filePath)) {
    const initial: DB = {
      empresas: [
        { id: 'EMP001', nome: 'Matriz Lucas do Rio Verde' },
        { id: 'EMP002', nome: 'Filial Sinop' }
      ],
      colaboradores: [
        { id: 'COL001', nome: 'Carlos', email: 'carlos@empresa.com', empresaId: 'EMP001' },
        { id: 'COL002', nome: 'Ana', email: 'ana@empresa.com', empresaId: 'EMP002' }
      ],
      stakeholdersGrupos: [
        { id: 'STKGRP001', nome: 'Comitê de Riscos', emails: ['gestor@empresa.com', 'comite@empresa.com'] }
      ],
      riscos: [
        {
          id: 'RSK001',
          empresaId: 'EMP001',
          titulo: 'Falha de refrigeração na câmara fria',
          descricao: 'Risco de aumento de temperatura afetando qualidade das carnes.',
          analistaId: 'COL001',
          probabilidade: 'Média',
          impacto: 'Alto',
          status: 'Aberto',
          matriz: 'Operacional',
          historico: [{ data: new Date().toISOString(), evento: 'Risco criado (seed)', autor: 'Sistema' }]
        },
        {
          id: 'RSK002',
          empresaId: 'EMP002',
          titulo: 'Falta de insumos embalagens',
          descricao: 'Risco de interrupção por atraso de fornecedor de embalagens.',
          analistaId: 'COL002',
          probabilidade: 'Baixa',
          impacto: 'Médio',
          status: 'Encerrado',
          matriz: 'Supply',
          historico: [{ data: new Date().toISOString(), evento: 'Risco criado (seed)', autor: 'Sistema' }, { data: new Date().toISOString(), evento: 'Risco encerrado', autor: 'Sistema' }]
        },
        {
          id: 'RSK003',
          empresaId: 'EMP001',
          titulo: 'Ausência de colaborador chave',
          descricao: 'Risco de ausência prolongada afetando operação crítica.',
          analistaId: 'COL001',
          probabilidade: 'Alta',
          impacto: 'Médio',
          status: 'Mitigando',
          matriz: 'RH',
          historico: [{ data: new Date().toISOString(), evento: 'Risco criado (seed)', autor: 'Sistema' }, { data: new Date().toISOString(), evento: 'Plano de mitigação iniciado', autor: 'Sistema' }]
        },
        {
          id: 'RSK004',
          empresaId: 'EMP002',
          titulo: 'Falha de rede de TI',
          descricao: 'Intermitência na rede pode afetar integrações e ERPs.',
          analistaId: 'COL002',
          probabilidade: 'Média',
          impacto: 'Baixo',
          status: 'Aberto',
          matriz: 'Tecnologia',
          historico: [{ data: new Date().toISOString(), evento: 'Risco criado (seed)', autor: 'Sistema' }]
        },
        {
          id: 'RSK005',
          empresaId: 'EMP001',
          titulo: 'Não conformidade sanitária',
          descricao: 'Possível autuação por não conformidade em inspeção.',
          analistaId: 'COL001',
          probabilidade: 'Alta',
          impacto: 'Alto',
          status: 'Aberto',
          matriz: 'Regulatório',
          historico: [{ data: new Date().toISOString(), evento: 'Risco criado (seed)', autor: 'Sistema' }]
        }
      ],
      projetos: [
        {
          id: 'PRJ001',
          titulo: 'Plano de contingência da refrigeração',
          riscoId: 'RSK001',
          etapa: 'Planejamento',
          prazo: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
          responsavelId: 'COL001',
          escopo: { objetivo: 'Garantir manutenção preventiva e sensores redundantes', entregas: 'Checklist de manutenção; instalação de sensores', recursos: 'Equipe de manutenção; orçamento' },
          historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (seed)', autor: 'Sistema' }]
        },
        {
          id: 'PRJ002',
          titulo: 'Plano alternativo para embalagens',
          riscoId: 'RSK002',
          etapa: 'Execução',
          prazo: new Date(Date.now() + 3*24*60*60*1000).toISOString(),
          responsavelId: 'COL002',
          escopo: { objetivo: 'Qualificar fornecedor backup', entregas: 'Contrato assinado; lote teste recebido', recursos: 'Compras; jurídico' },
          historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (seed)', autor: 'Sistema' }]
        },
        {
          id: 'PRJ003',
          titulo: 'Treinamento cross para função crítica',
          riscoId: 'RSK003',
          etapa: 'Concluído',
          prazo: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
          responsavelId: 'COL001',
          escopo: { objetivo: 'Cobertura por equipe treinada', entregas: 'Matriz de habilidades atualizada', recursos: 'RH; operação' },
          historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (seed)', autor: 'Sistema' }]
        },
        {
          id: 'PRJ004',
          titulo: 'Auditoria de processos internos',
          etapa: 'Backlog',
          prazo: new Date(Date.now() + 14*24*60*60*1000).toISOString(),
          responsavelId: 'COL002',
          escopo: { objetivo: 'Mapear riscos operacionais sem vínculo direto', entregas: 'Relatório de auditoria', recursos: 'Equipe de qualidade' },
          historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (seed - sem risco associado)', autor: 'Sistema' }]
        }
      ]
    };
    fs.writeFileSync(filePath, JSON.stringify(initial, null, 2));
  }
};

const readDB = (): DB => {
  ensureData();
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as DB;
};

const writeDB = (db: DB) => {
  fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
};

export class DataStore {
  getEmpresas() { return readDB().empresas; }
  addEmpresa(emp: Empresa) { const db = readDB(); db.empresas.push(emp); writeDB(db); return emp; }
  deleteEmpresa(id: string) { const db = readDB(); db.empresas = db.empresas.filter(e => e.id !== id); writeDB(db); }

  getColaboradores() { return readDB().colaboradores; }
  addColaborador(c: Colaborador) { const db = readDB(); db.colaboradores.push(c); writeDB(db); return c; }
  deleteColaborador(id: string) { const db = readDB(); db.colaboradores = db.colaboradores.filter(e => e.id !== id); writeDB(db); }

  getStakeholdersGrupos() { return readDB().stakeholdersGrupos; }
  addStakeholdersGrupo(g: StakeholdersGrupo) { const db = readDB(); db.stakeholdersGrupos.push(g); writeDB(db); return g; }
  deleteStakeholdersGrupo(id: string) { const db = readDB(); db.stakeholdersGrupos = db.stakeholdersGrupos.filter(e => e.id !== id); writeDB(db); }

  getRiscos() { return readDB().riscos; }
  addRisco(r: Risco) { const db = readDB(); r.historico = [...(r.historico||[]), { data: new Date().toISOString(), evento: 'Risco criado', autor: 'Sistema' }]; db.riscos.push(r); writeDB(db); return r; }
  updateRisco(id: string, r: Partial<Risco>) {
    const db = readDB();
    const i = db.riscos.findIndex(x => x.id === id);
    if (i>=0) {
      const prev = db.riscos[i];
      const next = { ...prev, ...r } as Risco;
      const changes: string[] = [];
      if (r.status && r.status !== prev.status) changes.push(`Status: ${prev.status} → ${r.status}`);
      if (r.probabilidade && r.probabilidade !== prev.probabilidade) changes.push(`Probabilidade: ${prev.probabilidade} → ${r.probabilidade}`);
      if (r.impacto && r.impacto !== prev.impacto) changes.push(`Impacto: ${prev.impacto} → ${r.impacto}`);
      if (r.matriz && r.matriz !== prev.matriz) changes.push(`Matriz: ${prev.matriz} → ${r.matriz}`);
      if (r.titulo && r.titulo !== prev.titulo) changes.push(`Título alterado`);
      if (r.descricao && r.descricao !== prev.descricao) changes.push(`Descrição alterada`);
      if (changes.length) {
        next.historico = [...(prev.historico||[]), { data: new Date().toISOString(), evento: changes.join(' | '), autor: 'Sistema' }];
      }
      db.riscos[i] = next;
      writeDB(db);
      return db.riscos[i];
    }
    return null;
  }
  deleteRisco(id: string) { const db = readDB(); db.riscos = db.riscos.filter(e => e.id !== id); writeDB(db); }

  getProjetos() { return readDB().projetos; }
  addProjeto(p: Projeto) { const db = readDB(); p.historico = [...(p.historico||[]), { data: new Date().toISOString(), evento: 'Projeto criado', autor: 'Sistema' }]; db.projetos.push(p); writeDB(db); return p; }
  updateProjeto(id: string, p: Partial<Projeto>) {
    const db = readDB();
    const i = db.projetos.findIndex(x => x.id === id);
    if (i>=0) {
      const prev = db.projetos[i];
      const next = { ...prev, ...p } as Projeto;
      const changes: string[] = [];
      if (p.etapa && p.etapa !== prev.etapa) changes.push(`Etapa: ${prev.etapa} → ${p.etapa}`);
      if (p.prazo && p.prazo !== prev.prazo) changes.push('Prazo alterado');
      if (p.responsavelId && p.responsavelId !== prev.responsavelId) changes.push('Responsável alterado');
      if (p.escopo && JSON.stringify(p.escopo) !== JSON.stringify(prev.escopo)) changes.push('Escopo alterado');
      if (changes.length) {
        next.historico = [...(prev.historico||[]), { data: new Date().toISOString(), evento: changes.join(' | '), autor: 'Sistema' }];
      }
      db.projetos[i] = next;
      writeDB(db);
      return db.projetos[i];
    }
    return null;
  }

  addDemoProjects() {
    const db = readDB();
    if (db.projetos.length >= 6) return db.projetos; // já tem o suficiente
    const now = Date.now();
    const demos: Projeto[] = [
      { id: 'PRJ100', titulo: 'Projeto de Modernização', riscoId: 'RSK001', etapa: 'Concluído', prazo: new Date(now + 90*24*60*60*1000).toISOString(), responsavelId: 'COL001', escopo: { objetivo: 'Modernizar linha de produção', entregas: 'Linha atualizada', recursos: 'Equipe engenharia' }, historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (demo)', autor: 'Sistema' }] },
      { id: 'PRJ101', titulo: 'Projeto de Monitoramento', riscoId: 'RSK004', etapa: 'Execução', prazo: new Date(now + 30*24*60*60*1000).toISOString(), responsavelId: 'COL002', escopo: { objetivo: 'Monitorar rede e ERPs', entregas: 'Painel de monitoramento', recursos: 'TI' }, historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (demo)', autor: 'Sistema' }] },
      { id: 'PRJ102', titulo: 'Projeto de Iniciação', etapa: 'Backlog', prazo: new Date(now + 15*24*60*60*1000).toISOString(), responsavelId: 'COL001', escopo: { objetivo: 'Levantamento inicial', entregas: 'Documento de escopo', recursos: 'PMO' }, historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (demo)', autor: 'Sistema' }] },
      { id: 'PRJ103', titulo: 'Planejamento de Auditoria', riscoId: 'RSK005', etapa: 'Planejamento', prazo: new Date(now + 45*24*60*60*1000).toISOString(), responsavelId: 'COL002', escopo: { objetivo: 'Planejar auditoria regulatória', entregas: 'Plano de auditoria', recursos: 'Qualidade' }, historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (demo)', autor: 'Sistema' }] }
    ];
    const existingIds = new Set(db.projetos.map(p=>p.id));
    for (const d of demos) if (!existingIds.has(d.id)) db.projetos.push(d);
    writeDB(db);
    return db.projetos;
  }

  generateProjetoFromRisco(riscoId: string) {
    const db = readDB();
    const r = db.riscos.find(x => x.id === riscoId);
    if (!r) return null;
    const proj: Projeto = {
      id: `PRJ-${Date.now()}`,
      titulo: r.titulo,
      riscoId: r.id,
      etapa: 'Planejamento',
      escopo: { objetivo: r.descricao },
      historico: [{ data: new Date().toISOString(), evento: 'Gerado a partir do risco', autor: 'Sistema' }]
    };
    db.projetos.push(proj);
    r.historico = [...(r.historico||[]), { data: new Date().toISOString(), evento: `Projeto ${proj.id} gerado`, autor: 'Sistema' }];
    db.riscos = db.riscos.map(x => x.id === r.id ? r : x);
    writeDB(db);
    return proj;
  }

  getDashboard() {
    const db = readDB();
    return {
      riscosAberto: db.riscos.filter(r => r.status === 'Aberto').length,
      projetosExecucao: db.projetos.filter(p => p.etapa === 'Execução').length,
      empresas: db.empresas.length,
      colaboradores: db.colaboradores.length
    };
  }
}
