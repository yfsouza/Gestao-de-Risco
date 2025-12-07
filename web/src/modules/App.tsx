import React, { useEffect, useState } from 'react';
import { RisksPage } from './RisksPageNew';
import { ProjectsPage } from './ProjectsPage';
import { CommitteePage } from './CommitteePage';
import { ReportsPage } from './ReportsPage';
import { AdminPage } from './AdminPage';

export type Empresa = { id: string; nome: string };
export type Colaborador = { id: string; nome: string; email: string; empresaId: string };
export type StakeholdersGrupo = {
  id: string;
  nome: string;
  descricao?: string;
  participantesColabIds?: string[];
  participantesStakeIds?: string[];
  fechado?: boolean;
};
export type Risco = {
  id: string;
  empresaId: string;
  titulo: string;
  descricao: string;
  analistaId?: string;
  probabilidade: 'Baixa'|'Média'|'Alta';
  impacto: 'Baixo'|'Médio'|'Alto';
  status: 'Aberto'|'Mitigando'|'Encerrado';
  createdAt?: string;
  matriz: string;
  historico: { data: string; evento: string; autor: string }[];
};
export type Projeto = {
  id: string;
  titulo: string;
  riscoId?: string;
  etapa: 'Backlog'|'Planejamento'|'Execução'|'Concluído';
  prazo?: string;
  responsavelId?: string;
  escopo: { objetivo?: string; entregas?: string; recursos?: string };
  historico: { data: string; evento: string; autor: string }[];
};

export type AppState = {
  empresas: Empresa[];
  colaboradores: Colaborador[];
  stakeholdersGrupos: StakeholdersGrupo[];
};

export const App: React.FC = () => {
  const [screen, setScreen] = useState<'risks'|'risks-form'|'projects'|'committee'|'reports'|'admin'>('risks');
  const [base, setBase] = useState<AppState>({ empresas: [], colaboradores: [], stakeholdersGrupos: [] });
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/empresas').then(r=>r.json()),
      fetch('/api/colaboradores').then(r=>r.json()),
      fetch('/api/stakeholders-grupos').then(r=>r.json()),
    ]).then(([empresas, colaboradores, stakeholdersGrupos]) => setBase({ empresas, colaboradores, stakeholdersGrupos }));
  }, []);

  return (
    <div>
      <header className="app-header">
        <div className="container header-content">
          <div className="logo"><i className="fa-solid fa-shield-halved"></i> Gestão de Risco</div>
          <nav className="app-nav">
            <ul>
              {['risks','committee','projects','reports','admin'].map(k => (
                <li key={k}>
                  <button className={screen===k? 'active' : ''} onClick={() => setScreen(k as any)}>
                    <i className={
                      k==='risks' ? 'fa-solid fa-triangle-exclamation' :
                      k==='projects' ? 'fa-solid fa-diagram-project' :
                      k==='committee' ? 'fa-solid fa-users' :
                      k==='reports' ? 'fa-solid fa-chart-line' : 'fa-solid fa-gear'
                    }></i>
                    {k === 'risks' ? 'Riscos' : k === 'projects' ? 'Projetos' : k === 'committee' ? 'Comitê' : k === 'reports' ? 'Relatórios' : 'Configurações'}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main className="container" style={{ paddingTop: '1.5rem', paddingBottom: '2rem' }}>
        {screen === 'risks' && <RisksPage base={base} setScreen={setScreen} showForm={false} setSelectedRiskId={setSelectedRiskId} selectedRiskId={selectedRiskId} />}
        {screen === 'risks-form' && <RisksPage base={base} setScreen={setScreen} showForm={true} selectedRiskId={selectedRiskId} setSelectedRiskId={setSelectedRiskId} />}
        {screen === 'projects' && <ProjectsPage base={base} />}
        {screen === 'committee' && <CommitteePage />}
        {screen === 'reports' && <ReportsPage />}
        {screen === 'admin' && <AdminPage base={base} setBase={setBase} />}
      </main>
    </div>
  );
}
