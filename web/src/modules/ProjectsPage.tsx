import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Projeto } from './App';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { badgeStyle, statusBadge, probBadge, impactoBadge } from '../utils/badges';

export const ProjectsPage: React.FC<{ base: AppState }> = ({ base }) => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const load = () => fetch('/api/projetos').then(r=>r.json()).then(setProjetos);
  useEffect(() => { load(); }, []);
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [curr, setCurr] = useState<Projeto | null>(null);
  const [riskInfo, setRiskInfo] = useState<any | null>(null);
  const toast = useToast();

  const updateEtapa = async (id: string, etapa: Projeto['etapa']) => {
    await fetch(`/api/projetos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ etapa }) });
    toast.show('Etapa atualizada', 'success');
    load();
  };

      const columns: { title: string, etapa: Projeto['etapa'] }[] = [
        { title: 'Iniciação', etapa: 'Backlog' },
        { title: 'Planejamento', etapa: 'Planejamento' },
        { title: 'Execução', etapa: 'Execução' },
        { title: 'Monitoramento', etapa: 'Execução' },
        { title: 'Encerramento', etapa: 'Concluído' },
      ];
  const byPrazo = (list: Projeto[]) => [...list].sort((a,b) => {
    const va = a.prazo ? new Date(a.prazo).getTime() : Number.MAX_SAFE_INTEGER;
    const vb = b.prazo ? new Date(b.prazo).getTime() : Number.MAX_SAFE_INTEGER;
    return va - vb;
  });

  return (
    <div>
      <div className="screen-header">
           <h2><i className="fa-solid fa-diagram-project"></i> Kanban de Projetos</h2>
        <div className="form-actions">
             <button className="btn-outline" onClick={()=>window.print()}><i className="fa-solid fa-file-pdf"></i> Gerar PDF do Escopo</button>
          <button className="btn-outline btn-small" onClick={()=>setHistoryOpen(true)}><i className="fa-solid fa-clock-rotate-left"></i> Histórico</button>
        </div>
      </div>
      <div className="card">
        <h2>Kanban de Projetos</h2>
      </div>
          <div className="kanban-container">
            {columns.map(col => (
              <div key={col.title} className="kanban-column">
                <h3 style={{ color: 'var(--primary)' }}>{col.title}</h3>
                <div style={{ height: 2, background: '#e5e7eb', margin: '0.5rem 0 1rem' }}></div>
                {byPrazo(projetos.filter(p=>p.etapa===col.etapa)).length === 0 && (
                  <div className="kanban-card" style={{ color: '#777' }}>Nenhum projeto nesta etapa</div>
                )}
                {byPrazo(projetos.filter(p=>p.etapa===col.etapa)).map(p => (
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
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                      <button className="btn-outline btn-small" title="Mover para Backlog" disabled={p.etapa==='Backlog'} onClick={()=>updateEtapa(p.id, 'Backlog')}><i className="fa-solid fa-arrow-left"></i></button>
                      <button className="btn-outline btn-small" title="Mover para Planejamento" disabled={p.etapa==='Planejamento'} onClick={()=>updateEtapa(p.id, 'Planejamento')}><i className="fa-solid fa-list-check"></i></button>
                      <button className="btn-outline btn-small" title="Mover para Execução" disabled={p.etapa==='Execução'} onClick={()=>updateEtapa(p.id, 'Execução')}><i className="fa-solid fa-person-running"></i></button>
                      <button className="btn-outline btn-small" title="Mover para Concluído" disabled={p.etapa==='Concluído'} onClick={()=>updateEtapa(p.id, 'Concluído')}><i className="fa-solid fa-flag-checkered"></i></button>
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
    </div>
  );
};
