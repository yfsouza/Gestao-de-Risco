import React, { useEffect, useState } from 'react';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { badgeStyle, statusBadge } from '../utils/badges';
import { Projeto } from './App';

type Etapa = {
  name: string;
  tasks: { id?: string; title: string; completed?: boolean; responsible?: string; date?: string }[];
};

export const ExecucaoPage: React.FC<{ projetoId: string; onClose: () => void; onSaved?: () => void }> = ({ projetoId, onClose, onSaved }) => {
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [addEtapaOpen, setAddEtapaOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState<{ open: boolean; etapaIndex?: number }>({ open: false });
  const [newEtapaName, setNewEtapaName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const load = async () => {
    const projetos = await fetch('/api/projetos').then(r => r.json());
    const p = projetos.find((x: any) => x.id === projetoId) || null;
    console.log('ExecucaoPage loaded project (from list)', p);
    setProjeto(p);
    // aceitar estruturas antigas (array strings) convertendo
    const loadedEtapas: Etapa[] = (p.etapas || []).map((e: any) => typeof e === 'string' ? { name: e, tasks: [] } : { name: e.name || e.titulo || 'Etapa', tasks: e.tasks || [] });
    setEtapas(loadedEtapas);
  };

  useEffect(() => { load(); }, [projetoId]);

  const toggleTask = async (ei: number, ti: number) => {
    const newEtapas = etapas.map((et, i) => i === ei ? { ...et, tasks: et.tasks.map((t, j) => j === ti ? { ...t, completed: !t.completed } : t) } : et);
    setEtapas(newEtapas);
    await salvarEtapas(newEtapas);
  };

  const salvarEtapas = async (newEtapas?: Etapa[]) => {
    if (!projeto) { toast.show('Projeto não carregado ainda', 'error'); return; }
    const body = { etapas: (newEtapas || etapas) };
    setSaving(true);
    console.log('Salvando etapas para projeto', projeto.id, body);
    try {
      const res = await fetch(`/api/projetos/${projeto.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const text = await res.text();
        console.error('Erro ao salvar etapas', res.status, text);
        toast.show('Erro ao salvar etapas', 'error');
        setSaving(false);
        return;
      }
      toast.show('Etapas atualizadas', 'success');
      await load();
      if (onSaved) onSaved();
    } catch (err) {
      console.error('Exception ao salvar etapas', err);
      toast.show('Erro ao salvar etapas', 'error');
    } finally {
      setSaving(false);
    }
  };

  const [showMoveConfirm, setShowMoveConfirm] = useState(false);

  // monitorar progresso e exibir confirmação quando atinge 100% e projeto ainda não estiver em monitoramento
  useEffect(() => {
    const prog = overallProgress();
    if (prog === 100 && projeto && !(projeto as any).monitoramento) {
      setShowMoveConfirm(true);
    } else {
      setShowMoveConfirm(false);
    }
  }, [etapas, projeto]);

  const moveToMonitoramento = async () => {
    if (!projeto) return;
    try {
      await fetch(`/api/projetos/${projeto.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ monitoramento: true }) });
      toast.show('Projeto movido para Monitoramento', 'success');
      setShowMoveConfirm(false);
      await load();
      if (onSaved) onSaved();
    } catch {
      toast.show('Erro ao mover projeto para Monitoramento', 'error');
    }
  };

  const abrirAddEtapa = () => { setNewEtapaName(''); setAddEtapaOpen(true); };
  const confirmarAddEtapa = async () => {
    const nome = newEtapaName.trim();
    if (!nome) { toast.show('Informe o nome da etapa', 'error'); return; }
    const novo = [...etapas, { name: nome, tasks: [] }];
    setEtapas(novo);
    setAddEtapaOpen(false);
    setNewEtapaName('');
    await salvarEtapas(novo);
  };

  const abrirAddTarefa = (ei: number) => { setNewTaskTitle(''); setAddTaskOpen({ open: true, etapaIndex: ei }); };
  const confirmarAddTarefa = async () => {
    if (!addTaskOpen.etapaIndex && addTaskOpen.etapaIndex !== 0) { setAddTaskOpen({ open: false }); return; }
    const titulo = newTaskTitle.trim();
    if (!titulo) { toast.show('Informe o título da tarefa', 'error'); return; }
    const ei = addTaskOpen.etapaIndex!;
    const novo = etapas.map((et, i) => i === ei ? { ...et, tasks: [...et.tasks, { title: titulo, completed: false }] } : et);
    setEtapas(novo);
    setAddTaskOpen({ open: false });
    setNewTaskTitle('');
    await salvarEtapas(novo);
  };

  const progressoEtapa = (et: Etapa) => {
    const total = et.tasks.length;
    if (total === 0) return 0;
    const concl = et.tasks.filter(t => t.completed).length;
    return Math.round((concl / total) * 100);
  };

  const overallProgress = () => {
    const allTasks = etapas.flatMap(e => e.tasks);
    if (allTasks.length === 0) return 0;
    const done = allTasks.filter(t => t.completed).length;
    return Math.round((done / allTasks.length) * 100);
  };

  return (
    <>
    <div style={{ padding: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Controle de Etapas</h3>
        <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
            <button className="btn btn-primary" onClick={() => salvarEtapas()} title="Gravar alterações" disabled={saving}><i className="fa-solid fa-floppy-disk"></i> {saving ? 'Gravando...' : 'Gravar'}</button>
          </div>
      </div>

      <div style={{ margin: '8px 0' }}>
        <strong>Projeto:</strong> {projeto?.titulo}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><strong>Progresso Geral</strong></div>
          <div style={{ fontWeight: 700 }}>{overallProgress()}%</div>
        </div>
        <div style={{ height: 10, background: '#eee', borderRadius: 6, overflow: 'hidden', marginTop: 6 }}>
          <div style={{ width: `${overallProgress()}%`, height: '100%', background: '#1976d2' }} />
        </div>
        {showMoveConfirm && (
          <div style={{ marginTop: 10, padding: 10, background: '#fff7e6', border: '1px solid #ffd08a', borderRadius: 6 }}>
            <div style={{ marginBottom: 8 }}>Todas as etapas de execução estão com 100% de conclusão. Deseja mover o projeto para <strong>Monitoramento</strong>?</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowMoveConfirm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={moveToMonitoramento}>Sim, mover para Monitoramento</button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h4>Etapas</h4>
          <div>
            <button className="btn btn-primary btn-small" onClick={abrirAddEtapa}><i className="fa-solid fa-plus"></i> Adicionar Etapa</button>
          </div>
        </div>

        {etapas.length === 0 ? (
          <div style={{ color: '#666' }}>Nenhuma etapa cadastrada.</div>
        ) : (
          etapas.map((et, ei) => (
            <div key={ei} style={{ border: '1px solid #eee', padding: 10, borderRadius: 6, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{et.name}</strong>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontWeight: 700 }}>{progressoEtapa(et)}%</div>
                  <button className="btn btn-primary btn-small" onClick={() => abrirAddTarefa(ei)}><i className="fa-solid fa-plus"></i> Tarefa</button>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                {et.tasks.length === 0 ? (
                  <div style={{ color: '#888' }}>Nenhuma tarefa.</div>
                ) : (
                  <ul>
                    {et.tasks.map((t, ti) => (
                      <li key={ti} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input type="checkbox" checked={!!t.completed} onChange={() => toggleTask(ei, ti)} />
                          <span style={{ textDecoration: t.completed ? 'line-through' : 'none' }}>{t.title}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>{t.responsible || ''}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        {(!projeto || !(projeto as any).etapas || (Array.isArray((projeto as any).etapas) && (projeto as any).etapas.length === 0)) && (
          <div style={{ padding: 8, background: '#fff3f0', border: '1px solid #ffd2cc', borderRadius: 6, color: '#7a2a2a' }}>
            Nenhuma etapa encontrada no projeto (campo `etapas` vazio). Verifique se as etapas foram gravadas corretamente.
          </div>
        )}
        <div style={{ marginTop: 8 }}>
          <details>
            <summary style={{ cursor: 'pointer' }}>Mostrar dados brutos do projeto (para debug)</summary>
            <pre style={{ maxHeight: 240, overflow: 'auto', background: '#f7f7f7', padding: 8 }}>{JSON.stringify(projeto, null, 2)}</pre>
          </details>
        </div>
      </div>
    </div>
    
    {/* Modal para adicionar Etapa */}
    <Modal open={addEtapaOpen} title="Adicionar Etapa" onClose={() => setAddEtapaOpen(false)}>
      <div style={{ padding: 8 }}>
        <div className="form-group">
          <label className="form-label">Nome da Etapa</label>
          <input className="form-control" value={newEtapaName} onChange={e => setNewEtapaName(e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setAddEtapaOpen(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={confirmarAddEtapa}>Salvar</button>
        </div>
      </div>
    </Modal>

    {/* Modal para adicionar Tarefa */}
    <Modal open={addTaskOpen.open} title="Adicionar Tarefa" onClose={() => setAddTaskOpen({ open: false })}>
      <div style={{ padding: 8 }}>
        <div className="form-group">
          <label className="form-label">Título da Tarefa</label>
          <input className="form-control" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setAddTaskOpen({ open: false })}>Cancelar</button>
          <button className="btn btn-primary" onClick={confirmarAddTarefa}>Salvar</button>
        </div>
      </div>
    </Modal>
    </>
  );
};

export default ExecucaoPage;
