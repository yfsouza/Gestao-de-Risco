import { Router } from 'express';
import { DataStore } from './store';
import { v4 as uuid } from 'uuid';

export const router = Router();
const store = new DataStore();

// Empresas
router.get('/empresas', (req, res) => res.json(store.getEmpresas()));
router.post('/empresas', (req, res) => res.json(store.addEmpresa(req.body)));
router.delete('/empresas/:id', (req, res) => { store.deleteEmpresa(req.params.id); res.sendStatus(204); });

// Colaboradores
router.get('/colaboradores', (req, res) => res.json(store.getColaboradores()));
router.post('/colaboradores', (req, res) => {
  const bodyId = (req.body && req.body.id) ? String(req.body.id).toUpperCase().trim() : null;
  const cols = store.getColaboradores();
  // If client provided an id, validate uniqueness
  if (bodyId) {
    const exists = cols.some(c => (c.id || '').toUpperCase() === bodyId);
    if (exists) return res.status(409).json({ error: 'ID already exists' });
    const colaborador = { id: bodyId, ...req.body };
    return res.json(store.addColaborador(colaborador));
  }
  // Gerar ID incremental no formato COL### com padding de 3 dígitos
  let maxNum = 0;
  cols.forEach(c => {
    const m = String(c.id || '').match(/COL(\d+)/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });
  const next = (maxNum + 1).toString().padStart(3, '0');
  const id = 'COL' + next;
  const colaborador = { id, ...req.body };
  res.json(store.addColaborador(colaborador));
});
router.put('/colaboradores/:id', (req, res) => {
  const newId = req.body && req.body.id ? String(req.body.id).toUpperCase().trim() : null;
  const cols = store.getColaboradores();
  // If client attempts to change the id, ensure uniqueness
  if (newId && newId !== String(req.params.id).toUpperCase()) {
    const exists = cols.some(col => (col.id || '').toUpperCase() === newId);
    if (exists) return res.status(409).json({ error: 'ID already exists' });
  }
  const c = store.updateColaborador(req.params.id, req.body);
  if (!c) return res.sendStatus(404);
  res.json(c);
});

// Atualizar colaborador buscando pelo email (útil quando o id está em branco no registro)
router.put('/colaboradores/by-email', (req, res) => {
  const email = req.body && req.body.email ? String(req.body.email).trim() : null;
  if (!email) return res.status(400).json({ error: 'Email é necessário para atualizar por email' });
  const cols = store.getColaboradores();
  const existing = cols.find(c => (c.email || '').toString() === email);
  if (!existing) return res.sendStatus(404);
  const newId = req.body && req.body.id ? String(req.body.id).toUpperCase().trim() : null;
  if (newId && newId !== (existing.id || '').toUpperCase()) {
    const dup = cols.some(c => (c.id || '').toUpperCase() === newId);
    if (dup) return res.status(409).json({ error: 'ID already exists' });
  }
  const updated = store.updateColaborador(existing.id || '', req.body);
  if (!updated) return res.sendStatus(404);
  res.json(updated);
});
router.delete('/colaboradores/:id', (req, res) => { store.deleteColaborador(req.params.id); res.sendStatus(204); });
// Pessoas internas (alias)
router.get('/pessoas-internas', (req, res) => res.json(store.getColaboradores()));

// Stakeholders
router.get('/stakeholders-grupos', (req, res) => res.json(store.getStakeholdersGrupos()));
router.post('/stakeholders-grupos', (req, res) => res.json(store.addStakeholdersGrupo(req.body)));
router.delete('/stakeholders-grupos/:id', (req, res) => { store.deleteStakeholdersGrupo(req.params.id); res.sendStatus(204); });
router.post('/stakeholders-grupos/:id/participantes', (req, res) => {
  const { colaboradoresIds = [], stakeholdersIds = [] } = req.body || {};
  const g = store.addParticipantesGrupo(req.params.id, colaboradoresIds, stakeholdersIds);
  if (!g) return res.sendStatus(404);
  res.json(g);
});
router.post('/stakeholders-grupos/:id/fechar', (req, res) => {
  const g = store.fecharGrupo(req.params.id);
  if (!g) return res.sendStatus(404);
  res.json(g);
});
router.post('/stakeholders-grupos/:id/abrir', (req, res) => {
  const g = store.abrirGrupo(req.params.id);
  if (!g) return res.sendStatus(404);
  res.json(g);
});
router.get('/stakeholders', (req, res) => res.json(store.getStakeholders()));
router.post('/stakeholders', (req, res) => res.json(store.addStakeholder(req.body)));
router.put('/stakeholders/:id', (req, res) => {
  const s = store.updateStakeholder(req.params.id, req.body);
  if (!s) return res.sendStatus(404);
  res.json(s);
});
router.delete('/stakeholders/:id', (req, res) => { store.deleteStakeholder(req.params.id); res.sendStatus(204); });
// Pessoas externas (alias)
router.get('/pessoas-externas', (req, res) => res.json(store.getStakeholders()));

// Categorias de risco
router.get('/categorias-risco', (req, res) => res.json(store.getCategoriasRisco()));
router.post('/categorias-risco', (req, res) => res.json(store.addCategoriaRisco(req.body)));
router.delete('/categorias-risco/:id', (req, res) => { store.deleteCategoriaRisco(req.params.id); res.sendStatus(204); });

// Categorias (genéricas)
router.get('/categorias', (req, res) => res.json(store.getCategorias()));
router.post('/categorias', (req, res) => res.json(store.addCategoria(req.body)));
router.delete('/categorias/:id', (req, res) => { store.deleteCategoria(req.params.id); res.sendStatus(204); });

// Riscos
router.get('/riscos', (req, res) => res.json(store.getRiscos()));
router.get('/riscos/:id', (req, res) => {
  const r = store.getRisco(req.params.id);
  if (!r) return res.sendStatus(404);
  res.json(r);
});
router.post('/riscos', (req, res) => {
  const risk = { ...req.body, id: uuid(), historico: [] };
  res.json(store.addRisco(risk));
});
router.put('/riscos/:id', (req, res) => res.json(store.updateRisco(req.params.id, req.body)));
router.delete('/riscos/:id', (req, res) => { store.deleteRisco(req.params.id); res.sendStatus(204); });
router.post('/riscos/:id/gerar-projeto', (req, res) => res.json(store.generateProjetoFromRisco(req.params.id)));
router.post('/riscos/:id/ocorrencias', (req, res) => {
  const { data, impedimento, acoes, responsavel, stakeholdersGruposIds, stakeholdersIds } = req.body || {};
  let stakeholdersInfo = '';
  if (Array.isArray(stakeholdersGruposIds) && stakeholdersGruposIds.length) {
    const grupos = store.getStakeholdersGrupos().filter(g => stakeholdersGruposIds.includes(g.id));
    const resumo = grupos.map(g => `${g.nome}`).join(' | ');
    stakeholdersInfo = ` | stakeholders="${resumo}"`;
  }
  if (Array.isArray(stakeholdersIds) && stakeholdersIds.length) {
    const pessoas = store.getStakeholders().filter(s => stakeholdersIds.includes(s.id));
    const resumoP = pessoas.map(s => `${s.nome}${s.setor? ' - '+s.setor: ''} [${[s.email, s.telefone].filter(Boolean).join('; ')}]`).join(' | ');
    stakeholdersInfo += ` | pessoas="${resumoP}"`;
  }
  const texto = `Ocorrência: impedimento="${impedimento}" | ações="${acoes}" | responsável="${responsavel}"${stakeholdersInfo}`;
  const evento = { data: data || new Date().toISOString(), evento: texto, autor: responsavel || 'Sistema' };
  const r = store.addOcorrenciaRisco(req.params.id, evento);
  if (!r) return res.sendStatus(404);
  res.json(r);
});

// Projetos
router.get('/projetos', (req, res) => res.json(store.getProjetos()));
router.put('/projetos/:id', (req, res) => res.json(store.updateProjeto(req.params.id, req.body)));
router.delete('/projetos/:id', (req, res) => { store.deleteProjeto(req.params.id); res.sendStatus(204); });
// Cron: arquivar projetos que estão em Concluído por mais que config.projectArchiveMinutes
router.post('/projetos/cron/archive', (req, res) => {
  const cfg = store.getConfig();
  const projetos = store.getProjetos();
  const now = Date.now();
  const changed: any[] = [];
  projetos.forEach(p => {
    if ((p as any).arquivado) return;
    if (p.etapa === 'Concluído' && (p as any).encerramentoData) {
      const encerr = new Date((p as any).encerramentoData).getTime();
      const minutes = Math.floor((now - encerr) / (1000 * 60));
      if (minutes >= (cfg.projectArchiveMinutes || 1)) {
        const up = store.updateProjeto(p.id, { arquivado: true });
        if (up) changed.push(up);
      }
    }
  });
  res.json({ archived: changed.length, projects: changed });
});

// Config
router.get('/config', (req, res) => res.json(store.getConfig()));
router.put('/config', (req, res) => res.json(store.updateConfig(req.body)));
// Dev: popular demos
router.post('/projetos/dev/seed', (req, res) => res.json(store.addDemoProjects()));
router.post('/dev/seed-all', (req, res) => res.json(store.addDemoData()));

// Relatórios
router.get('/relatorios/dashboard', (req, res) => res.json(store.getDashboard()));

