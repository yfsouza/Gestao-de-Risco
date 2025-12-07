import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Risco } from './App';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { statusBadge, probBadge, impactoBadge, badgeStyle } from '../utils/badges';
import { api } from '../services/api';

export const RisksPage: React.FC<{ base: AppState }> = ({ base }) => {
  const [riscos, setRiscos] = useState<Risco[]>([]);
  const [form, setForm] = useState<Partial<Risco>>({ probabilidade: '3-M├®dia', impacto: '3-M├®dio', status: 'Aberto' });
  const [busca, setBusca] = useState('');
  const [fEmpresa, setFEmpresa] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fMatriz, setFMatriz] = useState('');
  const [sort, setSort] = useState<{ col: 'titulo'|'status'|'empresa'|'probabilidade'|'impacto'|'matriz'; dir: 'asc'|'desc' }|null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRisk, setHistoryRisk] = useState<Risco | null>(null);
  const toast = useToast();

  const load = () => api.riscos().then(setRiscos).catch(()=>setRiscos([]));
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nivel = nivelFrom(form.probabilidade as string, form.impacto as string);
      const payload = { ...form, matriz: nivel } as Partial<Risco>;
      await api.addRisco(payload);
      toast.show('Risco salvo com sucesso', 'success');
      setForm({ probabilidade: '3-M├®dia', impacto: '3-M├®dio', status: 'Aberto' });
      load();
    } catch { toast.show('Erro ao salvar risco', 'error'); }
  };

  const gerarProjeto = async (id: string) => {
    try { await api.gerarProjeto(id); toast.show('Projeto gerado a partir do risco', 'success'); load(); }
    catch { toast.show('Erro ao gerar projeto', 'error'); }
  };

  const openHistory = (risk: Risco) => { setHistoryRisk(risk); setHistoryOpen(true); };

  const parseNivelNum = (txt?: string) => {
    if (!txt) return 3;
    const m = txt.match(/^([1-5])/);
    return m ? parseInt(m[1], 10) : 3;
  };
  const nivelFrom = (prob: string|undefined, imp: string|undefined): 'Baixo'|'M├®dio'|'Alto' => {
    const p = parseNivelNum(prob);
    const i = parseNivelNum(imp);
    const score = p + i; // 2..10
    if (score >= 8) return 'Alto';
    if (score >= 5) return 'M├®dio';
    return 'Baixo';
  };
  const probImpactBadge = (val: string|undefined) => {
    const n = parseNivelNum(val);
    if (n >= 4) return { bg: '#fde2e2', fg: '#c0392b' }; // alto
    if (n === 3) return { bg: '#fff3cd', fg: '#b7791f' }; // m├®dio
    return { bg: '#e2f7e2', fg: '#2e7d32' }; // baixo
  };
  const nivelBadge = (nivel: 'Baixo'|'M├®dio'|'Alto') => {
    if (nivel==='Alto') return { bg: '#fde2e2', fg: '#c0392b' };
    if (nivel==='M├®dio') return { bg: '#fff3cd', fg: '#b7791f' };
    return { bg: '#e2f7e2', fg: '#2e7d32' };
  };
  const matrizes = useMemo(() => Array.from(new Set(riscos.map(r=>nivelFrom(r.probabilidade, r.impacto)).filter(Boolean))), [riscos]);
  const filtered = riscos
    .filter(r => !busca || (r.titulo + ' ' + (r.descricao||'')).toLowerCase().includes(busca.toLowerCase()))
    .filter(r => !fEmpresa || r.empresaId === fEmpresa)
    .filter(r => !fStatus || r.status === fStatus)
    .filter(r => !fMatriz || r.matriz === fMatriz)
    .sort((a,b) => {
      if (!sort) return 0;
      const va = sort.col === 'empresa' ? (base.empresas.find(e=>e.id===a.empresaId)?.nome||'') : (a as any)[sort.col];
      const vb = sort.col === 'empresa' ? (base.empresas.find(e=>e.id===b.empresaId)?.nome||'') : (b as any)[sort.col];
      return sort.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  return (
    <div>
      <div className="screen-header">
        <h2><i className="fa-solid fa-triangle-exclamation"></i> Riscos</h2>
        <div className="form-actions">
          <button className="btn-outline" onClick={()=>{ setBusca(''); setFEmpresa(''); setFStatus(''); setFMatriz(''); setSort(null); }}><i className="fa-solid fa-broom"></i> Limpar filtros</button>
        </div>
      </div>

      <div className="card">
        <div className="screen-header">
          <h2><i className="fa-solid fa-file-circle-plus"></i> Cadastro de Risco</h2>
          <div className="form-actions">
            <button className="btn-outline" type="button" onClick={()=>setForm({ probabilidade: 'M├®dia', impacto: 'M├®dio', status: 'Aberto', matriz: 'Default' })}><i className="fa-solid fa-eraser"></i> Limpar formul├írio</button>
          </div>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="required">Empresa</label>
              <select value={form.empresaId||''} onChange={e=>setForm(f=>({ ...f, empresaId: e.target.value }))} required>
                <option value="">Selecione uma empresa</option>
                {base.empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="required">Analista Respons├ível</label>
              <select value={(form as any).responsavelId||''} onChange={e=>setForm(f=>({ ...f, responsavelId: e.target.value } as any))} required>
                <option value="">Selecione um analista</option>
                {base.colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="required">T├¡tulo do Risco</label>
              <input placeholder="Descreva o risco brevemente" value={form.titulo||''} onChange={e=>setForm(f=>({ ...f, titulo: e.target.value }))} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="required">Descri├º├úo</label>
              <textarea placeholder="Descreva o risco em detalhes" value={form.descricao||''} onChange={e=>setForm(f=>({ ...f, descricao: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Probabilidade</label>
              <select value={form.probabilidade||'3-M├®dia'} onChange={e=>setForm(f=>({ ...f, probabilidade: e.target.value as any }))}>
                <option>5-Muito Alta</option>
                <option>4-Alta</option>
                <option>3-M├®dia</option>
                <option>2-Baixa</option>
                <option>1-Muito baixa</option>
              </select>
            </div>
            <div className="form-group">
              <label>Impacto</label>
              <select value={form.impacto||'3-M├®dio'} onChange={e=>setForm(f=>({ ...f, impacto: e.target.value as any }))}>
                <option>5-Muito Alto</option>
                <option>4-Alto</option>
                <option>3-M├®dio</option>
                <option>2-Baixo</option>
                <option>1-Muito baixo</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status||'Aberto'} onChange={e=>setForm(f=>({ ...f, status: e.target.value as any }))}>
                <option>Aberto</option><option>Mitigando</option><option>Encerrado</option>
              </select>
            </div>
            <div className="form-group">
              <label>N├¡vel de risco (Probabilidade x Impacto)</label>
              {(() => { const nivel = nivelFrom(form.probabilidade as string, form.impacto as string); const c = nivelBadge(nivel); return <span className="badge" style={badgeStyle(c.bg, c.fg)}>{nivel}</span>; })()}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" type="submit"><i className="fa-solid fa-floppy-disk"></i> Salvar Risco</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="filters">
          <div className="search-box" style={{ flex: 1 }}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input placeholder="Buscar por t├¡tulo/descri├º├úo" value={busca} onChange={e=>setBusca(e.target.value)} />
          </div>
          <div>
            <select value={fEmpresa} onChange={e=>setFEmpresa(e.target.value)}>
              <option value="">Todas as empresas</option>
              {base.empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
            </select>
          </div>
          <div>
            <select value={fStatus} onChange={e=>setFStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option>Aberto</option><option>Mitigando</option><option>Encerrado</option>
            </select>
          </div>
          <div>
            <select value={fMatriz} onChange={e=>setFMatriz(e.target.value)}>
              <option value="">Todos os n├¡veis</option>
              {matrizes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button className="btn-outline" onClick={()=>{ setBusca(''); setFEmpresa(''); setFStatus(''); setFMatriz(''); setSort(null); }}>Limpar filtros</button>
        </div>
        <div className="table-responsive">
          <table id="risksTable" className="app-table">
            <thead>
              <tr>
                <th onClick={()=>setSort(s=>({ col: 'titulo', dir: s?.col==='titulo' && s.dir==='asc' ? 'desc':'asc' }))}>T├¡tulo <i className="fa-solid fa-sort"></i></th>
                <th onClick={()=>setSort(s=>({ col: 'empresa', dir: s?.col==='empresa' && s.dir==='asc' ? 'desc':'asc' }))}>Empresa <i className="fa-solid fa-sort"></i></th>
                <th onClick={()=>setSort(s=>({ col: 'status', dir: s?.col==='status' && s.dir==='asc' ? 'desc':'asc' }))}>Status <i className="fa-solid fa-sort"></i></th>
                <th onClick={()=>setSort(s=>({ col: 'probabilidade', dir: s?.col==='probabilidade' && s.dir==='asc' ? 'desc':'asc' }))}>Probabilidade <i className="fa-solid fa-sort"></i></th>
                <th onClick={()=>setSort(s=>({ col: 'impacto', dir: s?.col==='impacto' && s.dir==='asc' ? 'desc':'asc' }))}>Impacto <i className="fa-solid fa-sort"></i></th>
                <th onClick={()=>setSort(s=>({ col: 'matriz', dir: s?.col==='matriz' && s.dir==='asc' ? 'desc':'asc' }))}>N├¡vel de risco <i className="fa-solid fa-sort"></i></th>
                <th>A├º├Áes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>{r.titulo}</td>
                  <td>{base.empresas.find(e=>e.id===r.empresaId)?.nome||r.empresaId}</td>
                  <td>{(() => { const c = statusBadge(r.status); return <span className="badge" style={badgeStyle(c.bg, c.fg)}>{r.status}</span>; })()}</td>
                  <td>{(() => { const c = probImpactBadge(r.probabilidade); return <span className="badge" style={badgeStyle(c.bg, c.fg)}>{r.probabilidade}</span>; })()}</td>
                  <td>{(() => { const c = probImpactBadge(r.impacto); return <span className="badge" style={badgeStyle(c.bg, c.fg)}>{r.impacto}</span>; })()}</td>
                  <td>{(() => { const nivel = nivelFrom(r.probabilidade, r.impacto); const c = nivelBadge(nivel); return <span className="badge" style={badgeStyle(c.bg, c.fg)}>{nivel}</span>; })()}</td>
                  <td>
                    <button className="btn-success btn-small" onClick={()=>gerarProjeto(r.id)}><i className="fa-solid fa-diagram-project"></i> Gerar Projeto</button>
                    <button className="btn-danger btn-small" onClick={async()=>{ if (confirm('Deseja excluir este risco?')) { try { await api.deleteRisco(r.id); toast.show('Risco exclu├¡do', 'success'); load(); } catch { toast.show('Erro ao excluir', 'error'); } } }}><i className="fa-solid fa-trash"></i> Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', gap: 24, alignItems: 'center', color: '#555' }}>
        <div><strong>Legenda:</strong></div>
        <div>
          Status:
          <span className="badge" style={{ marginLeft: 6, ...badgeStyle(statusBadge('Aberto').bg, statusBadge('Aberto').fg) }}>Aberto</span>
          <span className="badge" style={{ marginLeft: 6, ...badgeStyle(statusBadge('Mitigando').bg, statusBadge('Mitigando').fg) }}>Mitigando</span>
          <span className="badge" style={{ marginLeft: 6, ...badgeStyle(statusBadge('Encerrado').bg, statusBadge('Encerrado').fg) }}>Encerrado</span>
        </div>
        <div>
          Prob:
          <span className="badge" style={{ marginLeft: 6, ...badgeStyle(probBadge('Baixa').bg, probBadge('Baixa').fg) }}>Baixa</span>
          <span className="badge" style={{ marginLeft: 6, ...badgeStyle(probBadge('M├®dia').bg, probBadge('M├®dia').fg) }}>M├®dia</span>
          <span className="badge" style={{ marginLeft: 6, ...badgeStyle(probBadge('Alta').bg, probBadge('Alta').fg) }}>Alta</span>
        </div>
        <div>
          Impacto:
          <span className="badge" style={{ marginLeft: 6, ...badgeStyle(impactoBadge('Baixo').bg, impactoBadge('Baixo').fg) }}>Baixo</span>
          <span className="badge" style={{ marginLeft: 6, ...badgeStyle(impactoBadge('M├®dio').bg, impactoBadge('M├®dio').fg) }}>M├®dio</span>
          <span className="badge" style={{ marginLeft: 6, ...badgeStyle(impactoBadge('Alto').bg, impactoBadge('Alto').fg) }}>Alto</span>
        </div>
      </div>

      <Modal open={historyOpen} title={`Hist├│rico do Risco`} onClose={()=>setHistoryOpen(false)}>
        {historyRisk && (
          <div>
            <div><strong>{historyRisk.titulo}</strong></div>
            <ul>
              {(historyRisk.historico||[]).length === 0 && <li>Nenhum evento registrado.</li>}
              {(historyRisk.historico||[]).map((h, idx) => (
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
    </div>
  );
};

