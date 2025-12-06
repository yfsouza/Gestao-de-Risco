"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const store_1 = require("./store");
const uuid_1 = require("uuid");
exports.router = (0, express_1.Router)();
const store = new store_1.DataStore();
// Empresas
exports.router.get('/empresas', (req, res) => res.json(store.getEmpresas()));
exports.router.post('/empresas', (req, res) => res.json(store.addEmpresa(req.body)));
exports.router.delete('/empresas/:id', (req, res) => { store.deleteEmpresa(req.params.id); res.sendStatus(204); });
// Colaboradores
exports.router.get('/colaboradores', (req, res) => res.json(store.getColaboradores()));
exports.router.post('/colaboradores', (req, res) => res.json(store.addColaborador(req.body)));
exports.router.delete('/colaboradores/:id', (req, res) => { store.deleteColaborador(req.params.id); res.sendStatus(204); });
// Stakeholders
exports.router.get('/stakeholders-grupos', (req, res) => res.json(store.getStakeholdersGrupos()));
exports.router.post('/stakeholders-grupos', (req, res) => res.json(store.addStakeholdersGrupo(req.body)));
exports.router.delete('/stakeholders-grupos/:id', (req, res) => { store.deleteStakeholdersGrupo(req.params.id); res.sendStatus(204); });
// Riscos
exports.router.get('/riscos', (req, res) => res.json(store.getRiscos()));
exports.router.post('/riscos', (req, res) => {
    const risk = { ...req.body, id: (0, uuid_1.v4)(), historico: [] };
    res.json(store.addRisco(risk));
});
exports.router.put('/riscos/:id', (req, res) => res.json(store.updateRisco(req.params.id, req.body)));
exports.router.delete('/riscos/:id', (req, res) => { store.deleteRisco(req.params.id); res.sendStatus(204); });
exports.router.post('/riscos/:id/gerar-projeto', (req, res) => res.json(store.generateProjetoFromRisco(req.params.id)));
// Projetos
exports.router.get('/projetos', (req, res) => res.json(store.getProjetos()));
exports.router.put('/projetos/:id', (req, res) => res.json(store.updateProjeto(req.params.id, req.body)));
// Dev: popular demos
exports.router.post('/projetos/dev/seed', (req, res) => res.json(store.addDemoProjects()));
// Relatórios
exports.router.get('/relatorios/dashboard', (req, res) => res.json(store.getDashboard()));
