import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Empresa, Colaborador, StakeholdersGrupo } from './App';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

export const AdminPage: React.FC<{ base: AppState; setBase: (s: AppState)=>void }> = ({ base, setBase }) => {
  const toast = useToast();
  const [screen, setScreen] = useState<'empresas'|'colaboradores'|'grupos'|'stakeholders'>('stakeholders');
  const [emp, setEmp] = useState('');
  const [col, setCol] = useState({ nome: '', email: '', empresaId: '' });
  const [grp, setGrp] = useState({ nome: '', descricao: '' });
  const [stk, setStk] = useState({ nome: '', setor: '', email: '', telefone: '' });
  const [stkList, setStkList] = useState<{ id: string; nome: string; setor?: string; email?: string; telefone?: string }[]>([]);
  const [pessoaTipo, setPessoaTipo] = useState<'todos'|'internos'|'externos'>('externos');
  const [cats, setCats] = useState<{ id: string; nome: string; descricao?: string }[]>([]);
  const [riskCats, setRiskCats] = useState<{ id: string; nome: string; descricao?: string }[]>([]);
  const [filter, setFilter] = useState('');
  const [sortEmpAsc, setSortEmpAsc] = useState(true);
  const [sortStkAsc, setSortStkAsc] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editType, setEditType] = useState<'empresa'|'colaborador'|'grupo'|'stakeholder'|null>(null);
  const [editData, setEditData] = useState<any>(null);

  const reload = () => Promise.all([
    fetch('/api/empresas').then(r=>r.json()),
    fetch('/api/colaboradores').then(r=>r.json()),
    fetch('/api/stakeholders-grupos').then(r=>r.json())
  ]).then(([empresas, colaboradores, stakeholdersGrupos]) => setBase({ empresas, colaboradores, stakeholdersGrupos }));

  useEffect(() => { reload(); api.stakeholdersPessoas().then(setStkList).catch(()=>{}); fetch('/api/categorias').then(r=>r.json()).then(setCats).catch(()=>{}); fetch('/api/categorias-risco').then(r=>r.json()).then(setRiskCats).catch(()=>{}); }, []);

  const addEmpresa = async () => {
    const e: Empresa = { id: `EMP${Date.now()}`, nome: emp };
    await fetch('/api/empresas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
    setEmp(''); reload();
    toast.show('Empresa cadastrada com sucesso!', 'success');
  };
  const deleteEmpresa = async (id: string) => { await fetch(`/api/empresas/${id}`, { method: 'DELETE' }); reload(); toast.show('Empresa excluída.', 'success'); };
  const openEditEmpresa = (e: Empresa) => { setEditType('empresa'); setEditData({ ...e }); setEditOpen(true); };
  const addColab = async () => {
    const c: Colaborador = { id: `COL${Date.now()}`, ...col } as any;
    await fetch('/api/colaboradores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
    setCol({ nome: '', email: '', empresaId: '' }); reload();
    toast.show('Colaborador cadastrado com sucesso!', 'success');
  };
  const deleteColab = async (id: string) => { await fetch(`/api/colaboradores/${id}`, { method: 'DELETE' }); reload(); toast.show('Colaborador excluído.', 'success'); };
  const openEditColab = (c: Colaborador) => { setEditType('colaborador'); setEditData({ ...c }); setEditOpen(true); };
  const addGrupo = async () => {
    const g: any = { id: `STK${Date.now()}`, nome: grp.nome, descricao: grp.descricao, participantesColabIds: [], participantesStakeIds: [], fechado: false };
    await fetch('/api/stakeholders-grupos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(g) });
    setGrp({ nome: '', descricao: '' }); reload();
    toast.show('Grupo criado com sucesso!', 'success');
  };
  const deleteGrupo = async (id: string) => { await fetch(`/api/stakeholders-grupos/${id}`, { method: 'DELETE' }); reload(); toast.show('Grupo excluído.', 'success'); };
  const openEditGrupo = (g: any) => { setEditType('grupo'); setEditData({ ...g }); setEditOpen(true); };

  const addStakeholder = async () => {
    const s = { id: `STKP${Date.now()}`, ...stk };
    await api.addStakeholderPessoa(s);
    setStk({ nome: '', setor: '', email: '', telefone: '' });
    api.stakeholdersPessoas().then(setStkList).catch(()=>{});
    toast.show('Stakeholder cadastrado com sucesso!', 'success');
  };
  const deleteStakeholder = async (id: string) => { await api.deleteStakeholderPessoa(id); api.stakeholdersPessoas().then(setStkList).catch(()=>{}); toast.show('Stakeholder excluído.', 'success'); };
  const openEditStakeholder = (s: any) => { setEditType('stakeholder'); setEditData({ ...s }); setEditOpen(true); };

  const saveEdit = async () => {
    if (!editType || !editData) return;
    try {
      if (editType === 'empresa') {
        await deleteEmpresa(editData.id);
        const e: Empresa = { id: editData.id, nome: editData.nome };
        await fetch('/api/empresas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
        await reload();
        toast.show('Empresa atualizada com sucesso!', 'success');
      } else if (editType === 'colaborador') {
        const c: Partial<Colaborador> = { nome: editData.nome, email: editData.email, empresaId: editData.empresaId } as any;
        await fetch(`/api/colaboradores/${editData.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
        await reload();
        toast.show('Colaborador atualizado com sucesso!', 'success');
      } else if (editType === 'grupo') {
        await deleteGrupo(editData.id);
        const g: StakeholdersGrupo = { id: editData.id, nome: editData.nome, emails: (editData.emailsText||'').split(',').map((s:string)=>s.trim()).filter(Boolean) };
        await fetch('/api/stakeholders-grupos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(g) });
        await reload();
        toast.show('Grupo atualizado com sucesso!', 'success');
      } else if (editType === 'stakeholder') {
        const s = { nome: editData.nome, setor: editData.setor, email: editData.email, telefone: editData.telefone };
        await fetch(`/api/stakeholders/${editData.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
        await api.stakeholdersPessoas().then(setStkList).catch(()=>{});
        toast.show('Stakeholder atualizado com sucesso!', 'success');
      }
      setEditOpen(false);
      setEditType(null);
      setEditData(null);
    } catch (e) {
      toast.show('Falha ao salvar alterações.', 'error');
    }
  };

  const empresasView = useMemo(() => {
    const term = filter.toLowerCase();
    const filtered = base.empresas.filter(e => (e.nome||'').toLowerCase().includes(term));
    const sorted = [...filtered].sort((a,b) => (a.nome||'').localeCompare(b.nome||''));
    return sortEmpAsc ? sorted : sorted.reverse();
  }, [base.empresas, filter, sortEmpAsc]);
  const colaboradoresView = useMemo(() => base.colaboradores.filter(c => (c.nome+' '+c.email).toLowerCase().includes(filter.toLowerCase())), [base.colaboradores, filter]);
  const gruposView = useMemo(() => base.stakeholdersGrupos.filter((g:any) => (g.nome+' '+(g.descricao||'')).toLowerCase().includes(filter.toLowerCase())), [base.stakeholdersGrupos, filter]);
  const stakeholdersView = useMemo(() => stkList.filter(s => (s.nome+' '+(s.setor||'')+' '+(s.email||'')+' '+(s.telefone||'')).toLowerCase().includes(filter.toLowerCase())), [stkList, filter]);
  const pessoasView = useMemo(() => {
    const externos = stkList.map(s => ({ ...s, __isInterno: false })) as any[];
    const internos = (base.colaboradores||[]).map(c => ({ id: c.id, nome: c.nome, setor: (c as any).departamento || '', email: c.email, telefone: '', __isInterno: true, __col: c })) as any[];
    let all: any[] = [];
    if (pessoaTipo === 'externos') all = externos;
    else if (pessoaTipo === 'internos') all = internos;
    else all = [...internos, ...externos];
    const term = filter.toLowerCase();
    return all.filter(s => (s.nome+' '+(s.setor||'')+' '+(s.email||'')+' '+(s.telefone||'')).toLowerCase().includes(term));
  }, [stkList, base.colaboradores, filter, pessoaTipo]);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [participantsGroup, setParticipantsGroup] = useState<any>(null);
  const [selCols, setSelCols] = useState<string[]>([]);
  const [selStks, setSelStks] = useState<string[]>([]);
  const openParticipants = (g:any) => { setParticipantsGroup(g); setSelCols((g as any).participantesColabIds||[]); setSelStks((g as any).participantesStakeIds||[]); setParticipantsOpen(true); };
  const saveParticipants = async () => {
    if (!participantsGroup) return;
    await fetch(`/api/stakeholders-grupos/${participantsGroup.id}/participantes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ colaboradoresIds: selCols, stakeholdersIds: selStks }) });
    await fetch(`/api/stakeholders-grupos/${participantsGroup.id}/fechar`, { method: 'POST' });
    setParticipantsOpen(false); setParticipantsGroup(null);
    reload();
  };

  return (
    <div className="config-container">
      <div className="screen-header" style={{ justifyContent: 'center' }}>
        <div className="form-actions"></div>
      </div>
      <div className="card" style={{ padding: '0', marginTop: 4, overflow: 'hidden' }}>
        <nav style={{ display:'flex', alignItems:'center', gap: 0, borderBottom: '1px solid #e0e0e0', background: '#fafafa' }}>
          {[
            { key: 'stakeholders', icon: 'fa-user', label: 'Pessoa' },
            { key: 'grupos', icon: 'fa-users', label: 'Grupo' },
            { key: 'empresas', icon: 'fa-building', label: 'Empresa' },
            { key: 'categorias', icon: 'fa-tags', label: 'Categoria' },
            { key: 'categoriasRisco', icon: 'fa-layer-group', label: 'Categoria do Risco' },
          ].map(item => (
            <button
              key={item.key}
              onClick={()=>setScreen(item.key as any)}
              style={{
                appearance: 'none',
                border: 'none',
                background: 'transparent',
                padding: '8px 12px',
                fontSize: '12px',
                color: screen===item.key ? '#2b98e3' : '#333',
                borderBottom: screen===item.key ? '2px solid #2b98e3' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              <i className={`fa-solid ${item.icon}`} style={{ marginRight: 6 }}></i>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      {/* Filtro removido: grids passam a ter busca/ordenar próprias */}

      {screen === 'empresas' && (
        <div className="card config-card" style={{ padding: 0, overflow: 'hidden', marginTop: 4 }}>
          <div className="config-header" style={{ padding: '20px 24px' }}>
            <h3><i className="fas fa-building"></i> Cadastro de Empresa</h3>
            <p>Preencha os dados para cadastrar a empresa</p>
          </div>
          <div className="form-compact" style={{ padding: 20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
              <strong style={{ fontSize: 16 }}>Empresas cadastradas</strong>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn-outline" onClick={reload}><i className="fa-solid fa-rotate"></i> Atualizar</button>
                <button onClick={()=>setEditData({ ...(editData||{}), __showEmpresaForm: true })}><i className="fa-solid fa-plus"></i> Novo Cadastro</button>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
              <input
                placeholder="Pesquisar por nome"
                value={filter}
                onChange={e=>setFilter(e.target.value)}
                style={{ height: 24, fontSize: 12, padding: '2px 6px', width: 240 }}
              />
            </div>
            <div className="table-responsive" style={{ marginBottom: 16 }}>
              <table className="app-table">
                <thead>
                  <tr>
                    <th
                      onClick={()=>{ setSortEmpAsc(!sortEmpAsc); }}
                      style={{ cursor:'pointer', userSelect: 'none' }}
                    >
                      <i className={`fa-solid ${sortEmpAsc ? 'fa-arrow-up-a-z' : 'fa-arrow-down-a-z'}`} style={{ marginRight: 6 }}></i> Nome
                    </th>
                    <th style={{ width: 120 }}></th>
                  </tr>
                </thead>
                <tbody>{empresasView.map(e=>(
                  <tr key={e.id}>
                    <td>{e.nome}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-outline" onClick={()=>openEditEmpresa(e)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                      <button className="btn-outline" onClick={()=>deleteEmpresa(e.id)} title="Excluir"><i className="fa-solid fa-trash"></i></button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            {editData?.__showEmpresaForm && (
            <form onSubmit={async (e)=>{
              e.preventDefault();
              const razao = (editData?.__empresa_razao||'').trim();
              if (!razao) { alert('Informe a Razão Social.'); return; }
              try {
                await fetch('/api/empresas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `EMP${Date.now()}`, nome: razao }) });
                await reload();
                toast.show('Empresa cadastrada com sucesso!', 'success');
                setEditData({ ...(editData||{}), __showEmpresaForm: false, __empresa_razao: '', __empresa_fantasia: '', __empresa_cnpj: '', __empresa_ie: '', __empresa_ramo: '', __empresa_porte: '', __empresa_email: '', __empresa_tel: '', __empresa_cel: '', __empresa_site: '', __empresa_end: '', __empresa_num: '', __empresa_comp: '', __empresa_bairro: '', __empresa_cidade: '', __empresa_estado: '', __empresa_cep: '', __empresa_obs: '' });
              } catch { toast.show('Falha ao cadastrar empresa.', 'error'); }
            }}>
              <div className="company-icon" style={{ textAlign: 'center', marginBottom: 20, color: '#3498db' }}>
                <i className="fas fa-landmark" style={{ fontSize: 48, backgroundColor: '#f8f9fa', padding: 20, borderRadius: '50%' }}></i>
              </div>
              <div className="form-group">
                <label>Razão Social</label>
                <input type="text" value={editData?.__empresa_razao||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_razao: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Nome Fantasia</label>
                <input type="text" value={editData?.__empresa_fantasia||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_fantasia: e.target.value })} />
              </div>
              <div className="form-row" style={{ display:'flex', flexWrap:'wrap', gap:20, marginBottom:20 }}>
                <div className="form-group" style={{ flex:1, minWidth:200 }}>
                  <label>CNPJ</label>
                  <input type="text" value={editData?.__empresa_cnpj||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
                </div>
                <div className="form-group" style={{ flex:1, minWidth:200 }}>
                  <label>Inscrição Estadual</label>
                  <input type="text" value={editData?.__empresa_ie||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_ie: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Ramo de Atividade</label>
                <select value={editData?.__empresa_ramo||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_ramo: e.target.value })}>
                  <option value="">Selecione o ramo de atividade</option>
                  <option value="tecnologia">Tecnologia da Informação</option>
                  <option value="comercio">Comércio</option>
                  <option value="industria">Indústria</option>
                  <option value="servicos">Serviços</option>
                  <option value="construcao">Construção Civil</option>
                  <option value="saude">Saúde</option>
                  <option value="educacao">Educação</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="form-group">
                <label>Porte da Empresa</label>
                <select value={editData?.__empresa_porte||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_porte: e.target.value })}>
                  <option value="">Selecione o porte</option>
                  <option value="mei">MEI</option>
                  <option value="me">ME</option>
                  <option value="epp">EPP</option>
                  <option value="media">Média</option>
                  <option value="grande">Grande</option>
                </select>
              </div>
              <div className="form-group">
                <label>E-mail Corporativo</label>
                <input type="email" value={editData?.__empresa_email||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_email: e.target.value })} />
              </div>
              <div className="form-row" style={{ display:'flex', flexWrap:'wrap', gap:20, marginBottom:20 }}>
                <div className="form-group" style={{ flex:1, minWidth:200 }}>
                  <label>Telefone</label>
                  <input type="tel" value={editData?.__empresa_tel||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_tel: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex:1, minWidth:200 }}>
                  <label>Celular</label>
                  <input type="tel" value={editData?.__empresa_cel||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_cel: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Site</label>
                <input type="url" value={editData?.__empresa_site||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_site: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Endereço</label>
                <input type="text" value={editData?.__empresa_end||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_end: e.target.value })} />
              </div>
              <div className="form-row" style={{ display:'flex', flexWrap:'wrap', gap:20, marginBottom:20 }}>
                <div className="form-group" style={{ flex:1, minWidth:200 }}>
                  <label>Número</label>
                  <input type="text" value={editData?.__empresa_num||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_num: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex:1, minWidth:200 }}>
                  <label>Complemento</label>
                  <input type="text" value={editData?.__empresa_comp||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_comp: e.target.value })} />
                </div>
              </div>
              <div className="form-row" style={{ display:'flex', flexWrap:'wrap', gap:20, marginBottom:20 }}>
                <div className="form-group" style={{ flex:1, minWidth:200 }}>
                  <label>Bairro</label>
                  <input type="text" value={editData?.__empresa_bairro||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_bairro: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex:1, minWidth:200 }}>
                  <label>Cidade</label>
                  <input type="text" value={editData?.__empresa_cidade||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_cidade: e.target.value })} />
                </div>
              </div>
              <div className="form-row" style={{ display:'flex', flexWrap:'wrap', gap:20, marginBottom:20 }}>
                <div className="form-group" style={{ flex:1, minWidth:200 }}>
                  <label>Estado</label>
                  <select value={editData?.__empresa_estado||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_estado: e.target.value })}>
                    <option value="">Selecione o estado</option>
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf=> (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex:1, minWidth:200 }}>
                  <label>CEP</label>
                  <input type="text" value={editData?.__empresa_cep||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_cep: e.target.value })} placeholder="00000-000" />
                </div>
              </div>
              <div className="form-group">
                <label>Observações</label>
                <textarea rows={3} value={editData?.__empresa_obs||''} onChange={e=>setEditData({ ...(editData||{}), __empresa_obs: e.target.value })}></textarea>
              </div>
              
              <div className="form-actions" style={{ display:'flex', justifyContent:'flex-end', gap: 12, marginTop: 16, paddingTop: 16, borderTop:'1px solid #eee' }}>
                <button type="button" className="btn-secondary" onClick={()=>setEditData({ ...(editData||{}), __showEmpresaForm: false })}>Cancelar</button>
                <button type="submit" className="btn-primary">Cadastrar Empresa</button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      {screen === 'colaboradores' && (
        <div className="card">
          <h3>Cadastro de Colaboradores</h3>
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
              <thead><tr><th>Nome</th><th>Email</th><th></th></tr></thead>
              <tbody>{colaboradoresView.map(c=>(
                <tr key={c.id}>
                  <td>{c.nome}</td><td>{c.email}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-outline" onClick={()=>openEditColab(c)} title="Editar"><i className="fa-solid fa-pen"></i></button>
                    <button className="btn-outline" onClick={()=>deleteColab(c.id)} title="Excluir"><i className="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {screen === 'grupos' && (
        <div className="card config-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="config-header">
            <h3><i className="fas fa-users"></i> Cadastro de Grupos de Stakeholders</h3>
            <p>Crie e gerencie grupos e participantes</p>
          </div>
          <div className="form-compact" style={{ padding: 10 }}>
            <div className="form-row">
              <div className="form-group">
                <label>Nome</label>
                <input placeholder="Nome" value={grp.nome} onChange={e=>setGrp({ ...grp, nome: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Descrição do grupo</label>
                <input placeholder="Descrição do grupo" value={grp.descricao} onChange={e=>setGrp({ ...grp, descricao: e.target.value })} />
              </div>
            </div>
            <div className="buttons">
              <button onClick={addGrupo} className="btn-primary btn-compact"><i className="fa-solid fa-save"></i> Salvar</button>
            </div>
          </div>
          <div className="cards form-compact" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px', marginTop: '8px' }}>
            {gruposView.map((g:any) => (
              <div key={g.id} className="card" style={{ padding: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{g.nome}</strong>
                  <button
                    className="badge"
                    style={{ background: g.fechado? '#2e7d32' : '#c62828', color: '#fff', padding: '2px 6px', borderRadius: 4, border: 'none', cursor: 'pointer' }}
                    onClick={async ()=>{
                      if (g.fechado) {
                        await fetch(`/api/stakeholders-grupos/${g.id}/abrir`, { method: 'POST' });
                      } else {
                        await fetch(`/api/stakeholders-grupos/${g.id}/fechar`, { method: 'POST' });
                      }
                      reload();
                    }}
                  >{g.fechado? 'Fechado' : 'Aberto'}</button>
                </div>
                <div style={{ marginTop: 6, color: '#555' }}>{(g as any).descricao}</div>
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  Participantes: Colaboradores {Array.isArray((g as any).participantesColabIds)? (g as any).participantesColabIds.length : 0}, Stakeholders {Array.isArray((g as any).participantesStakeIds)? (g as any).participantesStakeIds.length : 0}
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
                  <button onClick={()=>openParticipants(g)} disabled={!!g.fechado} style={{ fontSize: '13px', padding: '6px 8px' }}><i className="fa-solid fa-user-plus"></i> Adicionar participantes</button>
                  <button className="btn-outline" onClick={()=>openEditGrupo(g)} title="Editar" disabled={!!g.fechado} style={{ padding: '4px 8px' }}><i className="fa-solid fa-pen"></i></button>
                  <button className="btn-outline" onClick={()=>deleteGrupo(g.id)} title="Excluir" disabled={!!g.fechado} style={{ padding: '4px 8px' }}><i className="fa-solid fa-trash"></i></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {screen === 'stakeholders' && (
        <div className="card config-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="config-header">
            <h3><i className="fas fa-user-plus"></i> Sistema de Cadastro</h3>
            <p>Cadastre funcionários internos ou terceiros</p>
          </div>
          <div className="form-compact" style={{ padding: 10 }}>
            {!editData?.__showForm && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
                <strong style={{ fontSize: 14 }}>Cadastros realizados</strong>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>{ setEditData({ __tipo: 'funcionario', __showForm: true }); }} style={{ fontSize: '13px', padding: '6px 10px' }}><i className="fa-solid fa-plus"></i> Novo Cadastro</button>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 8 }}>
                <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
                  <input type="radio" name="filtroPessoa" checked={pessoaTipo==='externos'} onChange={()=>setPessoaTipo('externos')} /> Externos
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
                  <input type="radio" name="filtroPessoa" checked={pessoaTipo==='internos'} onChange={()=>setPessoaTipo('internos')} /> Internos
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
                  <input type="radio" name="filtroPessoa" checked={pessoaTipo==='todos'} onChange={()=>setPessoaTipo('todos')} /> Todos
                </label>
              </div>
              <div className="table-responsive" style={{ marginBottom: 10 }}>
                <table className="app-table" style={{ fontSize: '12px' }}>
                  <thead><tr><th>Nome</th><th>Setor</th><th>Email</th><th>Telefone</th><th style={{ width: 90 }}></th></tr></thead>
                  <tbody>
                    {pessoasView.map((s: any) => (
                      <tr key={s.id}>
                        <td>{s.nome}</td><td>{s.setor||''}</td><td>{s.email||''}</td><td>{s.telefone||''}</td>
                        <td style={{ textAlign:'right' }}>
                          {s.__isInterno ? (
                            <>
                              <button className="btn-outline" title="Editar" onClick={()=>openEditColab(s.__col)} style={{ padding: '3px 6px' }}><i className="fa-solid fa-pen"></i></button>
                            </>
                          ) : (
                            <>
                              <button className="btn-outline" title="Editar" onClick={()=>{
                                setEditData({ __showForm: true, __tipo: 'terceiro', __editId: s.id, __nome: s.nome||'', __email: s.email||'', __telefone: s.telefone||'', __area_atuacao: s.setor||'' });
                              }} style={{ padding: '3px 6px' }}><i className="fa-solid fa-pen"></i></button>
                              <button className="btn-outline" title="Excluir" onClick={()=>deleteStakeholder(s.id)} style={{ padding: '3px 6px' }}><i className="fa-solid fa-trash"></i></button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
            )}
            {/* Formulário abaixo aparece quando clicado em Novo Cadastro ou Editar */}
            {editData?.__showForm && (
            <div className="form-section" style={{ marginBottom: 6 }}>
              <div className="section-title" style={{ fontSize: 16, color: '#2c3e50', borderBottom: '2px solid #eaeaea', paddingBottom: 8, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><i className="fas fa-user-tag" style={{ marginRight: 10, color: '#3498db' }}></i> Tipo de Cadastro</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={(editData?.__tipo || 'funcionario') === 'funcionario'}
                      onChange={() => setEditData({ ...(editData||{}), __tipo: 'funcionario' })}
                      style={{ transform: 'scale(0.9)' }}
                    />
                    Funcionário Interno
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={(editData?.__tipo || 'funcionario') === 'terceiro'}
                      onChange={() => setEditData({ ...(editData||{}), __tipo: 'terceiro' })}
                      style={{ transform: 'scale(0.9)' }}
                    />
                    Terceiro / Stakeholder
                  </label>
                </div>
              </div>
            </div>
            )}

            {editData?.__showForm && (
            <form onSubmit={(e)=>{ e.preventDefault(); if (editData?.__tipo==='terceiro') {
              const payload = { nome: editData?.__nome||'', email: editData?.__email||'', telefone: editData?.__telefone||'', setor: editData?.__area_atuacao||'' } as any;
              const id = editData?.__editId as string | undefined;
              const req = id
                ? fetch(`/api/stakeholders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                : api.addStakeholderPessoa({ id: `STKP${Date.now()}`, ...payload });
              (req as Promise<any>).then(()=>{
                api.stakeholdersPessoas().then(setStkList).catch(()=>{});
                toast.show(id ? 'Stakeholder atualizado com sucesso!' : 'Terceiro/Stakeholder cadastrado com sucesso!', 'success');
                setEditData({ __tipo: 'funcionario', __showForm: false });
              }).catch(()=>{ toast.show('Falha ao salvar stakeholder.', 'error'); });
            } else {
              const empId = (editData?.__empresaId) || ((base.empresas && base.empresas[0] && base.empresas[0].id) ? base.empresas[0].id : 'EMP001');
              const novoCol: Colaborador = {
                id: `COL${Date.now()}`,
                nome: editData?.__nome||'',
                email: editData?.__email||'',
                empresaId: empId,
                departamento: editData?.__departamento||''
              } as any;
              fetch('/api/colaboradores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(novoCol) })
                .then(async ()=>{
                  if (editData?.__editId) { try { await api.deleteStakeholderPessoa(editData.__editId); } catch {} }
                  reload();
                  toast.show('Funcionário cadastrado com sucesso!', 'success');
                  setEditData({ __tipo: 'funcionario', __showForm: false });
                })
                .catch(()=>{ toast.show('Falha ao cadastrar funcionário.', 'error'); });
            } }}>
              <div className="form-section" style={{ marginBottom: 4 }}>
                <div className="section-title" style={{ fontSize: 15, color: '#2c3e50', borderBottom: '1px solid #eaeaea', paddingBottom: 6, marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                  <i className="fas fa-id-card" style={{ marginRight: 10, color: '#3498db' }}></i> Dados Pessoais
                </div>
                <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                    <label style={{ fontSize: 12, marginBottom: 4 }}>Nome Completo</label>
                    <input type="text" value={editData?.__nome||''} onChange={e=>setEditData({ ...(editData||{}), __nome: e.target.value })} style={{ height: 26, padding: '4px 6px', fontSize: 12 }} />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                    <label style={{ fontSize: 12, marginBottom: 4 }}>CPF/CNPJ</label>
                    <input type="text" value={editData?.__cpfcnpj||''} onChange={e=>setEditData({ ...(editData||{}), __cpfcnpj: e.target.value })} style={{ height: 26, padding: '4px 6px', fontSize: 12 }} />
                  </div>
                </div>
                <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                    <label style={{ fontSize: 12, marginBottom: 4 }}>E-mail</label>
                    <input type="email" value={editData?.__email||''} onChange={e=>setEditData({ ...(editData||{}), __email: e.target.value })} style={{ height: 26, padding: '4px 6px', fontSize: 12 }} />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                    <label style={{ fontSize: 12, marginBottom: 4 }}>Telefone</label>
                    <input type="tel" value={editData?.__telefone||''} onChange={e=>setEditData({ ...(editData||{}), __telefone: e.target.value })} style={{ height: 26, padding: '4px 6px', fontSize: 12 }} />
                  </div>
                </div>
              </div>

              {(!editData || editData.__tipo!=='terceiro') && (
                <div className="form-section" style={{ marginBottom: 4 }}>
                  <div className="section-title" style={{ fontSize: 15, color: '#2c3e50', borderBottom: '1px solid #eaeaea', paddingBottom: 6, marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                    <i className="fas fa-briefcase" style={{ marginRight: 10, color: '#3498db' }}></i> Dados do Funcionário
                  </div>
                  <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                      <label style={{ fontSize: 12, marginBottom: 4 }}>Empresa</label>
                      <select value={editData?.__empresaId||''} onChange={e=>setEditData({ ...(editData||{}), __empresaId: e.target.value })} style={{ height: 28, padding: '2px 6px', fontSize: 12 }}>
                        <option value="">Selecione uma empresa</option>
                        {base.empresas.map(e=> (<option key={e.id} value={e.id}>{e.nome}</option>))}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                      <label style={{ fontSize: 12, marginBottom: 4 }}>Departamento</label>
                      <select value={editData?.__departamento||''} onChange={e=>setEditData({ ...(editData||{}), __departamento: e.target.value })} style={{ height: 28, padding: '2px 6px', fontSize: 12 }}>
                        <option value="">Selecione um departamento</option>
                        <option value="ti">Tecnologia da Informação</option>
                        <option value="rh">Recursos Humanos</option>
                        <option value="financeiro">Financeiro</option>
                        <option value="vendas">Vendas</option>
                        <option value="marketing">Marketing</option>
                        <option value="operacoes">Operações</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                      <label style={{ fontSize: 12, marginBottom: 4 }}>Cargo</label>
                      <input type="text" value={editData?.__cargo||''} onChange={e=>setEditData({ ...(editData||{}), __cargo: e.target.value })} style={{ height: 26, padding: '4px 6px', fontSize: 12 }} />
                    </div>
                  </div>
                  <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                      <label style={{ fontSize: 12, marginBottom: 4 }}>Matrícula</label>
                      <input type="text" value={editData?.__matricula||''} onChange={e=>setEditData({ ...(editData||{}), __matricula: e.target.value })} style={{ height: 26, padding: '4px 6px', fontSize: 12 }} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                      <label style={{ fontSize: 12, marginBottom: 4 }}>Data de Admissão</label>
                      <input type="date" value={editData?.__admissao||''} onChange={e=>setEditData({ ...(editData||{}), __admissao: e.target.value })} style={{ height: 26, padding: '2px 6px', fontSize: 12 }} />
                    </div>
                  </div>
                  <div className="form-group-check" style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <input type="checkbox" checked={!!editData?.__acesso} onChange={e=>setEditData({ ...(editData||{}), __acesso: e.target.checked })} style={{ transform: 'scale(0.9)' }} />
                    <label style={{ marginLeft: 8 }}>Este funcionário precisa de acesso ao sistema</label>
                  </div>
                  {!!editData?.__acesso && (
                    <div>
                      <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                        <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                          <label style={{ fontSize: 12, marginBottom: 4 }}>Nome de Usuário</label>
                          <input type="text" value={editData?.__usuario||''} onChange={e=>setEditData({ ...(editData||{}), __usuario: e.target.value })} style={{ height: 26, padding: '4px 6px', fontSize: 12 }} />
                        </div>
                        <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                          <label style={{ fontSize: 12, marginBottom: 4 }}>Senha</label>
                          <input type="password" value={editData?.__senha||''} onChange={e=>setEditData({ ...(editData||{}), __senha: e.target.value })} style={{ height: 26, padding: '4px 6px', fontSize: 12 }} />
                        </div>
                      </div>
                      <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                        <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                          <label style={{ fontSize: 12, marginBottom: 4 }}>Perfil de Acesso</label>
                          <select value={editData?.__perfil||''} onChange={e=>setEditData({ ...(editData||{}), __perfil: e.target.value })} style={{ height: 28, padding: '2px 6px', fontSize: 12 }}>
                            <option value="">Selecione um perfil</option>
                            <option value="admin">Administrador</option>
                            <option value="gestor">Gestor</option>
                            <option value="colaborador">Colaborador</option>
                            <option value="consultor">Consultor</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {editData?.__tipo==='terceiro' && (
                <div className="form-section" style={{ marginBottom: 4 }}>
                  <div className="section-title" style={{ fontSize: 15, color: '#2c3e50', borderBottom: '1px solid #eaeaea', paddingBottom: 6, marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                    <i className="fas fa-building" style={{ marginRight: 10, color: '#3498db' }}></i> Dados do Terceiro / Stakeholder
                  </div>
                  <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                      <label className="required" style={{ fontSize: 12, marginBottom: 4 }}>Empresa</label>
                      <input type="text" value={editData?.__empresa||''} onChange={e=>setEditData({ ...(editData||{}), __empresa: e.target.value })} style={{ height: 26, padding: '4px 6px', fontSize: 12 }} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                      <label className="required" style={{ fontSize: 12, marginBottom: 4 }}>Cargo/Função</label>
                      <input type="text" value={editData?.__cargo_terceiro||''} onChange={e=>setEditData({ ...(editData||{}), __cargo_terceiro: e.target.value })} style={{ height: 26, padding: '4px 6px', fontSize: 12 }} />
                    </div>
                  </div>
                  <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                      <label className="required" style={{ fontSize: 12, marginBottom: 4 }}>Tipo de Stakeholder</label>
                      <select value={editData?.__tipo_terceiro||''} onChange={e=>setEditData({ ...(editData||{}), __tipo_terceiro: e.target.value })} style={{ height: 28, padding: '2px 6px', fontSize: 12 }}>
                        <option value="">Selecione um tipo</option>
                        <option value="fornecedor">Fornecedor</option>
                        <option value="cliente">Cliente</option>
                        <option value="parceiro">Parceiro</option>
                        <option value="consultor">Consultor Externo</option>
                        <option value="investidor">Investidor</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                      <label className="required" style={{ fontSize: 12, marginBottom: 4 }}>Área de Atuação</label>
                      <input type="text" placeholder="Ex: Tecnologia, Consultoria, etc." value={editData?.__area_atuacao||''} onChange={e=>setEditData({ ...(editData||{}), __area_atuacao: e.target.value })} style={{ height: 26, padding: '4px 6px', fontSize: 12 }} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 8 }}>
                    <label className="required">Nível de Influência</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                      {['alta','media','baixa'].map(n=> (
                        <label key={n} style={{ flex: 1, minWidth: 110, padding: 8, textAlign: 'center', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: editData?.__influencia===n? '#3498db' : 'transparent', color: editData?.__influencia===n? '#fff' : 'inherit' }} onClick={()=>setEditData({ ...(editData||{}), __influencia: n })}>{n[0].toUpperCase()+n.slice(1)}</label>
                      ))}
                    </div>
                  </div>
                  <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                      <label style={{ fontSize: 12, marginBottom: 4 }}>Interesse no Projeto/Organização</label>
                      <select value={editData?.__interesse||''} onChange={e=>setEditData({ ...(editData||{}), __interesse: e.target.value })} style={{ height: 28, padding: '2px 6px', fontSize: 12 }}>
                        <option value="">Selecione o nível de interesse</option>
                        <option value="alto">Alto Interesse</option>
                        <option value="medio">Interesse Médio</option>
                        <option value="baixo">Baixo Interesse</option>
                        <option value="varia">Varia conforme o projeto</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                      <label style={{ fontSize: 12, marginBottom: 4 }}>Poder de Decisão</label>
                      <select value={editData?.__poder||''} onChange={e=>setEditData({ ...(editData||{}), __poder: e.target.value })} style={{ height: 28, padding: '2px 6px', fontSize: 12 }}>
                        <option value="">Selecione o poder de decisão</option>
                        <option value="alto">Alto Poder</option>
                        <option value="medio">Poder Médio</option>
                        <option value="baixo">Baixo Poder</option>
                        <option value="nenhum">Sem poder de decisão</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#f8f9fa', borderLeft: '3px solid #3498db', padding: '6px 8px', marginTop: 6, fontSize: 12, color: '#555' }}>
                    <i className="fas fa-info-circle"></i> <strong>Importante:</strong> Os campos de stakeholder ajudam a classificar o nível de envolvimento e influência da pessoa externa.
                  </div>
                </div>
              )}

              <div className="buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 6, paddingTop: 6, borderTop: '1px solid #eee' }}>
                <button type="button" className="btn-cancel" onClick={()=>{ setEditData({ __tipo: 'funcionario', __showForm: false }); }} style={{ backgroundColor: '#e0e0e0', color: '#333', padding: '5px 8px', borderRadius: 6, fontSize: '12px' }}>Cancelar</button>
                <button type="submit" className="btn-submit" style={{ backgroundColor: '#2ecc71', color: '#fff', padding: '5px 8px', borderRadius: 6, fontSize: '12px' }}>Cadastrar</button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      {screen === 'categorias' && (
        <div className="card config-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="config-header">
            <h3><i className="fas fa-tags"></i> Cadastro de Categoria</h3>
            <p>Crie e edite categorias</p>
          </div>
          <div className="form-compact" style={{ padding: 10 }}>
            <div className="form-row">
              <div className="form-group">
                <label>Nome</label>
                <input placeholder="Nome" value={(editData?.__catNome)||''} onChange={e=>setEditData({ ...(editData||{}), __catNome: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <input placeholder="Descrição" value={(editData?.__catDesc)||''} onChange={e=>setEditData({ ...(editData||{}), __catDesc: e.target.value })} />
              </div>
            </div>
            <div className="buttons">
              <button onClick={async ()=>{
                const payload = { nome: editData?.__catNome||'', descricao: editData?.__catDesc||'' };
                await fetch('/api/categorias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                setEditData(null);
                fetch('/api/categorias').then(r=>r.json()).then(setCats).catch(()=>{});
              }} className="btn-primary btn-compact"><i className="fa-solid fa-save"></i> Salvar</button>
            </div>
          </div>
          <div className="cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px', marginTop: '8px' }}>
            {cats.map(c => (
              <div className="card" key={c.id} style={{ padding: '8px' }}>
                <strong>{c.nome}</strong>
                <div style={{ color: '#555', marginTop: 6 }}>{c.descricao}</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button className="btn-outline" title="Editar" onClick={()=>{ setEditType('categoria' as any); setEditData({ __editCat: c }); setEditOpen(true); }}><i className="fa-solid fa-pen"></i></button>
                  <button className="btn-outline" title="Excluir" onClick={async ()=>{ await fetch(`/api/categorias/${c.id}`, { method: 'DELETE' }); fetch('/api/categorias').then(r=>r.json()).then(setCats).catch(()=>{}); }}><i className="fa-solid fa-trash"></i></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {screen === 'categoriasRisco' && (
        <div className="card config-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="config-header">
            <h3><i className="fas fa-layer-group"></i> Cadastro de Categoria de Risco</h3>
            <p>Classifique tipos de risco</p>
          </div>
          <div className="form-compact" style={{ padding: 10 }}>
            <div className="form-row">
              <div className="form-group">
                <label>Nome</label>
                <input placeholder="Nome" value={(editData?.__catRN)||''} onChange={e=>setEditData({ ...(editData||{}), __catRN: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <input placeholder="Descrição" value={(editData?.__catRD)||''} onChange={e=>setEditData({ ...(editData||{}), __catRD: e.target.value })} />
              </div>
            </div>
            <div className="buttons">
              <button onClick={async ()=>{
                const payload = { nome: editData?.__catRN||'', descricao: editData?.__catRD||'' };
                await fetch('/api/categorias-risco', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                setEditData(null);
                fetch('/api/categorias-risco').then(r=>r.json()).then(setRiskCats).catch(()=>{});
              }} className="btn-primary btn-compact"><i className="fa-solid fa-save"></i> Salvar</button>
            </div>
          </div>
          <div className="cards form-compact" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px', marginTop: '8px' }}>
            {riskCats.map(c => (
              <div className="card" key={c.id} style={{ padding: '8px' }}>
                <strong>{c.nome}</strong>
                <div style={{ color: '#555', marginTop: 6 }}>{c.descricao}</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button className="btn-outline" title="Editar" onClick={()=>{ setEditType('categoriaRisco' as any); setEditData({ __editRiskCat: c }); setEditOpen(true); }}><i className="fa-solid fa-pen"></i></button>
                  <button className="btn-outline" title="Excluir" onClick={async ()=>{ await fetch(`/api/categorias-risco/${c.id}`, { method: 'DELETE' }); fetch('/api/categorias-risco').then(r=>r.json()).then(setRiskCats).catch(()=>{}); }}><i className="fa-solid fa-trash"></i></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <Modal open={editOpen} title={editType? `Editar ${editType}` : ''} onClose={()=>{ setEditOpen(false); setEditType(null); setEditData(null); }}
        footer={<>
          <button className="btn-outline" onClick={()=>{ setEditOpen(false); setEditType(null); setEditData(null); }}>Cancelar</button>
          <button onClick={saveEdit}>Salvar</button>
        </>}>
        {editType === 'empresa' && editData && (
          <div className="filters form-compact">
            <input placeholder="Nome" value={editData.nome||''} onChange={e=>setEditData({ ...editData, nome: e.target.value })} />
          </div>
        )}
        {editType === 'colaborador' && editData && (
          <div className="filters form-compact">
            <input placeholder="Nome" value={editData.nome||''} onChange={e=>setEditData({ ...editData, nome: e.target.value })} />
            <input placeholder="Email" value={editData.email||''} onChange={e=>setEditData({ ...editData, email: e.target.value })} />
            <select value={editData.empresaId||''} onChange={e=>setEditData({ ...editData, empresaId: e.target.value })}>
              <option value="">Empresa</option>
              {base.empresas.map(e=>(<option key={e.id} value={e.id}>{e.nome}</option>))}
            </select>
          </div>
        )}
        {editType === 'grupo' && editData && (
          <div className="filters form-compact">
            <input placeholder="Nome" value={editData.nome||''} onChange={e=>setEditData({ ...editData, nome: e.target.value })} />
            <input placeholder="Descrição" value={editData.descricao||''} onChange={e=>setEditData({ ...editData, descricao: e.target.value })} />
          </div>
        )}
        {editType === 'stakeholder' && editData && (
          <div className="filters form-compact">
            <input placeholder="Nome" value={editData.nome||''} onChange={e=>setEditData({ ...editData, nome: e.target.value })} />
            <input placeholder="Setor" value={editData.setor||''} onChange={e=>setEditData({ ...editData, setor: e.target.value })} />
            <input placeholder="Email" value={editData.email||''} onChange={e=>setEditData({ ...editData, email: e.target.value })} />
            <input placeholder="Telefone" value={editData.telefone||''} onChange={e=>setEditData({ ...editData, telefone: e.target.value })} />
          </div>
        )}
        {editType === ('categoria' as any) && editData?.__editCat && (
          <div className="filters form-compact">
            <input placeholder="Nome" value={editData.__editCat.nome||''} onChange={e=>setEditData({ __editCat: { ...editData.__editCat, nome: e.target.value } })} />
            <input placeholder="Descrição" value={editData.__editCat.descricao||''} onChange={e=>setEditData({ __editCat: { ...editData.__editCat, descricao: e.target.value } })} />
            <button onClick={async ()=>{
              // simples: delete + recreate
              await fetch(`/api/categorias/${editData.__editCat.id}`, { method: 'DELETE' });
              await fetch('/api/categorias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: editData.__editCat.nome, descricao: editData.__editCat.descricao }) });
              fetch('/api/categorias').then(r=>r.json()).then(setCats).catch(()=>{});
              setEditOpen(false); setEditType(null); setEditData(null);
            }}>Salvar alterações</button>
          </div>
        )}
        {editType === ('categoriaRisco' as any) && editData?.__editRiskCat && (
          <div className="filters form-compact">
            <input placeholder="Nome" value={editData.__editRiskCat.nome||''} onChange={e=>setEditData({ __editRiskCat: { ...editData.__editRiskCat, nome: e.target.value } })} />
            <input placeholder="Descrição" value={editData.__editRiskCat.descricao||''} onChange={e=>setEditData({ __editRiskCat: { ...editData.__editRiskCat, descricao: e.target.value } })} />
            <button onClick={async ()=>{
              await fetch(`/api/categorias-risco/${editData.__editRiskCat.id}`, { method: 'DELETE' });
              await fetch('/api/categorias-risco', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: editData.__editRiskCat.nome, descricao: editData.__editRiskCat.descricao }) });
              fetch('/api/categorias-risco').then(r=>r.json()).then(setRiskCats).catch(()=>{});
              setEditOpen(false); setEditType(null); setEditData(null);
            }}>Salvar alterações</button>
          </div>
        )}
      </Modal>
      <Modal open={participantsOpen} title={participantsGroup? `Adicionar participantes: ${participantsGroup.nome}` : ''} onClose={()=>{ setParticipantsOpen(false); setParticipantsGroup(null); }}
        footer={<>
          <button className="btn-outline" onClick={()=>{ setParticipantsOpen(false); setParticipantsGroup(null); }}>Cancelar</button>
          <button onClick={saveParticipants}>Salvar e fechar grupo</button>
        </>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <strong>Colaboradores</strong>
            <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid #eee', padding: 8, marginTop: 6 }}>
              {base.colaboradores.map(c => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={selCols.includes(c.id)} onChange={e=>{
                    const next = new Set(selCols);
                    if (e.target.checked) next.add(c.id); else next.delete(c.id);
                    setSelCols(Array.from(next));
                  }} />
                  {c.nome} <span style={{ color: '#777' }}>({c.email})</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <strong>Stakeholders (Pessoas)</strong>
            <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid #eee', padding: 8, marginTop: 6 }}>
              {stakeholdersView.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={selStks.includes(s.id)} onChange={e=>{
                    const next = new Set(selStks);
                    if (e.target.checked) next.add(s.id); else next.delete(s.id);
                    setSelStks(Array.from(next));
                  }} />
                  {s.nome} <span style={{ color: '#777' }}>{s.setor? `(${s.setor})` : ''}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
