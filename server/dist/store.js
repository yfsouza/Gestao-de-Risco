"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dataDir = path_1.default.join(process.cwd(), 'server', 'data');
const filePath = path_1.default.join(dataDir, 'db.json');
const ensureData = () => {
    if (!fs_1.default.existsSync(dataDir))
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    if (!fs_1.default.existsSync(filePath)) {
        const initial = {
            empresas: [
                { id: 'EMP001', nome: 'Matriz Lucas do Rio Verde' },
                { id: 'EMP002', nome: 'Filial Sinop' }
            ],
            colaboradores: [
                { id: 'COL001', nome: 'Carlos', email: 'carlos@empresa.com', empresaId: 'EMP001' },
                { id: 'COL002', nome: 'Ana', email: 'ana@empresa.com', empresaId: 'EMP002' }
            ],
            stakeholdersGrupos: [
                { id: 'STKGRP001', nome: 'Comitê de Riscos', descricao: 'Grupo principal de acompanhamento dos riscos', participantesColabIds: ['COL001'], participantesStakeIds: ['STK001', 'STK002'], fechado: true }
            ],
            stakeholders: [
                { id: 'STK001', nome: 'Gestor de Qualidade', setor: 'Qualidade', email: 'qualidade@empresa.com', telefone: '(65) 9000-0001' },
                { id: 'STK002', nome: 'Gestor de TI', setor: 'TI', email: 'ti@empresa.com', telefone: '(65) 9000-0002' }
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
                    prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    responsavelId: 'COL001',
                    escopo: { objetivo: 'Garantir manutenção preventiva e sensores redundantes', entregas: 'Checklist de manutenção; instalação de sensores', recursos: 'Equipe de manutenção; orçamento' },
                    historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (seed)', autor: 'Sistema' }]
                },
                {
                    id: 'PRJ002',
                    titulo: 'Plano alternativo para embalagens',
                    riscoId: 'RSK002',
                    etapa: 'Execução',
                    prazo: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    responsavelId: 'COL002',
                    escopo: { objetivo: 'Qualificar fornecedor backup', entregas: 'Contrato assinado; lote teste recebido', recursos: 'Compras; jurídico' },
                    historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (seed)', autor: 'Sistema' }]
                },
                {
                    id: 'PRJ003',
                    titulo: 'Treinamento cross para função crítica',
                    riscoId: 'RSK003',
                    etapa: 'Concluído',
                    prazo: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    responsavelId: 'COL001',
                    escopo: { objetivo: 'Cobertura por equipe treinada', entregas: 'Matriz de habilidades atualizada', recursos: 'RH; operação' },
                    historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (seed)', autor: 'Sistema' }]
                },
                {
                    id: 'PRJ004',
                    titulo: 'Auditoria de processos internos',
                    etapa: 'Backlog',
                    prazo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                    responsavelId: 'COL002',
                    escopo: { objetivo: 'Mapear riscos operacionais sem vínculo direto', entregas: 'Relatório de auditoria', recursos: 'Equipe de qualidade' },
                    historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (seed - sem risco associado)', autor: 'Sistema' }]
                }
            ]
        };
        fs_1.default.writeFileSync(filePath, JSON.stringify(initial, null, 2));
    }
};
const readDB = () => {
    ensureData();
    return JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
};
const writeDB = (db) => {
    fs_1.default.writeFileSync(filePath, JSON.stringify(db, null, 2));
};
class DataStore {
    getEmpresas() { return readDB().empresas; }
    addEmpresa(emp) { const db = readDB(); db.empresas.push(emp); writeDB(db); return emp; }
    deleteEmpresa(id) { const db = readDB(); db.empresas = db.empresas.filter(e => e.id !== id); writeDB(db); }
    getColaboradores() { return readDB().colaboradores; }
    addColaborador(c) { const db = readDB(); db.colaboradores.push(c); writeDB(db); return c; }
    deleteColaborador(id) { const db = readDB(); db.colaboradores = db.colaboradores.filter(e => e.id !== id); writeDB(db); }
    getStakeholdersGrupos() { return readDB().stakeholdersGrupos; }
    addStakeholdersGrupo(g) { const db = readDB(); db.stakeholdersGrupos.push({ ...g, participantesColabIds: g.participantesColabIds || [], participantesStakeIds: g.participantesStakeIds || [], fechado: !!g.fechado }); writeDB(db); return g; }
    deleteStakeholdersGrupo(id) { const db = readDB(); db.stakeholdersGrupos = db.stakeholdersGrupos.filter(e => e.id !== id); writeDB(db); }
    addParticipantesGrupo(id, colabIds, stakeIds) {
        const db = readDB();
        const i = db.stakeholdersGrupos.findIndex(g => g.id === id);
        if (i < 0)
            return null;
        const g = db.stakeholdersGrupos[i];
        const setCol = new Set([...(g.participantesColabIds || []), ...(colabIds || [])]);
        const setStk = new Set([...(g.participantesStakeIds || []), ...(stakeIds || [])]);
        db.stakeholdersGrupos[i] = { ...g, participantesColabIds: Array.from(setCol), participantesStakeIds: Array.from(setStk) };
        writeDB(db);
        return db.stakeholdersGrupos[i];
    }
    fecharGrupo(id) {
        const db = readDB();
        const i = db.stakeholdersGrupos.findIndex(g => g.id === id);
        if (i < 0)
            return null;
        db.stakeholdersGrupos[i] = { ...db.stakeholdersGrupos[i], fechado: true };
        writeDB(db);
        return db.stakeholdersGrupos[i];
    }
    abrirGrupo(id) {
        const db = readDB();
        const i = db.stakeholdersGrupos.findIndex(g => g.id === id);
        if (i < 0)
            return null;
        db.stakeholdersGrupos[i] = { ...db.stakeholdersGrupos[i], fechado: false };
        writeDB(db);
        return db.stakeholdersGrupos[i];
    }
    getStakeholders() { const db = readDB(); return db.stakeholders || []; }
    addStakeholder(s) { const db = readDB(); db.stakeholders = db.stakeholders || []; db.stakeholders.push(s); writeDB(db); return s; }
    deleteStakeholder(id) { const db = readDB(); db.stakeholders = (db.stakeholders || []).filter(e => e.id !== id); writeDB(db); }
    getRiscos() { return readDB().riscos; }
    getRisco(id) { return readDB().riscos.find(r => r.id === id) || null; }
    addRisco(r) { const db = readDB(); r.historico = [...(r.historico || []), { data: new Date().toISOString(), evento: 'Risco criado', autor: 'Sistema' }]; db.riscos.push(r); writeDB(db); return r; }
    updateRisco(id, r) {
        const db = readDB();
        const i = db.riscos.findIndex(x => x.id === id);
        if (i >= 0) {
            const prev = db.riscos[i];
            const next = { ...prev, ...r };
            const changes = [];
            if (r.status && r.status !== prev.status)
                changes.push(`Status: ${prev.status} → ${r.status}`);
            if (r.probabilidade && r.probabilidade !== prev.probabilidade)
                changes.push(`Probabilidade: ${prev.probabilidade} → ${r.probabilidade}`);
            if (r.impacto && r.impacto !== prev.impacto)
                changes.push(`Impacto: ${prev.impacto} → ${r.impacto}`);
            if (r.matriz && r.matriz !== prev.matriz)
                changes.push(`Matriz: ${prev.matriz} → ${r.matriz}`);
            if (r.titulo && r.titulo !== prev.titulo)
                changes.push(`Título alterado`);
            if (r.descricao && r.descricao !== prev.descricao)
                changes.push(`Descrição alterada`);
            if (changes.length) {
                next.historico = [...(prev.historico || []), { data: new Date().toISOString(), evento: changes.join(' | '), autor: 'Sistema' }];
            }
            db.riscos[i] = next;
            writeDB(db);
            return db.riscos[i];
        }
        return null;
    }
    addOcorrenciaRisco(id, evento) {
        const db = readDB();
        const i = db.riscos.findIndex(x => x.id === id);
        if (i >= 0) {
            const prev = db.riscos[i];
            const next = { ...prev, historico: [...(prev.historico || []), evento] };
            db.riscos[i] = next;
            writeDB(db);
            return next;
        }
        return null;
    }
    deleteRisco(id) { const db = readDB(); db.riscos = db.riscos.filter(e => e.id !== id); writeDB(db); }
    getProjetos() { return readDB().projetos; }
    addProjeto(p) { const db = readDB(); p.historico = [...(p.historico || []), { data: new Date().toISOString(), evento: 'Projeto criado', autor: 'Sistema' }]; db.projetos.push(p); writeDB(db); return p; }
    updateProjeto(id, p) {
        const db = readDB();
        const i = db.projetos.findIndex(x => x.id === id);
        if (i >= 0) {
            const prev = db.projetos[i];
            const next = { ...prev, ...p };
            const changes = [];
            if (p.etapa && p.etapa !== prev.etapa)
                changes.push(`Etapa: ${prev.etapa} → ${p.etapa}`);
            if (p.prazo && p.prazo !== prev.prazo)
                changes.push('Prazo alterado');
            if (p.responsavelId && p.responsavelId !== prev.responsavelId)
                changes.push('Responsável alterado');
            if (p.escopo && JSON.stringify(p.escopo) !== JSON.stringify(prev.escopo))
                changes.push('Escopo alterado');
            if (changes.length) {
                next.historico = [...(prev.historico || []), { data: new Date().toISOString(), evento: changes.join(' | '), autor: 'Sistema' }];
            }
            db.projetos[i] = next;
            writeDB(db);
            return db.projetos[i];
        }
        return null;
    }
    addDemoProjects() {
        const db = readDB();
        if (db.projetos.length >= 6)
            return db.projetos; // já tem o suficiente
        const now = Date.now();
        const demos = [
            { id: 'PRJ100', titulo: 'Projeto de Modernização', riscoId: 'RSK001', etapa: 'Concluído', prazo: new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString(), responsavelId: 'COL001', escopo: { objetivo: 'Modernizar linha de produção', entregas: 'Linha atualizada', recursos: 'Equipe engenharia' }, historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (demo)', autor: 'Sistema' }] },
            { id: 'PRJ101', titulo: 'Projeto de Monitoramento', riscoId: 'RSK004', etapa: 'Execução', prazo: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(), responsavelId: 'COL002', escopo: { objetivo: 'Monitorar rede e ERPs', entregas: 'Painel de monitoramento', recursos: 'TI' }, historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (demo)', autor: 'Sistema' }] },
            { id: 'PRJ102', titulo: 'Projeto de Iniciação', etapa: 'Backlog', prazo: new Date(now + 15 * 24 * 60 * 60 * 1000).toISOString(), responsavelId: 'COL001', escopo: { objetivo: 'Levantamento inicial', entregas: 'Documento de escopo', recursos: 'PMO' }, historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (demo)', autor: 'Sistema' }] },
            { id: 'PRJ103', titulo: 'Planejamento de Auditoria', riscoId: 'RSK005', etapa: 'Planejamento', prazo: new Date(now + 45 * 24 * 60 * 60 * 1000).toISOString(), responsavelId: 'COL002', escopo: { objetivo: 'Planejar auditoria regulatória', entregas: 'Plano de auditoria', recursos: 'Qualidade' }, historico: [{ data: new Date().toISOString(), evento: 'Projeto criado (demo)', autor: 'Sistema' }] }
        ];
        const existingIds = new Set(db.projetos.map(p => p.id));
        for (const d of demos)
            if (!existingIds.has(d.id))
                db.projetos.push(d);
        writeDB(db);
        return db.projetos;
    }
    addDemoData() {
        const db = readDB();
        // Empresas adicionais
        const empIds = new Set(db.empresas.map(e => e.id));
        const extraEmpresas = [
            { id: 'EMP003', nome: 'Unidade Várzea Grande' },
            { id: 'EMP004', nome: 'Unidade Rondonópolis' }
        ];
        for (const e of extraEmpresas)
            if (!empIds.has(e.id))
                db.empresas.push(e);
        // Colaboradores adicionais
        const colIds = new Set(db.colaboradores.map(c => c.id));
        const extraCols = [
            { id: 'COL003', nome: 'Yago', email: 'yago@empresa.com', empresaId: 'EMP001' },
            { id: 'COL004', nome: 'Marina', email: 'marina@empresa.com', empresaId: 'EMP003' }
        ];
        for (const c of extraCols)
            if (!colIds.has(c.id))
                db.colaboradores.push(c);
        // Riscos adicionais (com diferentes combinações)
        const riscoIds = new Set(db.riscos.map(r => r.id));
        const nowIso = new Date().toISOString();
        const extraRiscos = [
            { id: 'RSK010', empresaId: 'EMP003', titulo: 'Interrupção de fornecimento elétrico', descricao: 'Queda de energia pode afetar produção.', analistaId: 'COL004', probabilidade: 'Alta', impacto: 'Alto', status: 'Aberto', matriz: 'Alto', historico: [{ data: nowIso, evento: 'Risco criado (demo)', autor: 'Sistema' }] },
            { id: 'RSK011', empresaId: 'EMP004', titulo: 'Risco logístico rodoviário', descricao: 'Atrasos por problemas na BR.', analistaId: 'COL003', probabilidade: 'Média', impacto: 'Médio', status: 'Mitigando', matriz: 'Médio', historico: [{ data: nowIso, evento: 'Risco criado (demo)', autor: 'Sistema' }] },
            { id: 'RSK012', empresaId: 'EMP001', titulo: 'Falha de IoT sensores', descricao: 'Sensores não reportam dados.', analistaId: 'COL001', probabilidade: 'Baixa', impacto: 'Médio', status: 'Aberto', matriz: 'Baixo', historico: [{ data: nowIso, evento: 'Risco criado (demo)', autor: 'Sistema' }] }
        ];
        for (const r of extraRiscos)
            if (!riscoIds.has(r.id))
                db.riscos.push(r);
        // Projetos demo (reaproveita função)
        const existingIds = new Set(db.projetos.map(p => p.id));
        const now = Date.now();
        const extraProj = [
            { id: 'PRJ200', titulo: 'Backup de Energia', riscoId: 'RSK010', etapa: 'Planejamento', prazo: new Date(now + 20 * 24 * 60 * 60 * 1000).toISOString(), responsavelId: 'COL004', escopo: { objetivo: 'Instalar gerador', entregas: 'Gerador instalado', recursos: 'Manutenção' }, historico: [{ data: nowIso, evento: 'Projeto criado (demo)', autor: 'Sistema' }] },
            { id: 'PRJ201', titulo: 'Plano Logístico Alternativo', riscoId: 'RSK011', etapa: 'Execução', prazo: new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString(), responsavelId: 'COL003', escopo: { objetivo: 'Rotas alternativas', entregas: 'Mapa e contratos', recursos: 'Logística' }, historico: [{ data: nowIso, evento: 'Projeto criado (demo)', autor: 'Sistema' }] },
            { id: 'PRJ202', titulo: 'Auditoria de Sensores', riscoId: 'RSK012', etapa: 'Backlog', prazo: new Date(now + 40 * 24 * 60 * 60 * 1000).toISOString(), responsavelId: 'COL001', escopo: { objetivo: 'Auditar rede IoT', entregas: 'Relatório auditoria', recursos: 'TI' }, historico: [{ data: nowIso, evento: 'Projeto criado (demo)', autor: 'Sistema' }] }
        ];
        for (const p of extraProj)
            if (!existingIds.has(p.id))
                db.projetos.push(p);
        writeDB(db);
        return db;
    }
    generateProjetoFromRisco(riscoId) {
        const db = readDB();
        const r = db.riscos.find(x => x.id === riscoId);
        if (!r)
            return null;
        const proj = {
            id: `PRJ-${Date.now()}`,
            titulo: r.titulo,
            riscoId: r.id,
            etapa: 'Planejamento',
            escopo: { objetivo: r.descricao },
            historico: [{ data: new Date().toISOString(), evento: 'Gerado a partir do risco', autor: 'Sistema' }]
        };
        db.projetos.push(proj);
        r.historico = [...(r.historico || []), { data: new Date().toISOString(), evento: `Projeto ${proj.id} gerado`, autor: 'Sistema' }];
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
exports.DataStore = DataStore;
