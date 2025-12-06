import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { badgeStyle, statusBadge, probBadge, impactoBadge } from '../utils/badges';
import { useToast } from '../components/Toast';

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
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try { const list = await api.riscos(); setRiscos(list); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: RiscoRow['status']) => {
    try { await api.updateRisco(id, { status }); toast.show('Situação atualizada', 'success'); load(); }
    catch { toast.show('Erro ao atualizar', 'error'); }
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
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {riscos.map(r => (
            <tr key={r.id}>
              <td>{r.titulo}</td>
              <td>{(() => { const c = statusBadge(r.status); return <span className="badge" style={badgeStyle(c.bg, c.fg)}>{r.status}</span>; })()}</td>
              <td>{(() => { const c = probBadge(r.probabilidade); return <span className="badge" style={badgeStyle(c.bg, c.fg)}>{r.probabilidade}</span>; })()}</td>
              <td>{(() => { const c = impactoBadge(r.impacto); return <span className="badge" style={badgeStyle(c.bg, c.fg)}>{r.impacto}</span>; })()}</td>
              <td>
                <select value={r.status} onChange={e=>updateStatus(r.id, e.target.value as any)}>
                  <option>Aberto</option>
                  <option>Mitigando</option>
                  <option>Encerrado</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};
