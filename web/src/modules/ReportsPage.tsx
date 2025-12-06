import React, { useEffect, useMemo, useState } from 'react';

export const ReportsPage: React.FC = () => {
  const [dash, setDash] = useState<any>();
  const [riscos, setRiscos] = useState<any[]>([]);
  const [sortMatriz, setSortMatriz] = useState<'count-desc'|'count-asc'|'name-asc'|'name-desc'>('count-desc');
  const [sortStatus, setSortStatus] = useState<'count-desc'|'count-asc'|'name-asc'|'name-desc'>('count-desc');
  const [sortPI, setSortPI] = useState<'count-desc'|'count-asc'|'name-asc'|'name-desc'>('count-desc');
  useEffect(() => {
    fetch('/api/relatorios/dashboard').then(r=>r.json()).then(setDash);
    fetch('/api/riscos').then(r=>r.json()).then(setRiscos);
  }, []);
  const porMatriz = useMemo(() => {
    const map: Record<string, number> = {};
    riscos.forEach(r => { const k = r.matriz || 'N/A'; map[k] = (map[k]||0) + 1; });
    const total = riscos.length || 1;
    const arr = Object.entries(map).map(([matriz, count]) => ({ matriz, count, pct: Math.round((count/total)*100) }));
    return arr.sort((a,b) => sortMatriz==='count-desc' ? b.count-a.count : sortMatriz==='count-asc' ? a.count-b.count : sortMatriz==='name-asc' ? a.matriz.localeCompare(b.matriz) : b.matriz.localeCompare(a.matriz));
  }, [riscos, sortMatriz]);
  const porStatus = useMemo(() => {
    const map: Record<string, number> = {};
    riscos.forEach(r => { const k = r.status || 'N/A'; map[k] = (map[k]||0) + 1; });
    const total = riscos.length || 1;
    const arr = Object.entries(map).map(([status, count]) => ({ status, count, pct: Math.round((count/total)*100) }));
    return arr.sort((a,b) => sortStatus==='count-desc' ? b.count-a.count : sortStatus==='count-asc' ? a.count-b.count : sortStatus==='name-asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status));
  }, [riscos, sortStatus]);
  const porProbImpacto = useMemo(() => {
    const map: Record<string, number> = {};
    riscos.forEach(r => { const k = `${r.probabilidade || 'N/A'} / ${r.impacto || 'N/A'}`; map[k] = (map[k]||0) + 1; });
    const total = riscos.length || 1;
    const arr = Object.entries(map).map(([combo, count]) => ({ combo, count, pct: Math.round((count/total)*100) }));
    return arr.sort((a,b) => sortPI==='count-desc' ? b.count-a.count : sortPI==='count-asc' ? a.count-b.count : sortPI==='name-asc' ? a.combo.localeCompare(b.combo) : b.combo.localeCompare(a.combo));
  }, [riscos, sortPI]);
  return (
    <div>
      <div className="screen-header">
        <h2><i className="fa-solid fa-chart-line"></i> Relatórios</h2>
        <div className="form-actions">
          <button className="btn-outline" onClick={()=>window.print()}><i className="fa-solid fa-file-pdf"></i> Exportar PDF (MVP)</button>
        </div>
      </div>
      <div className="card">
        <h2>Relatórios e Dashboard</h2>
      </div>
      {dash && (
        <div className="kanban-container">
          <div className="card">
            <div>Riscos em Aberto</div>
            <strong>{dash.riscosAberto}</strong>
          </div>
          <div className="card">
            <div>Projetos em Execução</div>
            <strong>{dash.projetosExecucao}</strong>
          </div>
          <div className="card">
            <div>Empresas</div>
            <strong>{dash.empresas}</strong>
          </div>
          <div className="card">
            <div>Colaboradores</div>
            <strong>{dash.colaboradores}</strong>
          </div>
        </div>
      )}
      {porMatriz.length > 0 && (
        <div className="card">
          <h3>Riscos por Matriz</h3>
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{cursor:'pointer'}} onClick={()=>setSortMatriz(s=> s==='name-asc' ? 'name-desc' : 'name-asc')}>Matriz <i className={`fa-solid ${sortMatriz.startsWith('name-') ? (sortMatriz==='name-asc'?'fa-arrow-down-short-wide':'fa-arrow-down-wide-short'):'fa-arrow-down-up-across'}`}></i></th>
                  <th style={{cursor:'pointer'}} onClick={()=>setSortMatriz(s=> s==='count-desc' ? 'count-asc' : 'count-desc')}>Quantidade <i className={`fa-solid ${sortMatriz.startsWith('count-') ? (sortMatriz==='count-desc'?'fa-arrow-down-wide-short':'fa-arrow-down-short-wide'):'fa-arrow-down-up-across'}`} title="Ordenar por quantidade"></i></th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {porMatriz.map(row => (
                  <tr key={row.matriz}>
                    <td>{row.matriz}</td>
                    <td>{row.count}</td>
                    <td>{row.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {porStatus.length > 0 && (
        <div className="card">
          <h3>Riscos por Status</h3>
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{cursor:'pointer'}} onClick={()=>setSortStatus(s=> s==='name-asc' ? 'name-desc' : 'name-asc')}>Status <i className={`fa-solid ${sortStatus.startsWith('name-') ? (sortStatus==='name-asc'?'fa-arrow-down-short-wide':'fa-arrow-down-wide-short'):'fa-arrow-down-up-across'}`}></i></th>
                  <th style={{cursor:'pointer'}} onClick={()=>setSortStatus(s=> s==='count-desc' ? 'count-asc' : 'count-desc')}>Quantidade <i className={`fa-solid ${sortStatus.startsWith('count-') ? (sortStatus==='count-desc'?'fa-arrow-down-wide-short':'fa-arrow-down-short-wide'):'fa-arrow-down-up-across'}`} title="Ordenar por quantidade"></i></th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {porStatus.map(row => (
                  <tr key={row.status}>
                    <td>{row.status}</td>
                    <td>{row.count}</td>
                    <td>{row.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {porProbImpacto.length > 0 && (
        <div className="card">
          <h3>Riscos por Probabilidade x Impacto</h3>
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{cursor:'pointer'}} onClick={()=>setSortPI(s=> s==='name-asc' ? 'name-desc' : 'name-asc')}>Prob/Impacto <i className={`fa-solid ${sortPI.startsWith('name-') ? (sortPI==='name-asc'?'fa-arrow-down-short-wide':'fa-arrow-down-wide-short'):'fa-arrow-down-up-across'}`}></i></th>
                  <th style={{cursor:'pointer'}} onClick={()=>setSortPI(s=> s==='count-desc' ? 'count-asc' : 'count-desc')}>Quantidade <i className={`fa-solid ${sortPI.startsWith('count-') ? (sortPI==='count-desc'?'fa-arrow-down-wide-short':'fa-arrow-down-short-wide'):'fa-arrow-down-up-across'}`} title="Ordenar por quantidade"></i></th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {porProbImpacto.map(row => (
                  <tr key={row.combo}>
                    <td>{row.combo}</td>
                    <td>{row.count}</td>
                    <td>{row.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
