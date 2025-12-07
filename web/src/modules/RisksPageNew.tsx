import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Risco } from './App';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { api } from '../services/api';

type ScreenName = 'risks'|'risks-form'|'projects'|'committee'|'reports'|'admin';

export const RisksPage: React.FC<{ base: AppState; setScreen?: React.Dispatch<React.SetStateAction<ScreenName>>; showForm?: boolean; selectedRiskId?: string|null; setSelectedRiskId?: (id: string|null)=>void }> = ({ base, setScreen, showForm = false, selectedRiskId, setSelectedRiskId }) => {
  const [riscos, setRiscos] = useState<Risco[]>([]);
  const [form, setForm] = useState<Partial<Risco>>({ probabilidade: '3-Média', impacto: '3-Médio', status: 'Em Andamento' } as any);
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
        setForm({ probabilidade: '3-Média', impacto: '3-Médio', status: 'Em Andamento' } as any);
      });
    } else {
      setEditingId(null);
      setForm({ probabilidade: '3-Média', impacto: '3-Médio', status: 'Em Andamento' } as any);
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
      if (!editingId) {
        // set createdAt automatically for new risks
        payload.createdAt = new Date().toISOString();
      }
      if (editingId) {
        await api.updateRisco(editingId, payload);
        toast.show('Risco atualizado com sucesso', 'success');
        setEditingId(null);
      } else {
        await api.addRisco(payload);
        toast.show('Risco salvo com sucesso', 'success');
      }
      setForm({ probabilidade: '3-Média', impacto: '3-Médio', status: 'Em Andamento' } as any);
      load();
      if (setScreen) setScreen('risks');
    } catch { toast.show('Erro ao salvar risco', 'error'); }
  };

  const openHistory = (risk: Risco) => { setHistoryRisk(risk); setHistoryOpen(true); };

  const handleDelete = async (id: string) => {
    if (!confirm('Confirma exclusão deste risco?')) return;
    try {
      await api.deleteRisco(id);
      toast.show('Risco excluído com sucesso', 'success');
      load();
    } catch {
      toast.show('Erro ao excluir risco', 'error');
    }
  };

  return (
    <div>
      {showForm ? (
        <div className="card">
          <div className="screen-header">
            <h2><i className="fa-solid fa-file-circle-plus"></i> Cadastro de Risco</h2>
            <div className="form-actions">
              <button className="btn-outline" type="button" onClick={()=>setForm({ probabilidade: '3-Média', impacto: '3-Médio', status: 'Em Andamento', matriz: 'Default' } as any)}><i className="fa-solid fa-eraser"></i> Limpar formulário</button>
              <button className="btn-outline" type="button" onClick={()=>{ setSelectedRiskId && setSelectedRiskId(null); setEditingId(null); setForm({ probabilidade: '3-Média', impacto: '3-Médio', status: 'Em Andamento' } as any); if (setScreen) setScreen('risks'); }} style={{ marginLeft: 8 }}>Voltar</button>
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

              <div style={{ gridColumn: '1 / -1' }}>
                <label>Descrição</label>
                <textarea style={{ width: '100%', boxSizing: 'border-box' }} value={form.descricao||''} onChange={e=>setForm(f=>({ ...f, descricao: e.target.value }))} rows={6} />
                {form.createdAt && (
                  <div style={{ marginTop: 8, color: '#666' }}><strong>Data de cadastro:</strong> {formatDateOnly(form.createdAt as string)}</div>
                )}
              </div>

              <div className="form-group">
                <label>Probabilidade</label>
                <select value={form.probabilidade||''} onChange={e=>setForm(f=>({ ...f, probabilidade: e.target.value } as any))}>
                  <option value="1-Baixa">1 - Baixa</option>
                  <option value="2-Baixa">2 - Baixa</option>
                  <option value="3-Média">3 - Média</option>
                  <option value="4-Alta">4 - Alta</option>
                  <option value="5-Alta">5 - Alta</option>
                </select>
              </div>

              <div className="form-group">
                <label>Impacto</label>
                <select value={form.impacto||''} onChange={e=>setForm(f=>({ ...f, impacto: e.target.value } as any))}>
                  <option value="1-Baixa">1 - Baixa</option>
                  <option value="2-Baixa">2 - Baixa</option>
                  <option value="3-Médio">3 - Médio</option>
                  <option value="4-Alto">4 - Alto</option>
                  <option value="5-Alto">5 - Alto</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select autoFocus value={form.status||''} onChange={e=>setForm(f=>({ ...f, status: e.target.value } as any))}>
                  <option value="Aberto">Aberto</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Mitigado">Mitigado</option>
                  <option value="Fechado">Fechado</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn" type="submit">Salvar</button>
                <button className="btn-outline" type="button" onClick={()=>{ setForm({ probabilidade: '3-Média', impacto: '3-Médio', status: 'Em Andamento' } as any); setEditingId(null); setSelectedRiskId && setSelectedRiskId(null); }}>Cancelar</button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input placeholder="Buscar riscos" value={busca} onChange={e=>setBusca(e.target.value)} />
              <select value={fEmpresa} onChange={e=>setFEmpresa(e.target.value)}>
                <option value="">Todas as empresas</option>
                {base.empresas.map(ep => <option key={ep.id} value={ep.id}>{ep.nome}</option>)}
              </select>
              <select value={fStatus} onChange={e=>setFStatus(e.target.value)}>
                <option value="">Todos os status</option>
                <option value="Aberto">Aberto</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Mitigado">Mitigado</option>
                <option value="Fechado">Fechado</option>
              </select>
              <select value={fMatriz} onChange={e=>setFMatriz(e.target.value)}>
                <option value="">Todas matrizes</option>
                {matrizes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <button className="btn" onClick={()=>{ setSelectedRiskId && setSelectedRiskId(null); if (setScreen) setScreen('risks-form'); }}>Cadastrar Risco</button>
            </div>
          </div>

          <div style={{ marginTop: 12 }} className="table-responsive">
            <table className="app-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Data Cadastro</th>
                    <th>Título</th>
                    <th>Empresa</th>
                    <th>Probabilidade</th>
                    <th>Impacto</th>
                    <th>Nível de Risco</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.id}>
                        {r.id ? (r.id.length > 10 ? r.id.slice(0, 10) + '…' : r.id) : ''}
                      </td>
                      <td>{formatDateOnly(r.createdAt || (r as any).dataCadastro || (r as any).dataCriacao || (r.historico && r.historico[0]?.data) || '')}</td>
                      <td>{r.titulo}</td>
                      <td>{base.empresas.find(e=>e.id===r.empresaId)?.nome || ''}</td>
                      <td><span style={{ padding: '4px 8px', background: probImpactBadge(r.probabilidade as any).bg, color: probImpactBadge(r.probabilidade as any).fg, borderRadius: 4 }}>{r.probabilidade}</span></td>
                      <td><span style={{ padding: '4px 8px', background: probImpactBadge(r.impacto as any).bg, color: probImpactBadge(r.impacto as any).fg, borderRadius: 4 }}>{r.impacto}</span></td>
                      <td><span style={{ padding: '4px 8px', background: nivelBadge(nivelFrom(r.probabilidade as any, r.impacto as any)).bg, color: nivelBadge(nivelFrom(r.probabilidade as any, r.impacto as any)).fg, borderRadius: 4 }}>{nivelFrom(r.probabilidade as any, r.impacto as any)}</span></td>
                      <td>{r.status}</td>
                      <td>
                        <button className="btn-small btn-icon btn-icon--edit" title="Editar" aria-label={`Editar ${r.titulo}`} onClick={()=>{ if (setScreen) { setSelectedRiskId && setSelectedRiskId(r.id); setScreen('risks-form'); } else { setEditingId(r.id); setForm(r as any); } }}>
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button className="btn-small btn-icon btn-icon--delete" title="Excluir" aria-label={`Excluir ${r.titulo}`} onClick={()=>handleDelete(r.id)} style={{ marginLeft: 8 }}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                        <button className="btn-small btn-icon btn-icon--history" title="Histórico" aria-label={`Histórico ${r.titulo}`} onClick={()=>openHistory(r)} style={{ marginLeft: 8 }}>
                          <i className="fa-solid fa-clock-rotate-left"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {historyOpen && historyRisk && (
        <Modal open={historyOpen} onClose={()=>setHistoryOpen(false)}>
          <h3>Histórico - {historyRisk.titulo}</h3>
          <div><strong>Empresa:</strong> {base.empresas.find(e=>e.id===historyRisk.empresaId)?.nome}</div>
          <div><strong>Descrição:</strong> <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{historyRisk.descricao}</div></div>
        </Modal>
      )}
    </div>
  );
};

// helpers
function formatDate(d?: string) {
  if (!d) return '';
  try {
    const dt = new Date(d);
    return dt.toLocaleString();
  } catch { return d; }
}

function formatDateOnly(d?: string) {
  if (!d) return '';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString();
  } catch { return d; }
}

