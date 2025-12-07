import React, { useState, useRef, useMemo } from 'react';
import jsPDF from 'jspdf';

export type NovaOcorrenciaFormProps = {
  grupos: { id: string; nome: string; emails: string[] }[];
  pessoas: { id: string; nome: string; setor?: string; email?: string; telefone?: string }[];
  onSubmit: (data: { data?: string; impedimento: string; acoes: string; responsavel: string; stakeholdersGruposIds?: string[]; stakeholdersIds?: string[] }) => void;
};

export const NovaOcorrenciaForm: React.FC<NovaOcorrenciaFormProps> = ({ grupos, pessoas, onSubmit }) => {
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

export const HistoricoView: React.FC<{ data: any }> = ({ data }) => {
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
