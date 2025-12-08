import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Projeto } from './App';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { badgeStyle, statusBadge, probBadge, impactoBadge } from '../utils/badges';
import { api } from '../services/api';
import { TAPPage } from './TAPPage';
import { ExecucaoPage } from './ExecucaoPage';

// Tipos auxiliares para controle de execução/etapas
type ExecTask = { id?: string; title: string; completed?: boolean; responsible?: string; date?: string };
type ExecEtapa = { name: string; tasks: ExecTask[] };
type ExecModalState = { open: boolean; projeto?: Projeto; etapas: ExecEtapa[] };

type RiscoAtivo = {
  id: string;
  titulo: string;
  descricao?: string;
  status: 'Aberto'|'Em Andamento'|'Mitigando';
  probabilidade: string;
  impacto: string;
  dataCriacao?: string;
  empresaId?: string;
  responsavelId?: string;
};

// Função para calcular o nível de risco
const parseNivelNum = (txt?: string) => {
  if (!txt) return 3;
  const m = txt.match(/^([1-5])/);
  return m ? parseInt(m[1], 10) : 3;
};

const calcularNivelRisco = (probabilidade: string, impacto: string): 'Baixo'|'Médio'|'Alto' => {
  const p = parseNivelNum(probabilidade);
  const i = parseNivelNum(impacto);
  const score = p + i;
  if (score >= 8) return 'Alto';
  if (score >= 5) return 'Médio';
  return 'Baixo';
};

const nivelRiscoBadge = (nivel: 'Baixo'|'Médio'|'Alto') => {
  if (nivel === 'Alto') return { bg: '#fde2e2', fg: '#c0392b' };
  if (nivel === 'Médio') return { bg: '#fff3cd', fg: '#b7791f' };
  return { bg: '#e2f7e2', fg: '#2e7d32' };
};

