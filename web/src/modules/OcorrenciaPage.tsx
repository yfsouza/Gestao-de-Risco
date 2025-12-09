import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { api } from '../services/api';

interface OcorrenciaPageProps {
  riscoId: string;
  riscoTitulo?: string;
  colaboradores: { id: string; nome: string; setor?: string; email?: string; telefone?: string }[];
  onVoltar: () => void;
  onSalvar: (payload: OcorrenciaPayload) => Promise<void>;
}

interface OcorrenciaPayload {
  dataOcorrencia: string;
  dataEntrega: string;
  responsavelId: string;
  impedimento: string;
  descricao: string;
  temInvestimento: boolean;
  descricaoInvestimento?: string;
  itens?: { descricao: string; quantidade: number; valorUnitario: number }[];
  servicos?: { descricao: string; valor: number }[];
  orcamento?: number;
}

export const OcorrenciaPage: React.FC<OcorrenciaPageProps> = ({ 
  riscoId, 
  riscoTitulo, 
  colaboradores, 
  onVoltar, 
  onSalvar 
}) => {
  const toast = useToast();
  
  // Função para formatar data local no formato datetime-local
  const formatLocalDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Datas
  const hoje = new Date();
  const hojeStr = formatLocalDateTime(hoje);
  const seteDias = new Date(hoje);
  seteDias.setDate(seteDias.getDate() + 7);
  const seteDiasStr = formatLocalDate(seteDias);

  const [dataOcorrencia, setDataOcorrencia] = useState(hojeStr);
  const [dataEntrega, setDataEntrega] = useState(seteDiasStr);
  const [responsavelId, setResponsavelId] = useState('');
  const [impedimento, setImpedimento] = useState('');
  const [descricao, setDescricao] = useState('');
  
  // Investimento
  const [temInvestimento, setTemInvestimento] = useState(false);
  const [descricaoInvestimento, setDescricaoInvestimento] = useState('');
  const [itens, setItens] = useState<{ id: number; descricao: string; quantidade: number; valorUnitario: number }[]>([]);
  const [servicos, setServicos] = useState<{ id: number; descricao: string; valor: number }[]>([]);
  const [orcamento, setOrcamento] = useState<number>(0);
  
  // Modals
  const [showBuscarResponsavel, setShowBuscarResponsavel] = useState(false);
  const [showCadastrarResponsavel, setShowCadastrarResponsavel] = useState(false);
  const [buscaResponsavel, setBuscaResponsavel] = useState('');
  
  // Lista de colaboradores local (para atualizar após cadastro)
  const [listaColaboradores, setListaColaboradores] = useState(colaboradores);
  
  // Form novo responsável
  const [novoResponsavel, setNovoResponsavel] = useState({ nome: '', email: '', setor: '' });
  
  // Contadores
  const [itemCounter, setItemCounter] = useState(0);
  const [serviceCounter, setServiceCounter] = useState(0);

  // Total calculado
  const totalEstimado = useMemo(() => {
    const totalItens = itens.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario), 0);
    const totalServicos = servicos.reduce((acc, srv) => acc + srv.valor, 0);
    return totalItens + totalServicos;
  }, [itens, servicos]);

  // Colaboradores filtrados para busca
  const colaboradoresFiltrados = useMemo(() => {
    if (!buscaResponsavel) return listaColaboradores;
    const termo = buscaResponsavel.toLowerCase();
    return listaColaboradores.filter(c => 
      c.nome.toLowerCase().includes(termo) || 
      (c.email && c.email.toLowerCase().includes(termo))
    );
  }, [listaColaboradores, buscaResponsavel]);

  // Adicionar item
  const adicionarItem = () => {
    const newId = itemCounter + 1;
    setItemCounter(newId);
    setItens([...itens, { id: newId, descricao: '', quantidade: 1, valorUnitario: 0 }]);
  };

  // Remover item
  const removerItem = (id: number) => {
    setItens(itens.filter(i => i.id !== id));
  };

  // Atualizar item
  const atualizarItem = (id: number, field: 'descricao' | 'quantidade' | 'valorUnitario', value: string | number) => {
    setItens(itens.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  // Adicionar serviço
  const adicionarServico = () => {
    const newId = serviceCounter + 1;
    setServiceCounter(newId);
    setServicos([...servicos, { id: newId, descricao: '', valor: 0 }]);
  };

  // Remover serviço
  const removerServico = (id: number) => {
    setServicos(servicos.filter(s => s.id !== id));
  };

  // Atualizar serviço
  const atualizarServico = (id: number, field: 'descricao' | 'valor', value: string | number) => {
    setServicos(servicos.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Selecionar responsável
  const selecionarResponsavel = (id: string) => {
    setResponsavelId(id);
    setShowBuscarResponsavel(false);
    setBuscaResponsavel('');
  };

  // Cadastrar novo responsável
  const handleCadastrarResponsavel = async () => {
    if (!novoResponsavel.nome.trim()) {
      toast.show('Informe o nome do responsável', 'error');
      return;
    }
    try {
      const novo = await api.addColaborador({
        nome: novoResponsavel.nome,
        email: novoResponsavel.email || undefined,
        setor: novoResponsavel.setor || undefined
      });
      // Adiciona à lista local
      setListaColaboradores(prev => [...prev, novo]);
      // Seleciona automaticamente
      setResponsavelId(novo.id);
      // Limpa e fecha
      setNovoResponsavel({ nome: '', email: '', setor: '' });
      setShowCadastrarResponsavel(false);
      toast.show('Responsável cadastrado com sucesso', 'success');
    } catch (err) {
      toast.show('Erro ao cadastrar responsável', 'error');
    }
  };

  // Salvar
  const handleSalvar = async () => {
    if (!responsavelId) {
      toast.show('Selecione um responsável', 'error');
      return;
    }
    if (!impedimento) {
      toast.show('Informe o impedimento', 'error');
      return;
    }

    const payload: OcorrenciaPayload = {
      dataOcorrencia,
      dataEntrega,
      responsavelId,
      impedimento,
      descricao,
      temInvestimento,
      ...(temInvestimento && {
        descricaoInvestimento,
        itens: itens.map(({ descricao, quantidade, valorUnitario }) => ({ descricao, quantidade, valorUnitario })),
        servicos: servicos.map(({ descricao, valor }) => ({ descricao, valor })),
        orcamento: orcamento || totalEstimado
      })
    };

    try {
      await onSalvar(payload);
    } catch (err) {
      toast.show('Erro ao salvar ocorrência', 'error');
    }
  };

  // Cancelar
  const handleCancelar = () => {
    if (impedimento || descricao || itens.length > 0 || servicos.length > 0) {
      if (!confirm('Deseja cancelar? As informações não salvas serão perdidas.')) {
        return;
      }
    }
    onVoltar();
  };

  // Mover para Monitoramento
  const handleMoverParaMonitoramento = async () => {
    if (!confirm('Deseja mover este risco para a coluna Monitoramento?')) return;
    try {
      await api.updateRisco(riscoId, { status: 'Monitoramento' });
      toast.show('Risco movido para Monitoramento', 'success');
      onVoltar();
    } catch (err) {
      toast.show('Erro ao mover para Monitoramento', 'error');
    }
  };

  const getResponsavelNome = () => {
    const colab = colaboradores.find(c => c.id === responsavelId);
    return colab ? colab.nome : '';
  };

  return (
    <div className="ocorrencia-page">
      <div className="ocorrencia-header">
        <button
          type="button"
          className="btn-icon btn-back"
          title="Voltar para Monitoramento"
          onClick={onVoltar}
          aria-label="Voltar para Monitoramento"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h1><i className="fa-solid fa-exclamation-circle"></i> Informar Ocorrência</h1>
        {riscoTitulo && <span className="ocorrencia-risco-titulo">Risco: {riscoTitulo}</span>}
      </div>
      
      <div className="ocorrencia-content">
        {/* Datas */}
        <div className="form-row">
          <div className="form-group">
            <label className="label">Data da Ocorrência</label>
            <input 
              type="datetime-local" 
              value={dataOcorrencia} 
              onChange={e => setDataOcorrencia(e.target.value)} 
            />
          </div>
          
          <div className="form-group">
            <label className="label">Data de Entrega/Resolução</label>
            <input 
              type="date" 
              value={dataEntrega} 
              onChange={e => setDataEntrega(e.target.value)} 
            />
          </div>
        </div>
        
        {/* Responsável */}
        <div className="form-group">
          <label className="label">Responsável</label>
          <div className="input-with-buttons">
            <select value={responsavelId} onChange={e => setResponsavelId(e.target.value)}>
              <option value="">Selecione um responsável</option>
              {listaColaboradores.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <button type="button" className="btn-small" onClick={() => setShowBuscarResponsavel(true)}>
              <i className="fa-solid fa-search"></i> Pesquisar
            </button>
            <button type="button" className="btn-small" onClick={() => setShowCadastrarResponsavel(true)}>
              <i className="fa-solid fa-user-plus"></i> Cadastrar
            </button>
          </div>
        </div>
        
        {/* Impedimento e Descrição */}
        <div className="form-group">
          <label className="label">Impedimento</label>
          <input 
            type="text" 
            value={impedimento} 
            onChange={e => setImpedimento(e.target.value)} 
            placeholder="Descreva o impedimento de forma breve"
          />
        </div>
        
        <div className="form-group">
          <label className="label">Descrição Detalhada</label>
          <textarea 
            value={descricao} 
            onChange={e => setDescricao(e.target.value)} 
            placeholder="Descreva detalhadamente a ocorrência, causas, contexto..."
            rows={4}
          />
        </div>
        
        {/* Checkbox de Investimento */}
        <div className="checkbox-section">
          <div className="checkbox-group">
            <input 
              type="checkbox" 
              id="tem-investimento" 
              checked={temInvestimento} 
              onChange={e => setTemInvestimento(e.target.checked)} 
            />
            <label htmlFor="tem-investimento">Esta ocorrência envolve investimento financeiro?</label>
          </div>
          
          {temInvestimento && (
            <div className="investment-section">
              {/* Descrição do Investimento */}
              <div className="form-group">
                <label className="label">Descrição do Investimento</label>
                <textarea 
                  value={descricaoInvestimento} 
                  onChange={e => setDescricaoInvestimento(e.target.value)} 
                  placeholder="Descreva o propósito do investimento..."
                  rows={3}
                />
              </div>
              
              {/* Itens de Investimento */}
              <div className="items-section">
                <div className="item-header">
                  <h3>Itens de Investimento</h3>
                  <button type="button" className="btn-small" onClick={adicionarItem}>
                    <i className="fa-solid fa-plus"></i> Adicionar Item
                  </button>
                </div>
                
                <div className="item-list">
                  {itens.map(item => (
                    <div className="item-row" key={item.id}>
                      <input 
                        type="text" 
                        placeholder="Descrição do item" 
                        value={item.descricao}
                        onChange={e => atualizarItem(item.id, 'descricao', e.target.value)}
                      />
                      <input 
                        type="number" 
                        placeholder="Qtd" 
                        value={item.quantidade}
                        min={1}
                        onChange={e => atualizarItem(item.id, 'quantidade', parseInt(e.target.value) || 1)}
                      />
                      <input 
                        type="number" 
                        placeholder="Valor unitário" 
                        value={item.valorUnitario || ''}
                        step="0.01"
                        min={0}
                        onChange={e => atualizarItem(item.id, 'valorUnitario', parseFloat(e.target.value) || 0)}
                      />
                      <div className="item-actions">
                        <button type="button" className="btn-icon" title="Remover item" onClick={() => removerItem(item.id)}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Serviços */}
              <div className="items-section">
                <div className="item-header">
                  <h3>Serviços</h3>
                  <button type="button" className="btn-small" onClick={adicionarServico}>
                    <i className="fa-solid fa-plus"></i> Adicionar Serviço
                  </button>
                </div>
                
                <div className="service-list">
                  {servicos.map(srv => (
                    <div className="service-row" key={srv.id}>
                      <input 
                        type="text" 
                        placeholder="Descrição do serviço" 
                        value={srv.descricao}
                        onChange={e => atualizarServico(srv.id, 'descricao', e.target.value)}
                      />
                      <input 
                        type="number" 
                        placeholder="Valor" 
                        value={srv.valor || ''}
                        step="0.01"
                        min={0}
                        onChange={e => atualizarServico(srv.id, 'valor', parseFloat(e.target.value) || 0)}
                      />
                      <div className="item-actions">
                        <button type="button" className="btn-icon" title="Remover serviço" onClick={() => removerServico(srv.id)}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Orçamento */}
              <div className="budget-section">
                <div className="budget-header">
                  <h3>Orçamento Estimado</h3>
                </div>
                
                <div className="form-group">
                  <label className="label">Valor do Orçamento (R$)</label>
                  <input 
                    type="number" 
                    value={orcamento || ''}
                    onChange={e => setOrcamento(parseFloat(e.target.value) || 0)}
                    placeholder="0.00" 
                    step="0.01" 
                    min={0}
                  />
                </div>
                
                <div className="total-budget">
                  <div>Total Estimado:</div>
                  <div><span className="total-value">R$ {totalEstimado.toFixed(2).replace('.', ',')}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Ações */}
        <div className="ocorrencia-actions">
          <button
            type="button"
            className="btn-icon"
            title="Mover para Monitoramento"
            onClick={handleMoverParaMonitoramento}
            aria-label="Mover para Monitoramento"
          >
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleCancelar}>
            <i className="fa-solid fa-times"></i> Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSalvar}>
            <i className="fa-solid fa-save"></i> Salvar Ocorrência
          </button>
        </div>
      </div>

      {/* Modal: Buscar Responsável */}
      <Modal open={showBuscarResponsavel} onClose={() => setShowBuscarResponsavel(false)} title="Buscar Responsável">
        <div className="form-group">
          <label className="label">Nome ou E-mail</label>
          <div className="input-with-buttons">
            <input 
              type="text" 
              placeholder="Digite para buscar..." 
              value={buscaResponsavel}
              onChange={e => setBuscaResponsavel(e.target.value)}
            />
            <button type="button" className="btn-small">
              <i className="fa-solid fa-search"></i> Buscar
            </button>
            <button type="button" className="btn-small" onClick={() => { setShowBuscarResponsavel(false); setShowCadastrarResponsavel(true); }}>
              <i className="fa-solid fa-user-plus"></i> Adicionar
            </button>
          </div>
        </div>
        <div className="search-results">
          {colaboradoresFiltrados.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>
              Nenhum responsável encontrado. 
              <button type="button" className="btn-small" style={{ marginLeft: 8 }} onClick={() => { setShowBuscarResponsavel(false); setShowCadastrarResponsavel(true); }}>
                <i className="fa-solid fa-user-plus"></i> Cadastrar novo
              </button>
            </div>
          ) : (
            colaboradoresFiltrados.map(c => (
              <div className="search-result-row" key={c.id} onClick={() => selecionarResponsavel(c.id)}>
                <div>{c.nome}</div>
                <div>{c.email || '-'}</div>
                <div>{c.setor || '-'}</div>
                <button type="button" className="btn-small" onClick={(e) => { e.stopPropagation(); selecionarResponsavel(c.id); }}>Selecionar</button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Modal: Cadastrar Responsável */}
      <Modal open={showCadastrarResponsavel} onClose={() => setShowCadastrarResponsavel(false)} title="Cadastrar Novo Responsável">
        <div className="form-group">
          <label className="label">Nome Completo *</label>
          <input 
            type="text" 
            placeholder="Nome do responsável" 
            value={novoResponsavel.nome}
            onChange={e => setNovoResponsavel(prev => ({ ...prev, nome: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="label">E-mail</label>
          <input 
            type="email" 
            placeholder="email@empresa.com" 
            value={novoResponsavel.email}
            onChange={e => setNovoResponsavel(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="label">Departamento/Setor</label>
          <input 
            type="text" 
            placeholder="Ex: TI, RH, Financeiro..." 
            value={novoResponsavel.setor}
            onChange={e => setNovoResponsavel(prev => ({ ...prev, setor: e.target.value }))}
          />
        </div>
        <div className="form-actions" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-secondary" onClick={() => { setShowCadastrarResponsavel(false); setNovoResponsavel({ nome: '', email: '', setor: '' }); }}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={handleCadastrarResponsavel}>
            <i className="fa-solid fa-save"></i> Cadastrar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default OcorrenciaPage;
