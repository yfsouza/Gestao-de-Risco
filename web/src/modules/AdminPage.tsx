import React, { useEffect, useState } from 'react';
import { AppState, Empresa, Colaborador, StakeholdersGrupo } from './App';

export const AdminPage: React.FC<{ base: AppState; setBase: (s: AppState)=>void }> = ({ base, setBase }) => {
  const [emp, setEmp] = useState('');
  const [col, setCol] = useState({ nome: '', email: '', empresaId: '' });
  const [grp, setGrp] = useState({ nome: '', emails: '' });

  const reload = () => Promise.all([
    fetch('/api/empresas').then(r=>r.json()),
    fetch('/api/colaboradores').then(r=>r.json()),
    fetch('/api/stakeholders-grupos').then(r=>r.json())
  ]).then(([empresas, colaboradores, stakeholdersGrupos]) => setBase({ empresas, colaboradores, stakeholdersGrupos }));

  useEffect(() => { reload(); }, []);

  const addEmpresa = async () => {
    const e: Empresa = { id: `EMP${Date.now()}`, nome: emp };
    await fetch('/api/empresas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
    setEmp(''); reload();
  };
  const addColab = async () => {
    const c: Colaborador = { id: `COL${Date.now()}`, ...col } as any;
    await fetch('/api/colaboradores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
    setCol({ nome: '', email: '', empresaId: '' }); reload();
  };
  const addGrupo = async () => {
    const g: StakeholdersGrupo = { id: `STK${Date.now()}`, nome: grp.nome, emails: grp.emails.split(',').map(s=>s.trim()).filter(Boolean) };
    await fetch('/api/stakeholders-grupos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(g) });
    setGrp({ nome: '', emails: '' }); reload();
  };

  return (
    <div>
      <div className="screen-header">
        <h2><i className="fa-solid fa-gear"></i> Admin</h2>
        <div className="form-actions">
          <button className="btn-outline" onClick={reload}><i className="fa-solid fa-rotate"></i> Atualizar cadastros</button>
        </div>
      </div>
      <div className="card">
        <h2>Cadastros Administrativos</h2>
      </div>
      <div className="kanban-container">
        <div className="card">
          <h3>Empresas</h3>
          <div className="filters">
            <input placeholder="Nome" value={emp} onChange={e=>setEmp(e.target.value)} />
            <button onClick={addEmpresa}>Salvar</button>
          </div>
          <div className="table-responsive">
            <table className="app-table">
              <thead><tr><th>Nome</th></tr></thead>
              <tbody>{base.empresas.map(e=>(<tr key={e.id}><td>{e.nome}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>Colaboradores</h3>
          <div className="filters">
            <input placeholder="Nome" value={col.nome} onChange={e=>setCol({ ...col, nome: e.target.value })} />
            <input placeholder="Email" value={col.email} onChange={e=>setCol({ ...col, email: e.target.value })} />
            <select value={col.empresaId} onChange={e=>setCol({ ...col, empresaId: e.target.value })}>
              <option value="">Empresa</option>
              {base.empresas.map(e=>(<option key={e.id} value={e.id}>{e.nome}</option>))}
            </select>
            <button onClick={addColab}>Salvar</button>
          </div>
          <div className="table-responsive">
            <table className="app-table">
              <thead><tr><th>Nome</th><th>Email</th></tr></thead>
              <tbody>{base.colaboradores.map(c=>(<tr key={c.id}><td>{c.nome}</td><td>{c.email}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>Grupos de Stakeholders</h3>
          <div className="filters">
            <input placeholder="Nome" value={grp.nome} onChange={e=>setGrp({ ...grp, nome: e.target.value })} />
            <input placeholder="Emails (separados por vírgula)" value={grp.emails} onChange={e=>setGrp({ ...grp, emails: e.target.value })} />
            <button onClick={addGrupo}>Salvar</button>
          </div>
          <div className="table-responsive">
            <table className="app-table">
              <thead><tr><th>Nome</th><th>Emails</th></tr></thead>
              <tbody>{base.stakeholdersGrupos.map(g=>(<tr key={g.id}><td>{g.nome}</td><td>{g.emails.join(', ')}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
