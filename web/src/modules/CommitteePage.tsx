import React, { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import { api } from '../services/api';
import { badgeStyle, statusBadge, probBadge, impactoBadge } from '../utils/badges';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';

type RiscoRow = {
  id: string;
  titulo: string;
  descricao?: string;
  empresaId?: string;
  responsavelId?: string;
  analistaId?: string;
  status: 'Aberto'|'Em Andamento'|'Mitigando'|'Encerrado';
  probabilidade: string;
  impacto: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
};

type Filters = {
  id: string;
  status: string;
  nivelRisco: string;
  empresa: string;
  responsavel: string;
  search: string;
};

// Função para extrair o número do nível (1-5) do texto como "3-Média"
const parseNivelNum = (txt?: string) => {
  if (!txt) return 3;
  const m = txt.match(/^([1-5])/);
  return m ? parseInt(m[1], 10) : 3;
};

// Função para calcular o nível de risco baseado em probabilidade e impacto
const calcularNivelRisco = (probabilidade: string, impacto: string): 'Baixo'|'Médio'|'Alto' => {
  const p = parseNivelNum(probabilidade);
  const i = parseNivelNum(impacto);
  const score = p + i; // 2..10
  if (score >= 8) return 'Alto';
  if (score >= 5) return 'Médio';
  return 'Baixo';
};

const nivelRiscoBadge = (nivel: 'Baixo'|'Médio'|'Alto') => {
  if (nivel === 'Alto') return { bg: '#fde2e2', fg: '#c0392b' };
  if (nivel === 'Médio') return { bg: '#fff3cd', fg: '#b7791f' };
  return { bg: '#e2f7e2', fg: '#2e7d32' };
};

export const CommitteePage: React.FC = () => {
  const [riscos, setRiscos] = useState<RiscoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState<{ id: string; nome: string }[]>([]);
  const [colaboradores, setColaboradores] = useState<{ id: string; nome: string }[]>([]);
  const [stakeholdersGrupos, setStakeholdersGrupos] = useState<{ id: string; nome: string; emails: string[] }[]>([]);
  const [stakeholdersPessoas, setStakeholdersPessoas] = useState<{ id: string; nome: string; setor?: string; email?: string; telefone?: string }[]>([]);
  const toast = useToast();
  const [showNovaOcorrencia, setShowNovaOcorrencia] = useState<{open: boolean; riscoId?: string}>({open: false});
  const [showHistorico, setShowHistorico] = useState<{open: boolean; riscoId?: string; data?: any}>({open: false});
  const [showStatusModal, setShowStatusModal] = useState<{open: boolean; riscoId?: string; currentStatus?: string}>({open: false});
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Filtros
  const [filters, setFilters] = useState<Filters>({
    id: '',
    status: '',
    nivelRisco: '',
    empresa: '',
    responsavel: '',
    search: ''
  });

  const load = async () => {
    setLoading(true);
    try { const list = await api.riscos(); setRiscos(list); }
    finally { setLoading(false); }
  };
  useEffect(() => { 
    load(); 
    api.empresas().then(setEmpresas).catch(()=>[]);
    api.colaboradores().then(setColaboradores).catch(()=>[]);
    api.stakeholders().then(setStakeholdersGrupos).catch(()=>{}); 
    api.stakeholdersPessoas().then(setStakeholdersPessoas).catch(()=>{}); 
  }, []);

  // Funções para obter nome por ID
  const getEmpresaNome = (empresaId?: string) => {
    if (!empresaId) return '-';
    const emp = empresas.find(e => e.id === empresaId);
    return emp?.nome || '-';
  };

  const getResponsavelNome = (responsavelId?: string, analistaId?: string) => {
    const id = responsavelId || analistaId;
    if (!id) return '-';
    const col = colaboradores.find(c => c.id === id);
    return col?.nome || '-';
  };

  // Filtrar riscos
  const filteredRiscos = useMemo(() => {
    return riscos.filter(r => {
      if (filters.id && !r.id.toLowerCase().includes(filters.id.toLowerCase())) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.nivelRisco) {
        const nivel = calcularNivelRisco(r.probabilidade, r.impacto);
        if (nivel !== filters.nivelRisco) return false;
      }
      if (filters.empresa && r.empresaId !== filters.empresa) return false;
      if (filters.responsavel) {
        const respId = r.responsavelId || r.analistaId;
        if (respId !== filters.responsavel) return false;
      }
      if (filters.search) {
        const nivel = calcularNivelRisco(r.probabilidade, r.impacto);
        const empresaNome = getEmpresaNome(r.empresaId);
        const responsavelNome = getResponsavelNome(r.responsavelId, r.analistaId);
        const searchText = `${r.id} ${r.titulo} ${r.descricao || ''} ${empresaNome} ${responsavelNome} ${r.status} ${nivel}`.toLowerCase();
        if (!searchText.includes(filters.search.toLowerCase())) return false;
      }
      return true;
    });
  }, [riscos, filters, empresas, colaboradores]);

  const clearFilters = () => {
    setFilters({ id: '', status: '', nivelRisco: '', empresa: '', responsavel: '', search: '' });
  };

  const updateStatus = async (id: string, status: RiscoRow['status']) => {
    try { await api.updateRisco(id, { status }); toast.show('Situação atualizada', 'success'); load(); }
    catch { toast.show('Erro ao atualizar', 'error'); }
  };

  const gerarProjeto = async (id: string) => {
    try {
      const proj = await api.gerarProjeto(id);
      toast.show(`Projeto ${proj.id} gerado`, 'success');
    } catch {
      toast.show('Erro ao gerar projeto', 'error');
    }
  };

  const abrirNovaOcorrencia = (id: string) => setShowNovaOcorrencia({ open: true, riscoId: id });
  const abrirHistorico = async (id: string) => {
    try {
      const detalhe = await api.risco(id);
      setShowHistorico({ open: true, riscoId: id, data: detalhe });
    } catch {
      toast.show('Erro ao carregar histórico', 'error');
    }
  };

  const openStatusModal = (id: string, currentStatus: string) => {
    setShowStatusModal({ open: true, riscoId: id, currentStatus });
    setSelectedStatus(currentStatus);
  };

  const confirmStatusChange = async () => {
    if (showStatusModal.riscoId && selectedStatus) {
      await updateStatus(showStatusModal.riscoId, selectedStatus as RiscoRow['status']);
      setShowStatusModal({ open: false });
    }
  };

  return (
    <div className="committee-container">
      {/* Filtros */}
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="filter-id">ID do Risco</label>
          <input 
            type="text" 
            id="filter-id" 
            className="filter-input" 
            placeholder="Ex: RSK001"
            value={filters.id}
            onChange={e => setFilters(f => ({ ...f, id: e.target.value }))}
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="filter-status">Status</label>
          <select 
            id="filter-status" 
            className="filter-select"
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">Todos os Status</option>
            <option value="Aberto">Aberto</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Mitigando">Mitigando</option>
            <option value="Encerrado">Encerrado</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="filter-nivel">Nível de Risco</label>
          <select 
            id="filter-nivel" 
            className="filter-select"
            value={filters.nivelRisco}
            onChange={e => setFilters(f => ({ ...f, nivelRisco: e.target.value }))}
          >
            <option value="">Todos os Níveis</option>
            <option value="Alto">Alto</option>
            <option value="Médio">Médio</option>
            <option value="Baixo">Baixo</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="filter-empresa">Empresa</label>
          <select 
            id="filter-empresa" 
            className="filter-select"
            value={filters.empresa}
            onChange={e => setFilters(f => ({ ...f, empresa: e.target.value }))}
          >
            <option value="">Todas as Empresas</option>
            {empresas.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.nome}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="filter-responsavel">Responsável</label>
          <select 
            id="filter-responsavel" 
            className="filter-select"
            value={filters.responsavel}
            onChange={e => setFilters(f => ({ ...f, responsavel: e.target.value }))}
          >
            <option value="">Todos os Responsáveis</option>
            {colaboradores.map(col => (
              <option key={col.id} value={col.id}>{col.nome}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-actions">
          <button className="btn btn-secondary" onClick={clearFilters}>
            <i className="fa-solid fa-eraser"></i> Limpar Filtros
          </button>
          <button className="btn btn-primary" onClick={load} disabled={loading}>
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-rotate"></i>} Atualizar
          </button>
        </div>
      </div>

      {/* Grid de Dados */}
      <div className="grid-container">
        <div className="grid-header">
          <div className="grid-title">
            <i className="fa-solid fa-list"></i> Riscos Registrados
          </div>
          <div className="grid-actions">
            <input 
              type="text" 
              className="search-box" 
              placeholder="Buscar em todos os campos..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-grid">
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Empresa</th>
                <th>Responsável</th>
                <th>Nível de Risco</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiscos.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.id}</strong></td>
                  <td>{r.titulo}</td>
                  <td>{getEmpresaNome(r.empresaId)}</td>
                  <td>{getResponsavelNome(r.responsavelId, r.analistaId)}</td>
                  <td>
                    {(() => { 
                      const nivel = calcularNivelRisco(r.probabilidade, r.impacto);
                      const c = nivelRiscoBadge(nivel); 
                      return <span className={`risk-badge risk-${nivel.toLowerCase()}`} style={badgeStyle(c.bg, c.fg)}>{nivel}</span>; 
                    })()}
                  </td>
                  <td>
                    <div className="status-cell">
                      {(() => { 
                        const c = statusBadge(r.status); 
                        return (
                          <span 
                            className={`status-badge status-${r.status.toLowerCase().replace('í', 'i')}`} 
                            style={badgeStyle(c.bg, c.fg)}
                            onClick={() => openStatusModal(r.id, r.status)}
                          >
                            {r.status}
                          </span>
                        ); 
                      })()}
                      <button className="btn-change-status" onClick={() => openStatusModal(r.id, r.status)}>
                        Alterar Status
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="action-icons">
                      <button className="icon-btn btn-comment" title="Informar Ocorrência" onClick={() => abrirNovaOcorrencia(r.id)}>
                        <i className="fa-solid fa-bullhorn"></i>
                      </button>
                      <button className="icon-btn btn-view" title="Histórico de Ocorrência" onClick={() => abrirHistorico(r.id)}>
                        <i className="fa-solid fa-clock-rotate-left"></i>
                      </button>
                      <button className="icon-btn btn-edit" title="Converter em Projeto" onClick={() => gerarProjeto(r.id)}>
                        <i className="fa-solid fa-diagram-project"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <div className="pagination-info">
            Mostrando {filteredRiscos.length} de {riscos.length} registros
          </div>
        </div>
      </div>

      {/* Modal: Alterar Status */}
      <Modal open={showStatusModal.open} onClose={() => setShowStatusModal({ open: false })} title="Alterar Status do Risco">
        <div className="status-modal-body">
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Selecione o novo status para o risco:
          </p>
          <div className="status-options">
            <div 
              className={`status-option ${selectedStatus === 'Aberto' ? 'selected' : ''}`}
              onClick={() => setSelectedStatus('Aberto')}
            >
              <div className="status-badge status-aberto" style={{ background: '#e8f4fc', color: '#3498db', border: 'none' }}>
                Aberto
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Risco identificado, aguardando ação</p>
            </div>
            <div 
              className={`status-option ${selectedStatus === 'Em Andamento' ? 'selected' : ''}`}
              onClick={() => setSelectedStatus('Em Andamento')}
            >
              <div className="status-badge status-em-andamento" style={{ background: '#e3f2fd', color: '#1976d2', border: 'none' }}>
                Em Andamento
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Análise ou tratamento em progresso</p>
            </div>
            <div 
              className={`status-option ${selectedStatus === 'Mitigando' ? 'selected' : ''}`}
              onClick={() => setSelectedStatus('Mitigando')}
            >
              <div className="status-badge status-mitigando" style={{ background: '#fef5e7', color: '#f39c12', border: 'none' }}>
                Mitigando
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Ações de mitigação em execução</p>
            </div>
            <div 
              className={`status-option ${selectedStatus === 'Encerrado' ? 'selected' : ''}`}
              onClick={() => setSelectedStatus('Encerrado')}
            >
              <div className="status-badge status-encerrado" style={{ background: '#d5f4e6', color: '#27ae60', border: 'none' }}>
                Encerrado
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Risco resolvido ou aceito</p>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: '20px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowStatusModal({ open: false })}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={confirmStatusChange}>
              Confirmar Alteração
            </button>
          </div>
        </div>
      </Modal>
      {/* Modal: Nova Ocorrência */}
      <Modal open={showNovaOcorrencia.open} onClose={()=>setShowNovaOcorrencia({ open: false })} title="Informar Ocorrência">
        {showNovaOcorrencia.open && (
          <NovaOcorrenciaForm
            grupos={stakeholdersGrupos}
            pessoas={stakeholdersPessoas}
            onSubmit={async (payload) => {
              try {
                await api.informarOcorrencia(showNovaOcorrencia.riscoId!, payload);
                toast.show('Ocorrência registrada', 'success');
                setShowNovaOcorrencia({ open: false });
              } catch {
                toast.show('Erro ao registrar ocorrência', 'error');
              }
            }}
          />
        )}
      </Modal>

      {/* Modal: Histórico */}
      <Modal open={showHistorico.open} onClose={()=>setShowHistorico({ open: false })} title="Histórico de Ocorrências">
        {showHistorico.open && showHistorico.data ? (
          <HistoricoView data={showHistorico.data} />
        ) : (
          <div>Carregando...</div>
        )}
      </Modal>
    </div>
  );
};

const NovaOcorrenciaForm: React.FC<{ grupos: { id: string; nome: string; emails: string[] }[]; pessoas: { id: string; nome: string; setor?: string; email?: string; telefone?: string }[]; onSubmit: (data: { data?: string; impedimento: string; acoes: string; responsavel: string; stakeholdersGruposIds?: string[]; stakeholdersIds?: string[] }) => void }>
 = ({ grupos, pessoas, onSubmit }) => {
  const defaultDate = new Date().toISOString().slice(0,16);
  const [data, setData] = useState<string>(defaultDate);
  const [impedimento, setImpedimento] = useState('');
  const [acoes, setAcoes] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [selecionadosPessoas, setSelecionadosPessoas] = useState<string[]>([]);
  return (
    <form onSubmit={e=>{ e.preventDefault(); onSubmit({ data, impedimento, acoes, responsavel, stakeholdersGruposIds: selecionados, stakeholdersIds: selecionadosPessoas }); }} className="form-grid">
      <label>Data da ocorrência
        <input type="datetime-local" value={data} onChange={e=>setData(e.target.value)} />
      </label>
      <label>Impedimento
        <textarea rows={3} value={impedimento} onChange={e=>setImpedimento(e.target.value)}></textarea>
      </label>
      <label>Ações
        <textarea rows={3} value={acoes} onChange={e=>setAcoes(e.target.value)}></textarea>
      </label>
      <label>Responsável
        <input type="text" value={responsavel} onChange={e=>setResponsavel(e.target.value)} />
      </label>
      <div>
        <strong>Stakeholders (grupos)</strong>
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          {grupos.map(g=> (
            <label key={g.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="checkbox" checked={selecionados.includes(g.id)} onChange={e=>{
                setSelecionados(s=> e.target.checked ? [...s, g.id] : s.filter(x=>x!==g.id));
              }} />
              <span>{g.nome} — {g.emails.join(', ')}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <strong>Stakeholders (pessoas)</strong>
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          {pessoas.map(p=> (
            <label key={p.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="checkbox" checked={selecionadosPessoas.includes(p.id)} onChange={e=>{
                setSelecionadosPessoas(s=> e.target.checked ? [...s, p.id] : s.filter(x=>x!==p.id));
              }} />
              <span>{p.nome}{p.setor? ' — '+p.setor: ''} {p.email? ' — '+p.email: ''} {p.telefone? ' — '+p.telefone: ''}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="form-actions">
        <button className="btn" type="submit"><i className="fa-solid fa-floppy-disk"></i> Salvar</button>
      </div>
    </form>
  );
};

const HistoricoView: React.FC<{ data: any }> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inicio, setInicio] = useState<string>('');
  const [fim, setFim] = useState<string>('');
  const [resp, setResp] = useState<string>('');
  const [ordem, setOrdem] = useState<'asc'|'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const listFull = useMemo(() => (data?.historico || []) as { data: string; evento: string; autor: string }[], [data]);
  const list = useMemo(() => {
    const filtrada = listFull.filter(h => {
      const d = new Date(h.data).getTime();
      const okInicio = inicio ? d >= new Date(inicio).getTime() : true;
      const okFim = fim ? d <= new Date(fim).getTime() : true;
      const okResp = resp ? (h.autor||'').toLowerCase().includes(resp.toLowerCase()) : true;
      return okInicio && okFim && okResp;
    });
    const ordenada = filtrada.sort((a,b)=>{
      const da = new Date(a.data).getTime();
      const db = new Date(b.data).getTime();
      return ordem==='asc' ? da - db : db - da;
    });
    return ordenada;
  }, [listFull, inicio, fim, resp, ordem]);

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const view = useMemo(() => {
    const start = (page - 1) * perPage;
    return list.slice(start, start + perPage);
  }, [list, page, perPage]);
  const imprimir = () => {
    window.print();
  };
  const salvarPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Histórico do Risco: ${data?.titulo || ''}`, margin, y);
    y += 24;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    list.forEach((h, idx) => {
      const line = `${new Date(h.data).toLocaleString()} — ${h.evento} (por: ${h.autor})`;
      const split = doc.splitTextToSize(line, 540);
      split.forEach((l: string) => {
        if (y > 780) { doc.addPage(); y = margin; }
        doc.text(l, margin, y);
        y += 16;
      });
      y += 8;
    });
    doc.save(`historico_${data?.id || 'risco'}.pdf`);
  };
  return (
    <div>
      <div className="form-grid" style={{ marginBottom: '0.75rem' }}>
        <label>Início
          <input type="datetime-local" value={inicio} onChange={e=>setInicio(e.target.value)} />
        </label>
        <label>Fim
          <input type="datetime-local" value={fim} onChange={e=>setFim(e.target.value)} />
        </label>
        <label>Responsável
          <input type="text" placeholder="Filtrar por responsável" value={resp} onChange={e=>setResp(e.target.value)} />
        </label>
        <label>Ordenar por data
          <select value={ordem} onChange={e=>setOrdem(e.target.value as any)}>
            <option value="asc">Mais antigo → mais recente</option>
            <option value="desc">Mais recente → mais antigo</option>
          </select>
        </label>
        <label>Tamanho da página
          <select value={perPage} onChange={e=>{ setPerPage(Number(e.target.value)); setPage(1); }}>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
      </div>
      <div className="form-actions" style={{ justifyContent: 'space-between', gap: '0.5rem' }}>
        <div>
          <button className="btn-outline" onClick={()=>{ setInicio(''); setFim(''); setResp(''); setOrdem('asc'); }}>
            <i className="fa-solid fa-eraser"></i> Limpar filtros
          </button>
        </div>
        <button className="btn-outline" onClick={imprimir}><i className="fa-solid fa-print"></i> Imprimir</button>
        <button className="btn" onClick={salvarPdf}><i className="fa-solid fa-file-pdf"></i> Salvar PDF</button>
      </div>
      <div className="form-actions" style={{ justifyContent: 'space-between', gap: '0.5rem' }}>
        <div>
          <span>Total: {total} itens — Página {page}/{totalPages}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-outline" onClick={()=>setPage(1)} disabled={page===1}>
            « Primeiro
          </button>
          <button className="btn-outline" onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={page===1}>
            ‹ Anterior
          </button>
          <button className="btn-outline" onClick={()=>setPage(p=>Math.min(totalPages, p+1))} disabled={page===totalPages}>
            Próximo ›
          </button>
          <button className="btn-outline" onClick={()=>setPage(totalPages)} disabled={page===totalPages}>
            Último »
          </button>
        </div>
      </div>
      <div ref={ref}>
        <h3>{data?.titulo}</h3>
        <ul>
          {view.map((h, i) => (
            <li key={i}>
              <strong>{new Date(h.data).toLocaleString()}</strong> — {h.evento} (por: {h.autor})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
