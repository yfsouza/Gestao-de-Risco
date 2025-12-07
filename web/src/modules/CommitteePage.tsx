import React, { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import { api } from '../services/api';
import { badgeStyle, statusBadge, probBadge, impactoBadge } from '../utils/badges';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';

type RiscoRow = {
  id: string;
  titulo: string;
  status: 'Aberto'|'Mitigando'|'Encerrado';
  probabilidade: 'Baixa'|'Média'|'Alta';
  impacto: 'Baixo'|'Médio'|'Alto';
};

export const CommitteePage: React.FC = () => {
  const [riscos, setRiscos] = useState<RiscoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [stakeholdersGrupos, setStakeholdersGrupos] = useState<{ id: string; nome: string; emails: string[] }[]>([]);
  const [stakeholdersPessoas, setStakeholdersPessoas] = useState<{ id: string; nome: string; setor?: string; email?: string; telefone?: string }[]>([]);
  const toast = useToast();
  const [showNovaOcorrencia, setShowNovaOcorrencia] = useState<{open: boolean; riscoId?: string}>({open: false});
  const [showHistorico, setShowHistorico] = useState<{open: boolean; riscoId?: string; data?: any}>({open: false});

  const load = async () => {
    setLoading(true);
    try { const list = await api.riscos(); setRiscos(list); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); api.stakeholders().then(setStakeholdersGrupos).catch(()=>{}); api.stakeholdersPessoas().then(setStakeholdersPessoas).catch(()=>{}); }, []);

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

  return (
    <div>
      <div className="screen-header">
        <h2><i className="fa-solid fa-users"></i> Comitê</h2>
        <div className="form-actions">
          {loading ? <span><i className="fa-solid fa-spinner fa-spin"></i> Carregando...</span> : <button className="btn-outline" onClick={load}><i className="fa-solid fa-rotate"></i> Atualizar</button>}
        </div>
      </div>
      <div className="card">
        <h2>Painel do Comitê de Riscos</h2>
        {loading && <div>Carregando...</div>}
      </div>
      <div className="table-responsive">
      <table className="app-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Status</th>
            <th>Probabilidade</th>
            <th>Impacto</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {riscos.map(r => (
            <tr key={r.id}>
              <td>{r.titulo}</td>
              <td>{(() => { const c = statusBadge(r.status); return <span className="badge" style={badgeStyle(c.bg, c.fg)}>{r.status}</span>; })()}</td>
              <td>{(() => { const c = probBadge(r.probabilidade); return <span className="badge" style={badgeStyle(c.bg, c.fg)}>{r.probabilidade}</span>; })()}</td>
              <td>{(() => { const c = impactoBadge(r.impacto); return <span className="badge" style={badgeStyle(c.bg, c.fg)}>{r.impacto}</span>; })()}</td>
              <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn" onClick={()=>abrirNovaOcorrencia(r.id)}>
                  <i className="fa-solid fa-bullhorn"></i> Informar Ocorrência
                </button>
                <button className="btn-outline" onClick={()=>abrirHistorico(r.id)}>
                  <i className="fa-solid fa-clock-rotate-left"></i> Histórico de Ocorrência
                </button>
                <button className="btn" onClick={()=>gerarProjeto(r.id)} title="Converter em projeto">
                  <i className="fa-solid fa-diagram-project"></i> Converter
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
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
  const [ordem, setOrdem] = useState<'asc'|'desc'>('asc');
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
