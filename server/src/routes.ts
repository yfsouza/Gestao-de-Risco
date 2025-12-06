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
router.delete('/colaboradores/:id', (req, res) => { store.deleteColaborador(req.params.id); res.sendStatus(204); });

// Stakeholders
router.get('/stakeholders-grupos', (req, res) => res.json(store.getStakeholdersGrupos()));
router.post('/stakeholders-grupos', (req, res) => res.json(store.addStakeholdersGrupo(req.body)));
router.delete('/stakeholders-grupos/:id', (req, res) => { store.deleteStakeholdersGrupo(req.params.id); res.sendStatus(204); });

// Riscos
router.get('/riscos', (req, res) => res.json(store.getRiscos()));
router.post('/riscos', (req, res) => {
  const risk = { ...req.body, id: uuid(), historico: [] };
  res.json(store.addRisco(risk));
});
router.put('/riscos/:id', (req, res) => res.json(store.updateRisco(req.params.id, req.body)));
router.delete('/riscos/:id', (req, res) => { store.deleteRisco(req.params.id); res.sendStatus(204); });
router.post('/riscos/:id/gerar-projeto', (req, res) => res.json(store.generateProjetoFromRisco(req.params.id)));

// Projetos
router.get('/projetos', (req, res) => res.json(store.getProjetos()));
router.put('/projetos/:id', (req, res) => res.json(store.updateProjeto(req.params.id, req.body)));
// Dev: popular demos
router.post('/projetos/dev/seed', (req, res) => res.json(store.addDemoProjects()));

// Relatórios
router.get('/relatorios/dashboard', (req, res) => res.json(store.getDashboard()));

