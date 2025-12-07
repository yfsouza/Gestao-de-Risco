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
exports.router.post('/stakeholders-grupos/:id/participantes', (req, res) => {
    const { colaboradoresIds = [], stakeholdersIds = [] } = req.body || {};
    const g = store.addParticipantesGrupo(req.params.id, colaboradoresIds, stakeholdersIds);
    if (!g)
        return res.sendStatus(404);
    res.json(g);
});
exports.router.post('/stakeholders-grupos/:id/fechar', (req, res) => {
    const g = store.fecharGrupo(req.params.id);
    if (!g)
        return res.sendStatus(404);
    res.json(g);
});
exports.router.post('/stakeholders-grupos/:id/abrir', (req, res) => {
    const g = store.abrirGrupo(req.params.id);
    if (!g)
        return res.sendStatus(404);
    res.json(g);
});
exports.router.get('/stakeholders', (req, res) => res.json(store.getStakeholders()));
exports.router.post('/stakeholders', (req, res) => res.json(store.addStakeholder(req.body)));
exports.router.delete('/stakeholders/:id', (req, res) => { store.deleteStakeholder(req.params.id); res.sendStatus(204); });
// Riscos
exports.router.get('/riscos', (req, res) => res.json(store.getRiscos()));
exports.router.get('/riscos/:id', (req, res) => {
    const r = store.getRisco(req.params.id);
    if (!r)
        return res.sendStatus(404);
    res.json(r);
});
exports.router.post('/riscos', (req, res) => {
    const risk = { ...req.body, id: (0, uuid_1.v4)(), historico: [] };
    res.json(store.addRisco(risk));
});
exports.router.put('/riscos/:id', (req, res) => res.json(store.updateRisco(req.params.id, req.body)));
exports.router.delete('/riscos/:id', (req, res) => { store.deleteRisco(req.params.id); res.sendStatus(204); });
exports.router.post('/riscos/:id/gerar-projeto', (req, res) => res.json(store.generateProjetoFromRisco(req.params.id)));
exports.router.post('/riscos/:id/ocorrencias', (req, res) => {
    const { data, impedimento, acoes, responsavel, stakeholdersGruposIds, stakeholdersIds } = req.body || {};
    let stakeholdersInfo = '';
    if (Array.isArray(stakeholdersGruposIds) && stakeholdersGruposIds.length) {
        const grupos = store.getStakeholdersGrupos().filter(g => stakeholdersGruposIds.includes(g.id));
        const resumo = grupos.map(g => `${g.nome}`).join(' | ');
        stakeholdersInfo = ` | stakeholders="${resumo}"`;
    }
    if (Array.isArray(stakeholdersIds) && stakeholdersIds.length) {
        const pessoas = store.getStakeholders().filter(s => stakeholdersIds.includes(s.id));
        const resumoP = pessoas.map(s => `${s.nome}${s.setor ? ' - ' + s.setor : ''} [${[s.email, s.telefone].filter(Boolean).join('; ')}]`).join(' | ');
        stakeholdersInfo += ` | pessoas="${resumoP}"`;
    }
    const texto = `Ocorrência: impedimento="${impedimento}" | ações="${acoes}" | responsável="${responsavel}"${stakeholdersInfo}`;
    const evento = { data: data || new Date().toISOString(), evento: texto, autor: responsavel || 'Sistema' };
    const r = store.addOcorrenciaRisco(req.params.id, evento);
    if (!r)
        return res.sendStatus(404);
    res.json(r);
});
// Projetos
exports.router.get('/projetos', (req, res) => res.json(store.getProjetos()));
exports.router.put('/projetos/:id', (req, res) => res.json(store.updateProjeto(req.params.id, req.body)));
// Dev: popular demos
exports.router.post('/projetos/dev/seed', (req, res) => res.json(store.addDemoProjects()));
exports.router.post('/dev/seed-all', (req, res) => res.json(store.addDemoData()));
// Relatórios
exports.router.get('/relatorios/dashboard', (req, res) => res.json(store.getDashboard()));