export const ProjectsPage: React.FC<{ base: AppState }> = ({ base }) => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [projetosExcluidos, setProjetosExcluidos] = useState<Projeto[]>([]);
  const [riscosAtivos, setRiscosAtivos] = useState<RiscoAtivo[]>([]);
  const [inboxAberta, setInboxAberta] = useState(true);
  const [backlogAberta, setBacklogAberta] = useState(true);
  const [excluidosAberta, setExcluidosAberta] = useState(false);
  const [riscoSelecionado, setRiscoSelecionado] = useState<RiscoAtivo | null>(null);
  const [filtroInbox, setFiltroInbox] = useState<'todos'|'alto'|'medio'|'baixo'>('todos');
  
  // Estados para TAP
  const [showTAPConfirm, setShowTAPConfirm] = useState<{open: boolean; projeto?: Projeto}>({open: false});
  const [showTAP, setShowTAP] = useState<{open: boolean; projeto?: Projeto; risco?: any}>({open: false});
  const [allRiscos, setAllRiscos] = useState<any[]>([]);
  // Estados para execução (confirm + modal de etapas)
  const [showExecConfirm, setShowExecConfirm] = useState<{open: boolean; projeto?: Projeto}>({open: false});
  const [execModal, setExecModal] = useState<ExecModalState>({open: false, etapas: []});
  const [execPageOpen, setExecPageOpen] = useState<{open: boolean; projetoId?: string}>({open: false});
  
  const load = () => fetch('/api/projetos').then(r=>r.json()).then((data) => {
    // Separar projetos ativos dos excluídos
    const ativos = data.filter((p: Projeto) => !p.excluido);
    const excluidos = data.filter((p: Projeto) => p.excluido);
    setProjetos(ativos);
    setProjetosExcluidos(excluidos);
  });
  
  const loadRiscosAtivos = async () => {
    const riscos = await api.riscos();
    setAllRiscos(riscos); // Guardar todos os riscos
    const projetosData = await fetch('/api/projetos').then(r=>r.json());
    // IDs de riscos que já têm projeto (não excluído)
    const riscosComProjeto = projetosData
      .filter((p: any) => !p.excluido)
      .map((p: any) => p.riscoId);
    // Filtrar apenas riscos ativos (não encerrados) e que NÃO têm projeto
    const ativos = riscos.filter((r: any) => 
      r.status !== 'Encerrado' && !riscosComProjeto.includes(r.id)
    );
    setRiscosAtivos(ativos);
  };
  
  useEffect(() => { 
    load(); 
    loadRiscosAtivos();
  }, []);
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [curr, setCurr] = useState<Projeto | null>(null);
  const [riskInfo, setRiskInfo] = useState<any | null>(null);
  const toast = useToast();

  // Função para mover para Planejamento com confirmação de TAP
  const moverParaPlanejamentoComTAP = (projeto: Projeto) => {
    setShowTAPConfirm({ open: true, projeto });
  };

  // Função para iniciar fluxo de execução (pergunta se deseja adicionar etapas)
  const iniciarFluxoExecucao = (projeto: Projeto) => {
    setShowExecConfirm({ open: true, projeto });
  };

  const abrirModalEtapas = () => {
    if (!showExecConfirm.projeto) return;
    setExecModal({ open: true, projeto: showExecConfirm.projeto, etapas: [] });
    setShowExecConfirm({ open: false });
  };

  const adicionarEtapaTemp = (nome: string) => {
    if (!nome) return;
    setExecModal(prev => ({ ...prev, etapas: [...prev.etapas, { name: nome, tasks: [] }] }));
  };

  const removerEtapaTemp = (index: number) => {
    setExecModal(prev => ({ ...prev, etapas: prev.etapas.filter((_, i) => i !== index) }));
  };

  const adicionarTarefaTemp = (etapaIndex: number, titulo: string) => {
    if (!titulo) return;
    setExecModal(prev => {
      const etapas = prev.etapas.map((et, i) => i === etapaIndex ? { ...et, tasks: [...et.tasks, { title: titulo, completed: false }] } : et);
      return { ...prev, etapas };
    });
  };

  const removerTarefaTemp = (etapaIndex: number, tarefaIndex: number) => {
    setExecModal(prev => {
      const etapas = prev.etapas.map((et, i) => i === etapaIndex ? { ...et, tasks: et.tasks.filter((_, j) => j !== tarefaIndex) } : et);
      return { ...prev, etapas };
    });
  };

  const salvarEtapasEExecutar = async () => {
    if (!execModal.projeto) return;
    if (!execModal.etapas || execModal.etapas.length === 0) {
      alert('Por favor, adicione ao menos uma etapa antes de gravar.');
      return;
    }

    try {
      await fetch(`/api/projetos/${execModal.projeto.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ etapa: 'Execução', etapas: execModal.etapas }) });
      toast.show('Projeto movido para Execução e etapas gravadas', 'success');
      setExecModal({ open: false, etapas: [] });
      load();
    } catch (err) {
      toast.show('Erro ao gravar etapas', 'error');
    }
  };

  const confirmarGerarTAP = async () => {
    if (!showTAPConfirm.projeto) return;
    const projeto = showTAPConfirm.projeto;
    
    // Atualizar etapa para Planejamento
    await fetch(`/api/projetos/${projeto.id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ etapa: 'Planejamento', tapGerada: true }) 
    });
    
    // Buscar risco relacionado
    const risco = allRiscos.find(r => r.id === projeto.riscoId);
    
    toast.show('TAP gerada! Complete o preenchimento.', 'success');
    setShowTAPConfirm({ open: false });
    load();
    
    // Abrir tela da TAP
    setShowTAP({ open: true, projeto: { ...projeto, etapa: 'Planejamento' }, risco });
  };

  const abrirTAP = async (projeto: Projeto) => {
    const risco = allRiscos.find(r => r.id === projeto.riscoId);
    setShowTAP({ open: true, projeto, risco });
  };

  const updateEtapa = async (id: string, etapa: Projeto['etapa']) => {
    await fetch(`/api/projetos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ etapa }) });
    toast.show('Etapa atualizada', 'success');
    load();
  };

  const removerProjeto = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este projeto do Kanban?')) return;
    try {
      // Marca como excluído ao invés de deletar permanentemente
      await fetch(`/api/projetos/${id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ excluido: true, dataExclusao: new Date().toISOString() }) 
      });
      toast.show('Projeto movido para Excluídos', 'success');
      load();
      loadRiscosAtivos();
    } catch {
      toast.show('Erro ao remover projeto', 'error');
    }
  };

  const restaurarProjeto = async (id: string) => {
    try {
      await fetch(`/api/projetos/${id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ excluido: false, dataExclusao: null }) 
      });
      toast.show('Projeto restaurado', 'success');
      load();
      loadRiscosAtivos();
    } catch {
      toast.show('Erro ao restaurar projeto', 'error');
    }
  };

  const excluirPermanente = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir PERMANENTEMENTE este projeto?')) return;
    try {
      await fetch(`/api/projetos/${id}`, { method: 'DELETE' });
      toast.show('Projeto excluído permanentemente', 'success');
      load();
    } catch {
      toast.show('Erro ao excluir projeto', 'error');
    }
  };

      const columns: { title: string, etapa: Projeto['etapa'] }[] = [
        { title: 'Iniciação', etapa: 'Backlog' },
        { title: 'Planejamento', etapa: 'Planejamento' },
        { title: 'Execução', etapa: 'Execução' },
            { title: 'Monitoramento', etapa: 'Execução' },
        { title: 'Encerramento', etapa: 'Concluído' },
      ];
  
      const getProjectsForColumn = (col: { title: string; etapa: Projeto['etapa'] }) => {
        if (col.title === 'Execução') return projetos.filter(p => p.etapa === 'Execução' && !(p as any).monitoramento);
        if (col.title === 'Monitoramento') return projetos.filter(p => p.etapa === 'Execução' && !!(p as any).monitoramento);
        return projetos.filter(p => p.etapa === col.etapa);
      };
  const byPrazo = (list: Projeto[]) => [...list].sort((a,b) => {
    const va = a.prazo ? new Date(a.prazo).getTime() : Number.MAX_SAFE_INTEGER;
    const vb = b.prazo ? new Date(b.prazo).getTime() : Number.MAX_SAFE_INTEGER;
    return va - vb;
  });

  // Filtrar riscos da inbox
  const riscosFiltrados = useMemo(() => {
    if (filtroInbox === 'todos') return riscosAtivos;
    return riscosAtivos.filter(r => {
      const nivel = calcularNivelRisco(r.probabilidade, r.impacto).toLowerCase();
      if (filtroInbox === 'alto' && nivel === 'alto') return true;
      if (filtroInbox === 'medio' && nivel === 'médio') return true;
      if (filtroInbox === 'baixo' && nivel === 'baixo') return true;
      return false;
    });
  }, [riscosAtivos, filtroInbox]);

  // Contar por nível
  const contagem = useMemo(() => {
    return {
      alto: riscosAtivos.filter(r => calcularNivelRisco(r.probabilidade, r.impacto) === 'Alto').length,
      medio: riscosAtivos.filter(r => calcularNivelRisco(r.probabilidade, r.impacto) === 'Médio').length,
      baixo: riscosAtivos.filter(r => calcularNivelRisco(r.probabilidade, r.impacto) === 'Baixo').length,
    };
  }, [riscosAtivos]);

  // Se estiver mostrando a TAP, renderiza ela
  if (showTAP.open && showTAP.projeto) {
    return (
      <TAPPage
        projeto={showTAP.projeto}
        risco={showTAP.risco}
        empresas={base.empresas}
        colaboradores={base.colaboradores}
        onVoltar={() => {
          setShowTAP({ open: false });
          load();
        }}
        onSalvar={async (tapData) => {
          // Salvar TAP no projeto
          await fetch(`/api/projetos/${showTAP.projeto!.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tap: tapData })
          });
          load();
        }}
        onGerarPDF={async (pdfBase64, nomeArquivo) => {
          // Salvar PDF no projeto
          await fetch(`/api/projetos/${showTAP.projeto!.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              tapPdf: pdfBase64, 
              tapPdfNome: nomeArquivo,
              tapPdfData: new Date().toISOString()
            })
          });
          load();
          toast.show('PDF anexado ao projeto!', 'success');
        }}
      />
    );
  }

  return (
    <div>
      <div className="screen-header">
           <h2><i className="fa-solid fa-diagram-project"></i> Kanban de Projetos</h2>
        <div className="form-actions">
             <button className="btn-outline" onClick={()=>window.print()}><i className="fa-solid fa-file-pdf"></i> Gerar PDF do Escopo</button>
          <button className="btn-outline btn-small" onClick={()=>setHistoryOpen(true)}><i className="fa-solid fa-clock-rotate-left"></i> Histórico</button>
        </div>
      </div>

      {/* Caixa de Entrada de Riscos */}
      <div className="inbox-container">
        <div className="inbox-header" onClick={() => setInboxAberta(!inboxAberta)}>
          <div className="inbox-title">
            <i className="fa-solid fa-inbox"></i> 
            Caixa de Entrada - Riscos Ativos
            <span className="inbox-badge">{riscosAtivos.length}</span>
          </div>
          <div className="inbox-toggle">
            <i className={`fa-solid fa-chevron-${inboxAberta ? 'up' : 'down'}`}></i>
          </div>
        </div>
        
        {inboxAberta && (
          <div className="inbox-body">
            <div className="inbox-filters">
              <button 
                className={`inbox-filter-btn ${filtroInbox === 'todos' ? 'active' : ''}`}
                onClick={() => setFiltroInbox('todos')}
              >
                Todos <span className="filter-count">{riscosAtivos.length}</span>
              </button>
              <button 
                className={`inbox-filter-btn filter-alto ${filtroInbox === 'alto' ? 'active' : ''}`}
                onClick={() => setFiltroInbox('alto')}
              >
                <i className="fa-solid fa-circle-exclamation"></i> Alto <span className="filter-count">{contagem.alto}</span>
              </button>
              <button 
                className={`inbox-filter-btn filter-medio ${filtroInbox === 'medio' ? 'active' : ''}`}
                onClick={() => setFiltroInbox('medio')}
              >
                <i className="fa-solid fa-triangle-exclamation"></i> Médio <span className="filter-count">{contagem.medio}</span>
              </button>
              <button 
                className={`inbox-filter-btn filter-baixo ${filtroInbox === 'baixo' ? 'active' : ''}`}
                onClick={() => setFiltroInbox('baixo')}
              >
                <i className="fa-solid fa-circle-info"></i> Baixo <span className="filter-count">{contagem.baixo}</span>
              </button>
            </div>
            
            <div className="inbox-list">
              {riscosFiltrados.length === 0 ? (
                <div className="inbox-empty">
                  <i className="fa-solid fa-check-circle"></i>
                  <span>Nenhum risco ativo encontrado</span>
                </div>
              ) : (
                riscosFiltrados.map((risco, index) => {
                  const nivel = calcularNivelRisco(risco.probabilidade, risco.impacto);
                  const nivelColor = nivelRiscoBadge(nivel);
                  const statusColor = statusBadge(risco.status);
                  return (
                    <div 
                      key={risco.id} 
                      className={`inbox-item ${riscoSelecionado?.id === risco.id ? 'selected' : ''}`}
                      onClick={() => setRiscoSelecionado(riscoSelecionado?.id === risco.id ? null : risco)}
                    >
                      <div className="inbox-item-indicator" style={{ backgroundColor: nivelColor.fg }}></div>
                      <div className="inbox-item-content">
                        <div className="inbox-item-header">
                          <span className="inbox-item-id">{String(index + 1).padStart(3, '0')}</span>
                          <span className="inbox-item-titulo">{risco.titulo}</span>
                        </div>
                        {risco.descricao && (
                          <div className="inbox-item-descricao">{risco.descricao}</div>
                        )}
                        <div className="inbox-item-badges">
                          <span className="badge" style={badgeStyle(statusColor.bg, statusColor.fg)}>{risco.status}</span>
                          <span className="badge" style={badgeStyle(nivelColor.bg, nivelColor.fg)}>{nivel}</span>
                          {risco.dataCriacao && (
                            <span className="inbox-item-date">
                              <i className="fa-regular fa-calendar"></i> {new Date(risco.dataCriacao).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="inbox-item-actions">
                        <button 
                          className="btn-outline btn-small" 
                          title="Gerar Projeto"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await api.gerarProjeto(risco.id);
                              toast.show('Projeto gerado com sucesso!', 'success');
                              load();
                              loadRiscosAtivos();
                            } catch {
                              toast.show('Erro ao gerar projeto', 'error');
                            }
                          }}
                        >
                          <i className="fa-solid fa-plus"></i> Projeto
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Caixa de Backlog - Riscos com Projetos */}
      <div className="inbox-container backlog-box">
        <div className="inbox-header backlog-header" onClick={() => setBacklogAberta(!backlogAberta)}>
          <div className="inbox-title">
            <i className="fa-solid fa-folder-open"></i> 
            Backlog - Riscos em Projeto
            <span className="inbox-badge">{projetos.length}</span>
          </div>
          <div className="inbox-toggle">
            <i className={`fa-solid fa-chevron-${backlogAberta ? 'up' : 'down'}`}></i>
          </div>
        </div>
        
        {backlogAberta && (
          <div className="inbox-body">
            <div className="inbox-list">
              {projetos.length === 0 ? (
                <div className="inbox-empty">
                  <i className="fa-solid fa-folder"></i>
                  <span>Nenhum projeto em andamento</span>
                </div>
              ) : (
                projetos.map((proj, index) => {
                  const etapaInfo = columns.find(c => c.etapa === proj.etapa);
                  return (
                    <div key={proj.id} className="inbox-item">
                      <div className="inbox-item-indicator" style={{ backgroundColor: '#3498db' }}></div>
                      <div className="inbox-item-content">
                        <div className="inbox-item-header">
                          <span className="inbox-item-id">{String(index + 1).padStart(3, '0')}</span>
                          <span className="inbox-item-titulo">{proj.titulo}</span>
                        </div>
                        <div className="inbox-item-badges">
                          <span className="badge" style={badgeStyle('#e8f4fc', '#3498db')}>{etapaInfo?.title || proj.etapa}</span>
                          {proj.riscoId && (
                            <span className="inbox-item-date">
                              <i className="fa-solid fa-link"></i> Risco: {proj.riscoId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Caixa de Excluídos */}
      <div className="inbox-container excluidos-box">
        <div className="inbox-header excluidos-header" onClick={() => setExcluidosAberta(!excluidosAberta)}>
          <div className="inbox-title">
            <i className="fa-solid fa-trash-can"></i> 
            Excluídos
            <span className="inbox-badge">{projetosExcluidos.length}</span>
          </div>
          <div className="inbox-toggle">
            <i className={`fa-solid fa-chevron-${excluidosAberta ? 'up' : 'down'}`}></i>
          </div>
        </div>
        
        {excluidosAberta && (
          <div className="inbox-body">
            <div className="inbox-list">
              {projetosExcluidos.length === 0 ? (
                <div className="inbox-empty">
                  <i className="fa-solid fa-trash"></i>
                  <span>Nenhum projeto excluído</span>
                </div>
              ) : (
                projetosExcluidos.map((proj, index) => (
                  <div key={proj.id} className="inbox-item">
                    <div className="inbox-item-indicator" style={{ backgroundColor: '#95a5a6' }}></div>
                    <div className="inbox-item-content">
                      <div className="inbox-item-header">
                        <span className="inbox-item-id" style={{ background: '#f0f0f0', color: '#888' }}>{String(index + 1).padStart(3, '0')}</span>
                        <span className="inbox-item-titulo" style={{ color: '#888', textDecoration: 'line-through' }}>{proj.titulo}</span>
                      </div>
                      <div className="inbox-item-badges">
                        {proj.riscoId && (
                          <span className="inbox-item-date">
                            <i className="fa-solid fa-link"></i> Risco: {proj.riscoId}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="inbox-item-actions">
                      <button 
                        className="btn-outline btn-small btn-success" 
                        title="Restaurar Projeto"
                        onClick={() => restaurarProjeto(proj.id)}
                      >
                        <i className="fa-solid fa-rotate-left"></i> Restaurar
                      </button>
                      <button 
                        className="btn-outline btn-small btn-danger" 
                        title="Excluir Permanentemente"
                        onClick={() => excluirPermanente(proj.id)}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Kanban de Projetos</h2>
      </div>
          <div className="kanban-container">
            {columns.map(col => (
              <div key={col.title} className="kanban-column">
                <h3 style={{ color: 'var(--primary)' }}>{col.title}</h3>
                <div style={{ height: 2, background: '#e5e7eb', margin: '0.5rem 0 1rem' }}></div>
                {byPrazo(getProjectsForColumn(col)).length === 0 && (
                  <div className="kanban-card" style={{ color: '#777' }}>Nenhum projeto nesta etapa</div>
                )}
                {byPrazo(getProjectsForColumn(col)).map(p => (
              <div key={p.id} className="kanban-card">
                <strong>{p.titulo}</strong>
                <div style={{ marginTop: 6 }}>
                      {(() => { const etapa = col.etapa; const c = statusBadge(etapa==='Concluído'?'Encerrado': etapa==='Execução'?'Mitigando':'Aberto'); return <span className="badge" style={badgeStyle(c.bg, c.fg)}>{col.title}</span>; })()}
                </div>
                {p.riscoId && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#666' }}>Risco: {p.riscoId}</span>
                  </div>
                )}
                {(p as any).tapPdf && (
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fa-solid fa-file-pdf" style={{ color: '#dc2626' }}></i>
                    <a 
                      href={(p as any).tapPdf} 
                      download={(p as any).tapPdfFilename || 'TAP.pdf'}
                      style={{ fontSize: 12, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {(p as any).tapPdfFilename || 'TAP.pdf'}
                    </a>
                  </div>
                )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button className="btn-outline btn-small btn-danger" title="Remover do Kanban" onClick={()=>removerProjeto(p.id)}><i className="fa-solid fa-trash"></i></button>
                      <button className="btn-outline btn-small" title={p.etapa==='Backlog' ? 'Já está no Backlog' : (p as any).tapPdf ? 'TAP já foi gerada - não é possível voltar' : 'Mover para Backlog'} disabled={p.etapa==='Backlog' || !!(p as any).tapPdf} onClick={()=>updateEtapa(p.id, 'Backlog')}><i className="fa-solid fa-arrow-left"></i></button>
                      <button className="btn-outline btn-small" title="Mover para Planejamento (Gerar TAP)" disabled={p.etapa==='Planejamento' || p.etapa==='Execução' || !!(p as any).tapPdf} onClick={()=>moverParaPlanejamentoComTAP(p)}><i className="fa-solid fa-list-check"></i></button>
                      <button className="btn-outline btn-small" title="Mover para Execução" disabled={p.etapa==='Execução'} onClick={()=>iniciarFluxoExecucao(p)}><i className="fa-solid fa-person-running"></i></button>
                      <button className="btn-outline btn-small" title="Mover para Concluído" disabled={p.etapa==='Concluído'} onClick={()=>updateEtapa(p.id, 'Concluído')}><i className="fa-solid fa-flag-checkered"></i></button>
                      {(p.etapa === 'Planejamento' || (p as any).tapGerada) && (
                        <button className="btn-outline btn-small btn-tap" title="Ver/Editar TAP" onClick={()=>abrirTAP(p)}><i className="fa-solid fa-file-contract"></i></button>
                      )}
                      {p.etapa === 'Execução' && (
                        <button className="btn-outline btn-small" title="Controle de Etapas" onClick={() => setExecPageOpen({ open: true, projetoId: p.id })}><i className="fa-solid fa-tasks"></i></button>
                      )}
                      <button className="btn-outline btn-small" title="Detalhes" onClick={async()=>{ 
                        setCurr(p); 
                        setOpen(true); 
                        if (p.riscoId) {
                          const riscos = await fetch('/api/riscos').then(r=>r.json());
                          const r = riscos.find((x: any)=>x.id===p.riscoId);
                          setRiskInfo(r || null);
                        } else {
                          setRiskInfo(null);
                        }
                      }}><i className="fa-solid fa-eye"></i></button>
                    </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <Modal open={open} title={`Detalhes do Projeto`} onClose={()=>setOpen(false)}>
        {curr && (
          <div>
            <div className="form-grid">
              <div className="form-group">
                <label><i className="fa-solid fa-calendar-day"></i> Prazo</label>
                <input type="date" value={curr.prazo || ''} onChange={e => setCurr({ ...curr, prazo: e.target.value })} />
              </div>
              <div className="form-group">
                <label><i className="fa-solid fa-user-tie"></i> Responsável</label>
                <select value={curr.responsavelId || ''} onChange={e => setCurr({ ...curr, responsavelId: e.target.value })}>
                  <option value="">Selecione</option>
                  {base.colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label><i className="fa-solid fa-clipboard-list"></i> Escopo</label>
                <textarea placeholder="Defina o escopo do projeto" value={curr.escopo || ''} onChange={e => setCurr({ ...curr, escopo: e.target.value })} />
              </div>
            </div>
            <div><strong>{curr.titulo}</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div>
                    <label style={{ marginRight: 6 }}><i className="fa-solid fa-layer-group"></i> Etapa</label>
                    {(() => { const c = statusBadge(curr.etapa==='Concluído'?'Encerrado': curr.etapa==='Execução'?'Mitigando':'Aberto'); return <span style={{ marginLeft: 6, ...badgeStyle(c.bg, c.fg) }}>{curr.etapa}</span>; })()}
                  </div>
                  <select value={curr.etapa} onChange={async e=>{
                const etapa = e.target.value as Projeto['etapa'];
                setCurr({ ...curr, etapa });
                await fetch(`/api/projetos/${curr.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ etapa }) });
                toast.show('Etapa atualizada', 'success');
                load();
              }}>
                    {['Backlog','Planejamento','Execução','Concluído'].map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            
            {curr.riscoId && (
              <div style={{ marginTop: 8 }}>
                <strong>Risco Relacionado</strong>
                <div>ID: {curr.riscoId}</div>
                {riskInfo && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 12 }}>
                    {(() => { const s = statusBadge(riskInfo.status); return <span className="badge" style={badgeStyle(s.bg, s.fg)}>{riskInfo.status}</span>; })()}
                    {(() => { const p = probBadge(riskInfo.probabilidade); return <span className="badge" style={badgeStyle(p.bg, p.fg)}>{riskInfo.probabilidade}</span>; })()}
                    {(() => { const i = impactoBadge(riskInfo.impacto); return <span className="badge" style={badgeStyle(i.bg, i.fg)}>{riskInfo.impacto}</span>; })()}
                  </div>
                )}
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <strong>Histórico</strong>
              <ul>
                {(curr.historico||[]).length === 0 && <li>Nenhum evento.</li>}
                {(curr.historico||[]).map((h, i) => (
                  <li key={i}>{new Date(h.data).toLocaleString('pt-BR')} - {h.evento} ({h.autor})</li>
                ))}
              </ul>
            </div>
                <div className="form-actions" style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button className="btn-outline btn-small" onClick={() => setHistoryOpen(true)}><i className="fa-solid fa-clock-rotate-left"></i> Histórico</button>
                  <button className="btn-outline btn-small" onClick={() => window.print()}><i className="fa-solid fa-file-pdf"></i> Gerar PDF</button>
                  <button className="btn-primary btn-small" onClick={async () => {
                if (!curr) return;
                const payload = {
                  prazo: curr.prazo,
                  responsavelId: curr.responsavelId,
                  escopo: curr.escopo,
                };
                const res = await fetch(`/api/projetos/${curr.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (res.ok) { toast.show('Alterações salvas', 'success'); load(); }
              }}><i className="fa-solid fa-floppy-disk"></i> Salvar</button> 
            </div>
          </div>
        )}
      </Modal>
      <Modal open={historyOpen} title={`Histórico do Projeto`} onClose={()=>setHistoryOpen(false)}>
        {curr && (
          <div>
            <div><strong>{curr.titulo || curr.id}</strong></div>
            <ul>
              {(curr.historico||[]).length === 0 && <li>Nenhum evento registrado.</li>}
              {(curr.historico||[]).map((h, idx) => (
                <li key={idx}>
                  <span>{new Date(h.data).toLocaleString('pt-BR')} - </span>
                  <span>{h.evento}</span>
                  <span> ({h.autor})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {/* Modal Confirmação TAP */}
      <Modal open={showTAPConfirm.open} title="Gerar TAP - Termo de Abertura de Projeto" onClose={() => setShowTAPConfirm({ open: false })}>
        <div className="tap-confirm-modal">
          <div className="tap-confirm-icon">
            <i className="fa-solid fa-file-contract"></i>
          </div>
          <p className="tap-confirm-text">
            Ao mover o projeto para <strong>Planejamento</strong>, será gerada automaticamente uma <strong>TAP (Termo de Abertura de Projeto)</strong>.
          </p>
          <p className="tap-confirm-subtext">
            A TAP conterá as informações do risco associado e você poderá completar o preenchimento na próxima tela.
          </p>
          <div className="tap-confirm-actions">
            <button className="btn btn-secondary" onClick={() => setShowTAPConfirm({ open: false })}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={confirmarGerarTAP}>
              <i className="fa-solid fa-check"></i> Gerar TAP e Continuar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmação Execução (pergunta se deseja adicionar etapas) */}
      <Modal open={showExecConfirm.open} title="Mover para Execução" onClose={() => setShowExecConfirm({ open: false })}>
        <div style={{ padding: 12 }}>
          <p>Para ir para <strong>Execução</strong> é obrigatório informar as etapas que serão acompanhadas. Deseja continuar?</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button className="btn btn-secondary" onClick={() => setShowExecConfirm({ open: false })}>Cancelar</button>
            <button className="btn btn-primary" onClick={abrirModalEtapas}><i className="fa-solid fa-check"></i> Sim</button>
          </div>
        </div>
      </Modal>

      {/* Modal de Cadastro de Etapas (overlay acima da página principal) */}
      <Modal open={execModal.open} title={execModal.projeto ? `Etapas - ${execModal.projeto.titulo}` : 'Etapas'} onClose={() => setExecModal({ open: false, etapas: [] })}>
        <div style={{ padding: 8 }}>
          <p style={{ marginBottom: 8 }}>Adicione as etapas que serão acompanhadas no projeto. Ao finalizar, clique em <strong>Gravar</strong> para mover o projeto para Execução.</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input id="nova-etapa-input" type="text" placeholder="Nome da etapa" className="form-control" style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={() => { const el = document.getElementById('nova-etapa-input') as HTMLInputElement; if (el) { adicionarEtapaTemp(el.value.trim()); el.value = ''; } }}><i className="fa-solid fa-plus"></i> Adicionar</button>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 8 }}>
            {execModal.etapas.length === 0 ? (
              <div style={{ color: '#666', padding: 12 }}>Nenhuma etapa adicionada.</div>
            ) : (
              <div>
                {execModal.etapas.map((et, idx) => (
                  <div key={idx} style={{ border: '1px solid #eee', padding: 8, borderRadius: 6, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <strong>{et.name}</strong>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input id={`nova-tarefa-${idx}`} type="text" placeholder="Nova tarefa" className="form-control" style={{ width: 220 }} />
                        <button className="btn btn-primary btn-small" onClick={() => { const el = document.getElementById(`nova-tarefa-${idx}`) as HTMLInputElement; if (el) { adicionarTarefaTemp(idx, el.value.trim()); el.value = ''; } }}><i className="fa-solid fa-plus"></i></button>
                        <button className="btn-outline btn-small" onClick={() => removerEtapaTemp(idx)} title="Remover etapa"><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </div>
                    <div style={{ marginLeft: 4 }}>
                      {et.tasks.length === 0 ? (
                        <div style={{ color: '#888', fontSize: 13 }}>Nenhuma tarefa nesta etapa.</div>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {et.tasks.map((t, ti) => (
                            <li key={ti} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input type="checkbox" checked={!!t.completed} readOnly />
                                <span>{t.title}</span>
                              </span>
                              <button className="btn-outline btn-small" onClick={() => removerTarefaTemp(idx, ti)} title="Remover tarefa"><i className="fa-solid fa-trash"></i></button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setExecModal({ open: false, etapas: [] })}>Cancelar</button>
            <button className="btn btn-primary" onClick={salvarEtapasEExecutar}><i className="fa-solid fa-floppy-disk"></i> Gravar</button>
          </div>
        </div>
      </Modal>
      {/* Modal da página de Controle de Etapas */}
      <Modal open={execPageOpen.open} title="Controle de Etapas" onClose={() => setExecPageOpen({ open: false })}>
        {execPageOpen.projetoId && (
          <ExecucaoPage projetoId={execPageOpen.projetoId} onClose={() => setExecPageOpen({ open: false })} onSaved={() => { load(); }} />
        )}
      </Modal>
    </div>
  );
};
