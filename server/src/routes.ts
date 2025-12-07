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
router.post('/colaboradores', (req, res) => res.json(store.addColaborador(req.body)));
router.put('/colaboradores/:id', (req, res) => {
  const c = store.updateColaborador(req.params.id, req.body);
  if (!c) return res.sendStatus(404);
  res.json(c);
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
// Dev: popular demos
router.post('/projetos/dev/seed', (req, res) => res.json(store.addDemoProjects()));
router.post('/dev/seed-all', (req, res) => res.json(store.addDemoData()));

// Relatórios
router.get('/relatorios/dashboard', (req, res) => res.json(store.getDashboard()));

