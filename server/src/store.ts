import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'server', 'data');
const filePath = path.join(dataDir, 'db.json');

type Empresa = { id: string; nome: string };
type Colaborador = { id: string; nome: string; email: string; empresaId: string; departamento?: string };
type StakeholdersGrupo = {
  id: string;
  nome: string;
  descricao?: string;
  participantesColabIds?: string[];
  participantesStakeIds?: string[];
  fechado?: boolean;
};
type Stakeholder = { id: string; nome: string; setor?: string; email?: string; telefone?: string };
type CategoriaRisco = { id: string; nome: string; descricao?: string };
type Categoria = { id: string; nome: string; descricao?: string };

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
  tapPdf?: string;
  tapPdfFilename?: string;
  tapGeradaEm?: string;
};

type DB = {
  empresas: Empresa[];
  colaboradores: Colaborador[];
  stakeholdersGrupos: StakeholdersGrupo[];
  stakeholders?: Stakeholder[];
  categorias?: Categoria[];
  categoriasRisco?: CategoriaRisco[];
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
        { id: 'STKGRP001', nome: 'Comitê de Riscos', descricao: 'Grupo principal de acompanhamento dos riscos', participantesColabIds: ['COL001'], participantesStakeIds: ['STK001','STK002'], fechado: true }
      ],
      stakeholders: [
        { id: 'STK001', nome: 'Gestor de Qualidade', setor: 'Qualidade', email: 'qualidade@empresa.com', telefone: '(65) 9000-0001' },
        { id: 'STK002', nome: 'Gestor de TI', setor: 'TI', email: 'ti@empresa.com', telefone: '(65) 9000-0002' }
      ],
      categorias: [
        { id: 'CATA001', nome: 'Processos' },
        { id: 'CATA002', nome: 'Produtos' },
        { id: 'CATA003', nome: 'Serviços' }
      ],
      categoriasRisco: [
        { id: 'CAT001', nome: 'Operacional' },
        { id: 'CAT002', nome: 'Tecnologia' },
        { id: 'CAT003', nome: 'Supply' },
        { id: 'CAT004', nome: 'RH' },
        { id: 'CAT005', nome: 'Regulatório' }
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
  updateColaborador(id: string, c: Partial<Colaborador>) {
    const db = readDB();
    const i = db.colaboradores.findIndex(e=>e.id===id);
    if (i<0) return null;
    db.colaboradores[i] = { ...db.colaboradores[i], ...c } as Colaborador;
    writeDB(db);
    return db.colaboradores[i];
  }
  deleteColaborador(id: string) { const db = readDB(); db.colaboradores = db.colaboradores.filter(e => e.id !== id); writeDB(db); }

  getStakeholdersGrupos() { return readDB().stakeholdersGrupos; }
  addStakeholdersGrupo(g: StakeholdersGrupo) { const db = readDB(); db.stakeholdersGrupos.push({ ...g, participantesColabIds: g.participantesColabIds||[], participantesStakeIds: g.participantesStakeIds||[], fechado: !!g.fechado }); writeDB(db); return g; }
  deleteStakeholdersGrupo(id: string) { const db = readDB(); db.stakeholdersGrupos = db.stakeholdersGrupos.filter(e => e.id !== id); writeDB(db); }
  addParticipantesGrupo(id: string, colabIds: string[], stakeIds: string[]) {
    const db = readDB();
    const i = db.stakeholdersGrupos.findIndex(g=>g.id===id);
    if (i<0) return null;
    const g = db.stakeholdersGrupos[i];
    const setCol = new Set([...(g.participantesColabIds||[]), ...(colabIds||[])]);
    const setStk = new Set([...(g.participantesStakeIds||[]), ...(stakeIds||[])]);
    db.stakeholdersGrupos[i] = { ...g, participantesColabIds: Array.from(setCol), participantesStakeIds: Array.from(setStk) };
    writeDB(db);
    return db.stakeholdersGrupos[i];
  }
  fecharGrupo(id: string) {
    const db = readDB();
    const i = db.stakeholdersGrupos.findIndex(g=>g.id===id);
    if (i<0) return null;
    db.stakeholdersGrupos[i] = { ...db.stakeholdersGrupos[i], fechado: true };
    writeDB(db);
    return db.stakeholdersGrupos[i];
  }
  abrirGrupo(id: string) {
    const db = readDB();
    const i = db.stakeholdersGrupos.findIndex(g=>g.id===id);
    if (i<0) return null;
    db.stakeholdersGrupos[i] = { ...db.stakeholdersGrupos[i], fechado: false };
    writeDB(db);
    return db.stakeholdersGrupos[i];
  }

  getStakeholders() { const db = readDB(); return db.stakeholders || []; }
  addStakeholder(s: Stakeholder) { const db = readDB(); db.stakeholders = db.stakeholders || []; db.stakeholders.push(s); writeDB(db); return s; }
  updateStakeholder(id: string, s: Partial<Stakeholder>) {
    const db = readDB();
    db.stakeholders = db.stakeholders || [];
    const i = db.stakeholders.findIndex(e=>e.id===id);
    if (i<0) return null;
    db.stakeholders[i] = { ...db.stakeholders[i], ...s } as Stakeholder;
    writeDB(db);
    return db.stakeholders[i];
  }
  deleteStakeholder(id: string) { const db = readDB(); db.stakeholders = (db.stakeholders || []).filter(e => e.id !== id); writeDB(db); }

  // Categorias de Risco
  getCategoriasRisco() { const db = readDB(); return db.categoriasRisco || []; }
  addCategoriaRisco(c: CategoriaRisco) { const db = readDB(); db.categoriasRisco = db.categoriasRisco || []; db.categoriasRisco.push(c); writeDB(db); return c; }
  deleteCategoriaRisco(id: string) { const db = readDB(); db.categoriasRisco = (db.categoriasRisco || []).filter(e => e.id !== id); writeDB(db); }

  // Categorias (genéricas)
  getCategorias() { const db = readDB(); return db.categorias || []; }
  addCategoria(c: Categoria) { const db = readDB(); db.categorias = db.categorias || []; const item = { id: c.id || `CAT-${Date.now()}`, nome: c.nome, descricao: c.descricao }; db.categorias.push(item); writeDB(db); return item; }
  deleteCategoria(id: string) { const db = readDB(); db.categorias = (db.categorias || []).filter(e => e.id !== id); writeDB(db); }

  getRiscos() { return readDB().riscos; }
  getRisco(id: string) { return readDB().riscos.find(r => r.id === id) || null; }
  addRisco(r: Risco) { const db = readDB(); r.historico = [...(r.historico||[]), { data: new Date().toISOString(), evento: 'Risco criado', autor: 'Sistema' }]; db.riscos.push(r); writeDB(db); return r; }
  updateRisco(id: string, r: Partial<Risco>) {
    const db = readDB();
    const i = db.riscos.findIndex(x => x.id === id);
    if (i>=0) {
      const prev = db.riscos[i];
      const next = { ...prev, ...r } as Risco;
      const changes: string[] = [];
      
      // Detectar todas as alterações e registrar no histórico
      if (r.status && r.status !== prev.status) changes.push(`Status: ${prev.status} → ${r.status}`);
      if (r.probabilidade && r.probabilidade !== prev.probabilidade) changes.push(`Probabilidade: ${prev.probabilidade} → ${r.probabilidade}`);
      if (r.impacto && r.impacto !== prev.impacto) changes.push(`Impacto: ${prev.impacto} → ${r.impacto}`);
      if (r.matriz && r.matriz !== prev.matriz) changes.push(`Nível de Risco: ${prev.matriz} → ${r.matriz}`);
      if (r.titulo && r.titulo !== prev.titulo) changes.push(`Título: "${prev.titulo}" → "${r.titulo}"`);
      if (r.descricao && r.descricao !== prev.descricao) changes.push(`Descrição alterada`);
      if ((r as any).empresaId && (r as any).empresaId !== (prev as any).empresaId) {
        const empAnterior = this.getEmpresas().find(e => e.id === (prev as any).empresaId)?.nome || (prev as any).empresaId || 'Nenhuma';
        const empNova = this.getEmpresas().find(e => e.id === (r as any).empresaId)?.nome || (r as any).empresaId;
        changes.push(`Empresa: ${empAnterior} → ${empNova}`);
      }
      if ((r as any).responsavelId && (r as any).responsavelId !== (prev as any).responsavelId) {
        const respAnterior = this.getColaboradores().find(c => c.id === (prev as any).responsavelId)?.nome || (prev as any).responsavelId || 'Nenhum';
        const respNovo = this.getColaboradores().find(c => c.id === (r as any).responsavelId)?.nome || (r as any).responsavelId;
        changes.push(`Responsável: ${respAnterior} → ${respNovo}`);
      }
      if ((r as any).analistaId && (r as any).analistaId !== (prev as any).analistaId) {
        const analAnterior = this.getColaboradores().find(c => c.id === (prev as any).analistaId)?.nome || (prev as any).analistaId || 'Nenhum';
        const analNovo = this.getColaboradores().find(c => c.id === (r as any).analistaId)?.nome || (r as any).analistaId;
        changes.push(`Analista: ${analAnterior} → ${analNovo}`);
      }
      if ((r as any).categoriaId && (r as any).categoriaId !== (prev as any).categoriaId) {
        const catAnterior = this.getCategorias().find(c => c.id === (prev as any).categoriaId)?.nome || 'Nenhuma';
        const catNova = this.getCategorias().find(c => c.id === (r as any).categoriaId)?.nome || (r as any).categoriaId;
        changes.push(`Categoria: ${catAnterior} → ${catNova}`);
      }
      if ((r as any).categoriaRiscoId && (r as any).categoriaRiscoId !== (prev as any).categoriaRiscoId) {
        const catRiscoAnterior = this.getCategoriasRisco().find(c => c.id === (prev as any).categoriaRiscoId)?.nome || 'Nenhuma';
        const catRiscoNova = this.getCategoriasRisco().find(c => c.id === (r as any).categoriaRiscoId)?.nome || (r as any).categoriaRiscoId;
        changes.push(`Categoria de Risco: ${catRiscoAnterior} → ${catRiscoNova}`);
      }
      
      if (changes.length) {
        next.historico = [...(prev.historico||[]), { data: new Date().toISOString(), evento: changes.join(' | '), autor: 'Sistema' }];
      }
      db.riscos[i] = next;
      writeDB(db);
      return db.riscos[i];
    }
    return null;
  }
  addOcorrenciaRisco(id: string, evento: { data: string; evento: string; autor: string }) {
    const db = readDB();
    const i = db.riscos.findIndex(x => x.id === id);
    if (i>=0) {
      const prev = db.riscos[i];
      const next = { ...prev, historico: [...(prev.historico||[]), evento] } as Risco;
      db.riscos[i] = next;
      writeDB(db);
      return next;
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
      if (p.tapPdf && !prev.tapPdf) changes.push('TAP PDF gerada');
      if (changes.length) {
        next.historico = [...(prev.historico||[]), { data: new Date().toISOString(), evento: changes.join(' | '), autor: 'Sistema' }];
      }
      db.projetos[i] = next;
      writeDB(db);
      return db.projetos[i];
    }
    return null;
  }

  deleteProjeto(id: string) {
    const db = readDB();
    db.projetos = db.projetos.filter(p => p.id !== id);
    writeDB(db);
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

  addDemoData() {
    const db = readDB();
    // Empresas adicionais
    const empIds = new Set(db.empresas.map(e=>e.id));
    const extraEmpresas: Empresa[] = [
      { id: 'EMP003', nome: 'Unidade Várzea Grande' },
      { id: 'EMP004', nome: 'Unidade Rondonópolis' }
    ];
    for (const e of extraEmpresas) if (!empIds.has(e.id)) db.empresas.push(e);

    // Colaboradores adicionais
    const colIds = new Set(db.colaboradores.map(c=>c.id));
    const extraCols: Colaborador[] = [
      { id: 'COL003', nome: 'Yago', email: 'yago@empresa.com', empresaId: 'EMP001' },
      { id: 'COL004', nome: 'Marina', email: 'marina@empresa.com', empresaId: 'EMP003' }
    ];
    for (const c of extraCols) if (!colIds.has(c.id)) db.colaboradores.push(c);

    // Riscos adicionais (com diferentes combinações)
    const riscoIds = new Set(db.riscos.map(r=>r.id));
    const nowIso = new Date().toISOString();
    const extraRiscos: Risco[] = [
      { id: 'RSK010', empresaId: 'EMP003', titulo: 'Interrupção de fornecimento elétrico', descricao: 'Queda de energia pode afetar produção.', analistaId: 'COL004', probabilidade: 'Alta', impacto: 'Alto', status: 'Aberto', matriz: 'Alto', historico: [{ data: nowIso, evento: 'Risco criado (demo)', autor: 'Sistema' }] },
      { id: 'RSK011', empresaId: 'EMP004', titulo: 'Risco logístico rodoviário', descricao: 'Atrasos por problemas na BR.', analistaId: 'COL003', probabilidade: 'Média', impacto: 'Médio', status: 'Mitigando', matriz: 'Médio', historico: [{ data: nowIso, evento: 'Risco criado (demo)', autor: 'Sistema' }] },
      { id: 'RSK012', empresaId: 'EMP001', titulo: 'Falha de IoT sensores', descricao: 'Sensores não reportam dados.', analistaId: 'COL001', probabilidade: 'Baixa', impacto: 'Médio', status: 'Aberto', matriz: 'Baixo', historico: [{ data: nowIso, evento: 'Risco criado (demo)', autor: 'Sistema' }] }
    ];
    for (const r of extraRiscos) if (!riscoIds.has(r.id)) db.riscos.push(r);

    // Projetos demo (reaproveita função)
    const existingIds = new Set(db.projetos.map(p=>p.id));
    const now = Date.now();
    const extraProj: Projeto[] = [
      { id: 'PRJ200', titulo: 'Backup de Energia', riscoId: 'RSK010', etapa: 'Planejamento', prazo: new Date(now + 20*24*60*60*1000).toISOString(), responsavelId: 'COL004', escopo: { objetivo: 'Instalar gerador', entregas: 'Gerador instalado', recursos: 'Manutenção' }, historico: [{ data: nowIso, evento: 'Projeto criado (demo)', autor: 'Sistema' }] },
      { id: 'PRJ201', titulo: 'Plano Logístico Alternativo', riscoId: 'RSK011', etapa: 'Execução', prazo: new Date(now + 10*24*60*60*1000).toISOString(), responsavelId: 'COL003', escopo: { objetivo: 'Rotas alternativas', entregas: 'Mapa e contratos', recursos: 'Logística' }, historico: [{ data: nowIso, evento: 'Projeto criado (demo)', autor: 'Sistema' }] },
      { id: 'PRJ202', titulo: 'Auditoria de Sensores', riscoId: 'RSK012', etapa: 'Backlog', prazo: new Date(now + 40*24*60*60*1000).toISOString(), responsavelId: 'COL001', escopo: { objetivo: 'Auditar rede IoT', entregas: 'Relatório auditoria', recursos: 'TI' }, historico: [{ data: nowIso, evento: 'Projeto criado (demo)', autor: 'Sistema' }] }
    ];
    for (const p of extraProj) if (!existingIds.has(p.id)) db.projetos.push(p);

    writeDB(db);
    return db;
  }

  generateProjetoFromRisco(riscoId: string) {
    const db = readDB();
    const r = db.riscos.find(x => x.id === riscoId);
    if (!r) return null;
    const proj: Projeto = {
      id: `PRJ-${Date.now()}`,
      titulo: r.titulo,
      riscoId: r.id,
      etapa: 'Backlog',
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
