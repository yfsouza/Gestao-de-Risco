import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Risco } from './App';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { statusBadge, probBadge, impactoBadge, badgeStyle } from '../utils/badges';
import { api } from '../services/api';

type ScreenName = 'risks'|'risks-form'|'projects'|'committee'|'reports'|'admin';

export const RisksPage: React.FC<{ base: AppState; setScreen?: React.Dispatch<React.SetStateAction<ScreenName>>; showForm?: boolean; selectedRiskId?: string|null; setSelectedRiskId?: (id: string|null)=>void }> = ({ base, setScreen, showForm = false, selectedRiskId, setSelectedRiskId }) => {
  const [riscos, setRiscos] = useState<Risco[]>([]);
  const [form, setForm] = useState<Partial<Risco>>({ probabilidade: '3-Média', impacto: '3-Médio', status: 'Aberto' } as any);
  const [cats, setCats] = useState<{ id: string; nome: string; descricao?: string }[]>([]);
  const [riskCats, setRiskCats] = useState<{ id: string; nome: string; descricao?: string }[]>([]);
  const [busca, setBusca] = useState('');
  const [fEmpresa, setFEmpresa] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fMatriz, setFMatriz] = useState('');
  const [sort, setSort] = useState<{ col: 'titulo'|'status'|'empresa'|'probabilidade'|'impacto'|'matriz'; dir: 'asc'|'desc' }|null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRisk, setHistoryRisk] = useState<Risco | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const toast = useToast();

  const load = () => api.riscos().then(setRiscos).catch(()=>setRiscos([]));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    fetch('/api/categorias').then(r=>r.json()).then(setCats).catch(()=>setCats([]));
    fetch('/api/categorias-risco').then(r=>r.json()).then(setRiskCats).catch(()=>setRiskCats([]));
  }, []);

  useEffect(() => {
    if (!showForm) return;
    if (selectedRiskId) {
      api.risco(selectedRiskId).then((r: any) => {
        setEditingId(r.id);
        setForm({ empresaId: r.empresaId, responsavelId: (r as any).responsavelId || r.analistaId, titulo: r.titulo, descricao: r.descricao, probabilidade: r.probabilidade as any, impacto: r.impacto as any, status: r.status, matriz: r.matriz, categoriaId: (r as any).categoriaId, categoriaRiscoId: (r as any).categoriaRiscoId } as any);
      }).catch(()=>{
        setEditingId(null);
        setForm({ probabilidade: '3-Média', impacto: '3-Médio', status: 'Aberto' } as any);
      });
    } else {
      setEditingId(null);
      setForm({ probabilidade: '3-Média', impacto: '3-Médio', status: 'Aberto' } as any);
    }
  }, [showForm, selectedRiskId]);

  const parseNivelNum = (txt?: string) => {
    if (!txt) return 3;
    const m = txt.match(/^([1-5])/);
    return m ? parseInt(m[1], 10) : 3;
  };
  const nivelFrom = (prob: string|undefined, imp: string|undefined): 'Baixo'|'Médio'|'Alto' => {
    const p = parseNivelNum(prob);
    const i = parseNivelNum(imp);
    const score = p + i; // 2..10
    if (score >= 8) return 'Alto';
    if (score >= 5) return 'Médio';
    return 'Baixo';
  };
  const probImpactBadge = (val: string|undefined) => {
    const n = parseNivelNum(val);
    if (n >= 4) return { bg: '#fde2e2', fg: '#c0392b' }; // alto
    if (n === 3) return { bg: '#fff3cd', fg: '#b7791f' }; // médio
    return { bg: '#e2f7e2', fg: '#2e7d32' }; // baixo
  };
  const nivelBadge = (nivel: 'Baixo'|'Médio'|'Alto') => {
    if (nivel==='Alto') return { bg: '#fde2e2', fg: '#c0392b' };
    if (nivel==='Médio') return { bg: '#fff3cd', fg: '#b7791f' };
    return { bg: '#e2f7e2', fg: '#2e7d32' };
  };
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

  const matrizes = useMemo(() => Array.from(new Set(riscos.map(r=>nivelFrom(r.probabilidade as any, r.impacto as any)).filter(Boolean))), [riscos]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nivel = nivelFrom(form.probabilidade as string, form.impacto as string);
      const payload = { ...form, matriz: nivel } as Partial<Risco>;
      if (editingId) {
        await api.updateRisco(editingId, payload);
        toast.show('Risco atualizado com sucesso', 'success');
        setEditingId(null);
      } else {
        await api.addRisco(payload);
        toast.show('Risco salvo com sucesso', 'success');
      }
      setForm({ probabilidade: '3-Média', impacto: '3-Médio', status: 'Aberto' } as any);
      load();
      if (setScreen) setScreen('risks');
    } catch { toast.show('Erro ao salvar risco', 'error'); }
  };

  const openHistory = (risk: Risco) => { setHistoryRisk(risk); setHistoryOpen(true); };

  return (
    <div>
      {showForm ? (
        <div className="card">
          <div className="screen-header">
            <h2><i className="fa-solid fa-file-circle-plus"></i> Cadastro de Risco</h2>
            <div className="form-actions">
              <button className="btn-outline" type="button" onClick={()=>setForm({ probabilidade: 'Média', impacto: 'Médio', status: 'Aberto', matriz: 'Default' } as any)}><i className="fa-solid fa-eraser"></i> Limpar formulário</button>
              <button className="btn-outline" type="button" onClick={()=>{ setSelectedRiskId && setSelectedRiskId(null); setEditingId(null); setForm({ probabilidade: '3-Média', impacto: '3-Médio', status: 'Aberto' } as any); if (setScreen) setScreen('risks'); }} style={{ marginLeft: 8 }}>Voltar</button>
            </div>
          </div>

          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="compact-top-row" style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div className="form-group" style={{ minWidth: 180 }}>
                  <label className="required">Empresa</label>
                  <select value={form.empresaId||''} onChange={e=>setForm(f=>({ ...f, empresaId: e.target.value }))} required>
                    <option value="">Selecione uma empresa</option>
                    {base.empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ minWidth: 180 }}>
                  <label className="required">Analista Responsável</label>
                  <select value={(form as any).responsavelId||''} onChange={e=>setForm(f=>({ ...f, responsavelId: e.target.value } as any))} required>
                    <option value="">Selecione um analista</option>
                    {base.colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                  <div className="form-group" style={{ flex: 2, minWidth: 260 }}>
                    <label className="required">Título do Risco</label>
                    <input placeholder="Descreva o risco brevemente" value={form.titulo||''} onChange={e=>setForm(f=>({ ...f, titulo: e.target.value }))} required />
                  </div>
                  <div className="form-group" style={{ minWidth: 180 }}>
                    <label>Categoria</label>
                    <select value={(form as any).categoriaId||''} onChange={e=>setForm(f=>({ ...f, categoriaId: e.target.value }))}>
                      <option value="">Nenhuma</option>
                      {cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ minWidth: 180 }}>
                    <label>Categoria do Risco</label>
                    <select value={(form as any).categoriaRiscoId||''} onChange={e=>setForm(f=>({ ...f, categoriaRiscoId: e.target.value }))}>
                      <option value="">Nenhuma</option>
                      {riskCats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="required">Descrição</label>
                  <textarea placeholder="Descreva o risco em detalhes" value={form.descricao||''} onChange={e=>setForm(f=>({ ...f, descricao: e.target.value }))} required />
                </div>
                <div className="compact-row" style={{ gridColumn: '1 / -1' }}>
                  <div className="form-group">
                    <label>Probabilidade</label>
                    <select value={form.probabilidade||'3-Média'} onChange={e=>setForm(f=>({ ...f, probabilidade: e.target.value as any }))}>
                      <option>5-Muito Alta</option>
                      <option>4-Alta</option>
                      <option>3-Média</option>
                      <option>2-Baixa</option>
                      <option>1-Muito baixa</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Impacto</label>
                    <select value={form.impacto||'3-Médio'} onChange={e=>setForm(f=>({ ...f, impacto: e.target.value as any }))}>
                      <option>5-Muito Alto</option>
                      <option>4-Alto</option>
                      <option>3-Médio</option>
                      <option>2-Baixo</option>
                      <option>1-Muito baixo</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <label style={{ marginBottom: 6 }}>Nível de risco (Probabilidade x Impacto)</label>
                    {(() => { const nivel = nivelFrom(form.probabilidade as string, form.impacto as string); const c = nivelBadge(nivel); return <span className="badge" style={badgeStyle(c.bg, c.fg)}>{nivel}</span>; })()}
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.status||'Aberto'} onChange={e=>setForm(f=>({ ...f, status: e.target.value as any }))}>
                      <option>Aberto</option><option>Mitigando</option><option>Encerrado</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-primary" type="submit"><i className="fa-solid fa-floppy-disk"></i> Salvar Risco</button>
              </div>
            </form>
          </div>
        ) : (
          // list mode: render only the grid (form is on separate screen)
          <>
            <div className="card">
              <div className="filters">
                <div className="search-box" style={{ flex: 1 }}>
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input placeholder="Buscar por título/descrição" value={busca} onChange={e=>setBusca(e.target.value)} />
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
                    <option value="">Todos os níveis</option>
                    {matrizes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <button className="btn-outline" onClick={()=>{ setBusca(''); setFEmpresa(''); setFStatus(''); setFMatriz(''); setSort(null); }}>Limpar filtros</button>
                <button className="btn-primary" style={{ marginLeft: 8 }} onClick={()=>{ setSelectedRiskId && setSelectedRiskId(null); setEditingId(null); if (setScreen) setScreen('risks-form'); }}>Cadastrar Risco</button>
              </div>
              <div className="table-responsive">
                <table id="risksTable" className="app-table">
                  <thead>
                    <tr>
                      <th onClick={()=>setSort(s=>({ col: 'titulo', dir: s?.col==='titulo' && s.dir==='asc' ? 'desc':'asc' }))}>Título <i className="fa-solid fa-sort"></i></th>
                      <th onClick={()=>setSort(s=>({ col: 'empresa', dir: s?.col==='empresa' && s.dir==='asc' ? 'desc':'asc' }))}>Empresa <i className="fa-solid fa-sort"></i></th>
                      <th onClick={()=>setSort(s=>({ col: 'status', dir: s?.col==='status' && s.dir==='asc' ? 'desc':'asc' }))}>Status <i className="fa-solid fa-sort"></i></th>
                      <th onClick={()=>setSort(s=>({ col: 'probabilidade', dir: s?.col==='probabilidade' && s.dir==='asc' ? 'desc':'asc' }))}>Probabilidade <i className="fa-solid fa-sort"></i></th>
                      <th onClick={()=>setSort(s=>({ col: 'impacto', dir: s?.col==='impacto' && s.dir==='asc' ? 'desc':'asc' }))}>Impacto <i className="fa-solid fa-sort"></i></th>
                      <th onClick={()=>setSort(s=>({ col: 'matriz', dir: s?.col==='matriz' && s.dir==='asc' ? 'desc':'asc' }))}>Nível de risco <i className="fa-solid fa-sort"></i></th>
                      <th>Ações</th>
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
                          <button className="btn-outline btn-small" onClick={()=>{
                            // navigate to form screen for editing
                            if (setScreen && setSelectedRiskId) { setSelectedRiskId(r.id); setScreen('risks-form'); }
                            else {
                              setEditingId(r.id);
                              setForm({ empresaId: r.empresaId, responsavelId: (r as any).responsavelId || r.analistaId, titulo: r.titulo, descricao: r.descricao, probabilidade: r.probabilidade as any, impacto: r.impacto as any, status: r.status, matriz: r.matriz, categoriaId: (r as any).categoriaId, categoriaRiscoId: (r as any).categoriaRiscoId } as any);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}><i className="fa-solid fa-pen"></i> Editar</button>
                          <button className="btn-outline btn-small" onClick={()=>openHistory(r)}><i className="fa-solid fa-clock-rotate-left"></i> Histórico</button>
                          <button className="btn-danger btn-small" onClick={async()=>{ if (confirm('Deseja excluir este risco?')) { try { await api.deleteRisco(r.id); toast.show('Risco excluído', 'success'); load(); } catch { toast.show('Erro ao excluir', 'error'); } } }}><i className="fa-solid fa-trash"></i> Excluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    );
                <label>Probabilidade</label>
                <select value={form.probabilidade||'3-Média'} onChange={e=>setForm(f=>({ ...f, probabilidade: e.target.value as any }))}>
                  <option>5-Muito Alta</option>
                  <option>4-Alta</option>
                  <option>3-Média</option>
                  <option>2-Baixa</option>
                  <option>1-Muito baixa</option>
                </select>
              </div>
              <div className="form-group">
                <label>Impacto</label>
                <select value={form.impacto||'3-Médio'} onChange={e=>setForm(f=>({ ...f, impacto: e.target.value as any }))}>
                  <option>5-Muito Alto</option>
                  <option>4-Alto</option>
                  <option>3-Médio</option>
                  <option>2-Baixo</option>
                  <option>1-Muito baixo</option>
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <label style={{ marginBottom: 6 }}>Nível de risco (Probabilidade x Impacto)</label>
                {(() => { const nivel = nivelFrom(form.probabilidade as string, form.impacto as string); const c = nivelBadge(nivel); return <span className="badge" style={badgeStyle(c.bg, c.fg)}>{nivel}</span>; })()}
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status||'Aberto'} onChange={e=>setForm(f=>({ ...f, status: e.target.value as any }))}>
                  <option>Aberto</option><option>Mitigando</option><option>Encerrado</option>
                </select>
              </div>
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
            <input placeholder="Buscar por título/descrição" value={busca} onChange={e=>setBusca(e.target.value)} />
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
              <option value="">Todos os níveis</option>
              {matrizes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button className="btn-outline" onClick={()=>{ setBusca(''); setFEmpresa(''); setFStatus(''); setFMatriz(''); setSort(null); }}>Limpar filtros</button>
        </div>
        <div className="table-responsive">
          <table id="risksTable" className="app-table">
            <thead>
              <tr>
                <th onClick={()=>setSort(s=>({ col: 'titulo', dir: s?.col==='titulo' && s.dir==='asc' ? 'desc':'asc' }))}>Título <i className="fa-solid fa-sort"></i></th>
                <th onClick={()=>setSort(s=>({ col: 'empresa', dir: s?.col==='empresa' && s.dir==='asc' ? 'desc':'asc' }))}>Empresa <i className="fa-solid fa-sort"></i></th>
                <th onClick={()=>setSort(s=>({ col: 'status', dir: s?.col==='status' && s.dir==='asc' ? 'desc':'asc' }))}>Status <i className="fa-solid fa-sort"></i></th>
                <th onClick={()=>setSort(s=>({ col: 'probabilidade', dir: s?.col==='probabilidade' && s.dir==='asc' ? 'desc':'asc' }))}>Probabilidade <i className="fa-solid fa-sort"></i></th>
                <th onClick={()=>setSort(s=>({ col: 'impacto', dir: s?.col==='impacto' && s.dir==='asc' ? 'desc':'asc' }))}>Impacto <i className="fa-solid fa-sort"></i></th>
                <th onClick={()=>setSort(s=>({ col: 'matriz', dir: s?.col==='matriz' && s.dir==='asc' ? 'desc':'asc' }))}>Nível de risco <i className="fa-solid fa-sort"></i></th>
                <th>Ações</th>
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
                    <button className="btn-outline btn-small" onClick={()=>{
                      // abrir modo de edição preenchendo o formulário
                      setEditingId(r.id);
                      setForm({ empresaId: r.empresaId, responsavelId: (r as any).responsavelId || r.analistaId, titulo: r.titulo, descricao: r.descricao, probabilidade: r.probabilidade as any, impacto: r.impacto as any, status: r.status, matriz: r.matriz, categoriaId: (r as any).categoriaId, categoriaRiscoId: (r as any).categoriaRiscoId } as any);
                      // scroll to top where the form is
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}><i className="fa-solid fa-pen"></i> Editar</button>
                    <button className="btn-outline btn-small" onClick={()=>openHistory(r)}><i className="fa-solid fa-clock-rotate-left"></i> Histórico</button>
                    <button className="btn-danger btn-small" onClick={async()=>{ if (confirm('Deseja excluir este risco?')) { try { await api.deleteRisco(r.id); toast.show('Risco excluído', 'success'); load(); } catch { toast.show('Erro ao excluir', 'error'); } } }}><i className="fa-solid fa-trash"></i> Excluir</button>
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
          <span className="badge" style={{ marginLeft: 6, ...badgeStyle(probBadge('Média').bg, probBadge('Média').fg) }}>Média</span>
          <span className="badge" style={{ marginLeft: 6, ...badgeStyle(probBadge('Alta').bg, probBadge('Alta').fg) }}>Alta</span>
        </div>
        <div>
          Impacto:
          <span className="badge" style={{ marginLeft: 6, ...badgeStyle(impactoBadge('Baixo').bg, impactoBadge('Baixo').fg) }}>Baixo</span>
          <span className="badge" style={{ marginLeft: 6, ...badgeStyle(impactoBadge('Médio').bg, impactoBadge('Médio').fg) }}>Médio</span>
          <span className="badge" style={{ marginLeft: 6, ...badgeStyle(impactoBadge('Alto').bg, impactoBadge('Alto').fg) }}>Alto</span>
        </div>
      </div>

      <Modal open={historyOpen} title={`Histórico do Risco`} onClose={()=>setHistoryOpen(false)}>
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
