import React, { useState, useRef, useMemo } from 'react';
import jsPDF from 'jspdf';
import { useToast } from '../components/Toast';
import { badgeStyle } from '../utils/badges';

interface TAPData {
  projetoId: string;
  codigoProjeto: string;
  codigoRisco: string;
  titulo: string;
  status: string;
  dataAbertura: string;
  area: string;
  categoria: string;
  local: string;
  empresa: string;
  problemaIdentificado: string;
  solucaoProposta: string;
  probabilidade: string;
  impacto: string;
  nivelRisco: string;
  score: number;
  justificativaRisco: string;
  gerenteProjeto: string;
  patrocinador: string;
  responsavelTecnico: string;
  ultimaAtualizacao: string;
  historico: { data: string; evento: string; autor: string }[];
  orcamentoEstimado?: number;
  prazoEstimado?: string;
}

interface TAPPageProps {
  projeto: any;
  risco?: any;
  empresas?: { id: string; nome: string }[];
  colaboradores?: { id: string; nome: string }[];
  onVoltar: () => void;
  onSalvar: (tapData: TAPData) => Promise<void>;
  onGerarPDF: (pdfBase64: string, nomeArquivo: string) => Promise<void>;
}

// Função para calcular nível de risco
const parseNivelNum = (txt?: string) => {
  if (!txt) return 3;
  const m = txt.match(/^([1-5])/);
  return m ? parseInt(m[1], 10) : 3;
};

const calcularNivelRisco = (probabilidade: string, impacto: string): 'Baixo'|'Médio'|'Alto' => {
  const p = parseNivelNum(probabilidade);
  const i = parseNivelNum(impacto);
  const score = p * i;
  if (score >= 12) return 'Alto';
  if (score >= 6) return 'Médio';
  return 'Baixo';
};

export const TAPPage: React.FC<TAPPageProps> = ({ projeto, risco, empresas, colaboradores, onVoltar, onSalvar, onGerarPDF }) => {
  const toast = useToast();
  const tapRef = useRef<HTMLDivElement>(null);
  const [gerandoPDF, setGerandoPDF] = useState(false);

  // Dados da TAP gerados automaticamente
  const [tapData, setTapData] = useState<TAPData>(() => {
    const hoje = new Date();
    const prob = risco?.probabilidade || '3-Média';
    const imp = risco?.impacto || '3-Médio';
    const pNum = parseNivelNum(prob);
    const iNum = parseNivelNum(imp);
    const score = pNum * iNum;
    const nivel = calcularNivelRisco(prob, imp);
    
    return {
      projetoId: projeto?.id || '',
      codigoProjeto: projeto?.id || `PRJ-${Date.now()}`,
      codigoRisco: risco?.id || projeto?.riscoId || '',
      titulo: projeto?.titulo || risco?.titulo || '',
      status: 'Em análise',
      dataAbertura: hoje.toLocaleDateString('pt-BR'),
      area: risco?.area || 'Infraestrutura',
      categoria: risco?.categoria || 'Geral',
      local: risco?.local || '',
      empresa: empresas?.find(e => e.id === risco?.empresaId)?.nome || '',
      problemaIdentificado: risco?.descricao || '',
      solucaoProposta: risco?.solucao || risco?.mitigacao || '',
      probabilidade: prob,
      impacto: imp,
      nivelRisco: nivel,
      score: score,
      justificativaRisco: `O risco é classificado como ${nivel.toUpperCase()} devido à probabilidade de ocorrência (${pNum}) e impacto (${iNum}) nas operações.`,
      gerenteProjeto: colaboradores?.find(c => c.id === projeto?.responsavelId)?.nome || '',
      patrocinador: '',
      responsavelTecnico: colaboradores?.find(c => c.id === risco?.responsavelId)?.nome || '',
      ultimaAtualizacao: hoje.toLocaleDateString('pt-BR'),
      historico: risco?.historico || projeto?.historico || [],
      orcamentoEstimado: 0,
      prazoEstimado: ''
    };
  });

  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const updateField = (field: keyof TAPData, value: any) => {
    setTapData(prev => ({ ...prev, [field]: value }));
  };

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      await onSalvar(tapData);
      toast.show('TAP salva com sucesso!', 'success');
      setEditando(false);
    } catch {
      toast.show('Erro ao salvar TAP', 'error');
    } finally {
      setSalvando(false);
    }
  };

  const gerarPDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE ABERTURA DE PROJETO (TAP)', pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(tapData.titulo, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Informações Básicas
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Informações Básicas do Projeto', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const addInfo = (label: string, value: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}: `, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 45, y);
      y += 6;
    };

    addInfo('Código Projeto', tapData.codigoProjeto);
    addInfo('Código Risco', tapData.codigoRisco);
    addInfo('Status', tapData.status);
    addInfo('Data Abertura', tapData.dataAbertura);
    y += 5;

    // Dados do Projeto
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados do Projeto', margin, y);
    y += 8;
    doc.setFontSize(10);
    
    addInfo('Área', tapData.area);
    addInfo('Categoria', tapData.categoria);
    addInfo('Local', tapData.local);
    addInfo('Empresa', tapData.empresa);
    y += 5;

    // Problema Identificado
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Problema Identificado', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const problemaLines = doc.splitTextToSize(tapData.problemaIdentificado, pageWidth - 2 * margin);
    doc.text(problemaLines, margin, y);
    y += problemaLines.length * 5 + 5;

    // Solução Proposta
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Solução Proposta', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const solucaoLines = doc.splitTextToSize(tapData.solucaoProposta || 'A definir', pageWidth - 2 * margin);
    doc.text(solucaoLines, margin, y);
    y += solucaoLines.length * 5 + 5;

    // Análise de Risco
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Análise de Risco', margin, y);
    y += 8;
    doc.setFontSize(10);
    
    addInfo('Probabilidade', tapData.probabilidade);
    addInfo('Impacto', tapData.impacto);
    addInfo('Nível de Risco', tapData.nivelRisco);
    addInfo('Score', tapData.score.toString());
    y += 5;

    // Responsáveis
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Responsáveis', margin, y);
    y += 8;
    doc.setFontSize(10);
    
    addInfo('Gerente Projeto', tapData.gerenteProjeto || 'A definir');
    addInfo('Patrocinador', tapData.patrocinador || 'A definir');
    addInfo('Resp. Técnico', tapData.responsavelTecnico || 'A definir');
    y += 5;

    // Orçamento e Prazo
    if (tapData.orcamentoEstimado || tapData.prazoEstimado) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Orçamento e Prazo', margin, y);
      y += 8;
      doc.setFontSize(10);
      
      if (tapData.orcamentoEstimado) {
        addInfo('Orçamento', `R$ ${tapData.orcamentoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      }
      if (tapData.prazoEstimado) {
        addInfo('Prazo', new Date(tapData.prazoEstimado).toLocaleDateString('pt-BR'));
      }
      y += 5;
    }

    // Histórico
    if (tapData.historico.length > 0) {
      if (y > 200) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Histórico de Andamento', margin, y);
      y += 8;
      doc.setFontSize(9);
      
      tapData.historico.slice(-10).forEach(h => {
        if (y > 270) { doc.addPage(); y = 20; }
        const data = new Date(h.data).toLocaleDateString('pt-BR');
        doc.setFont('helvetica', 'bold');
        doc.text(data, margin, y);
        doc.setFont('helvetica', 'normal');
        const eventoLines = doc.splitTextToSize(h.evento, pageWidth - 2 * margin - 25);
        doc.text(eventoLines, margin + 25, y);
        y += eventoLines.length * 4 + 3;
      });
      y += 5;
    }

    // Assinaturas
    if (y > 230) { doc.addPage(); y = 20; }
    y += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Aprovações', margin, y);
    y += 15;
    doc.setFontSize(10);
    
    doc.line(margin, y, margin + 60, y);
    doc.text('Gerente do Projeto', margin, y + 5);
    
    doc.line(pageWidth / 2 - 30, y, pageWidth / 2 + 30, y);
    doc.text('Patrocinador', pageWidth / 2 - 15, y + 5);
    
    doc.line(pageWidth - margin - 60, y, pageWidth - margin, y);
    doc.text('Data de Aprovação', pageWidth - margin - 50, y + 5);

    // Rodapé
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, 290);
    }

    // Gerar PDF como base64 e salvar no projeto
    const nomeArquivo = `TAP_${tapData.codigoProjeto}.pdf`;
    const pdfBase64 = doc.output('datauristring');
    
    setGerandoPDF(true);
    try {
      await onGerarPDF(pdfBase64, nomeArquivo);
      toast.show('PDF gerado e anexado ao projeto!', 'success');
    } catch {
      toast.show('Erro ao anexar PDF', 'error');
    } finally {
      setGerandoPDF(false);
    }
  };

  const getNivelBadgeColor = (nivel: string) => {
    if (nivel === 'Alto') return { bg: '#fde2e2', fg: '#c0392b' };
    if (nivel === 'Médio') return { bg: '#fff3cd', fg: '#b7791f' };
    return { bg: '#e2f7e2', fg: '#2e7d32' };
  };

  return (
    <div className="tap-container">
      {/* Header */}
      <div className="tap-page-header">
        <div className="tap-header-content">
          <h1><i className="fa-solid fa-file-contract"></i> Sistema de Geração de TAP</h1>
          <div className="tap-header-subtitle">Termo de Abertura de Projeto - Gerado automaticamente do Comitê de Riscos</div>
        </div>
        <button className="btn-outline" onClick={onVoltar}>
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
      </div>

      <div className="tap-content-grid">
        {/* Preview da TAP */}
        <div className="tap-main-content">
          <div className="tap-preview" ref={tapRef}>
            <div className="tap-watermark">TAP - PROJETO</div>
            
            <div className="tap-doc-header">
              <h2>TERMO DE ABERTURA DE PROJETO (TAP)</h2>
              <div className="tap-subtitle">{tapData.titulo}</div>
            </div>

            {/* Informações Básicas */}
            <div className="tap-section">
              <div className="tap-section-title"><i className="fa-solid fa-info-circle"></i> Informações Básicas do Projeto</div>
              <div className="tap-info-grid">
                <div className="tap-info-item">
                  <div className="tap-info-label">Código do Projeto</div>
                  {editando ? (
                    <input type="text" className="tap-input" value={tapData.codigoProjeto} onChange={e => updateField('codigoProjeto', e.target.value)} />
                  ) : (
                    <div className="tap-info-value">{tapData.codigoProjeto}</div>
                  )}
                </div>
                <div className="tap-info-item">
                  <div className="tap-info-label">Código do Risco</div>
                  <div className="tap-info-value">{tapData.codigoRisco}</div>
                </div>
                <div className="tap-info-item">
                  <div className="tap-info-label">Status</div>
                  {editando ? (
                    <select className="tap-input" value={tapData.status} onChange={e => updateField('status', e.target.value)}>
                      <option value="Em análise">Em análise</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Rejeitado">Rejeitado</option>
                      <option value="Em execução">Em execução</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  ) : (
                    <div className="tap-info-value tap-badge" style={badgeStyle('#e3f2fd', '#1976d2')}>{tapData.status}</div>
                  )}
                </div>
                <div className="tap-info-item">
                  <div className="tap-info-label">Data de Abertura</div>
                  <div className="tap-info-value">{tapData.dataAbertura}</div>
                </div>
              </div>
            </div>

            {/* Dados do Projeto */}
            <div className="tap-section">
              <div className="tap-section-title"><i className="fa-solid fa-project-diagram"></i> Dados do Projeto</div>
              <div className="tap-info-grid">
                <div className="tap-info-item">
                  <div className="tap-info-label">Área</div>
                  {editando ? (
                    <input type="text" className="tap-input" value={tapData.area} onChange={e => updateField('area', e.target.value)} />
                  ) : (
                    <div className="tap-info-value">{tapData.area || '-'}</div>
                  )}
                </div>
                <div className="tap-info-item">
                  <div className="tap-info-label">Categoria</div>
                  {editando ? (
                    <input type="text" className="tap-input" value={tapData.categoria} onChange={e => updateField('categoria', e.target.value)} />
                  ) : (
                    <div className="tap-info-value">{tapData.categoria || '-'}</div>
                  )}
                </div>
                <div className="tap-info-item">
                  <div className="tap-info-label">Local</div>
                  {editando ? (
                    <input type="text" className="tap-input" value={tapData.local} onChange={e => updateField('local', e.target.value)} />
                  ) : (
                    <div className="tap-info-value">{tapData.local || '-'}</div>
                  )}
                </div>
                <div className="tap-info-item">
                  <div className="tap-info-label">Empresa</div>
                  <div className="tap-info-value">{tapData.empresa || '-'}</div>
                </div>
              </div>
            </div>

            {/* Problema Identificado */}
            <div className="tap-section">
              <div className="tap-section-title"><i className="fa-solid fa-exclamation-triangle"></i> Problema Identificado</div>
              {editando ? (
                <textarea className="tap-textarea" value={tapData.problemaIdentificado} onChange={e => updateField('problemaIdentificado', e.target.value)} rows={4} />
              ) : (
                <div className="tap-description-box">{tapData.problemaIdentificado || 'Não informado'}</div>
              )}
            </div>

            {/* Solução Proposta */}
            <div className="tap-section">
              <div className="tap-section-title"><i className="fa-solid fa-lightbulb"></i> Solução Proposta</div>
              {editando ? (
                <textarea className="tap-textarea" value={tapData.solucaoProposta} onChange={e => updateField('solucaoProposta', e.target.value)} rows={4} />
              ) : (
                <div className="tap-description-box">{tapData.solucaoProposta || 'A definir'}</div>
              )}
            </div>

            {/* Análise de Risco */}
            <div className="tap-section">
              <div className="tap-section-title"><i className="fa-solid fa-chart-bar"></i> Análise de Risco</div>
              <div className="tap-info-grid">
                <div className="tap-info-item">
                  <div className="tap-info-label">Probabilidade</div>
                  <div className="tap-info-value tap-badge" style={badgeStyle(getNivelBadgeColor(tapData.nivelRisco).bg, getNivelBadgeColor(tapData.nivelRisco).fg)}>{tapData.probabilidade}</div>
                </div>
                <div className="tap-info-item">
                  <div className="tap-info-label">Impacto</div>
                  <div className="tap-info-value tap-badge" style={badgeStyle(getNivelBadgeColor(tapData.nivelRisco).bg, getNivelBadgeColor(tapData.nivelRisco).fg)}>{tapData.impacto}</div>
                </div>
                <div className="tap-info-item">
                  <div className="tap-info-label">Nível de Risco</div>
                  <div className="tap-info-value tap-badge" style={badgeStyle(getNivelBadgeColor(tapData.nivelRisco).bg, getNivelBadgeColor(tapData.nivelRisco).fg)}>{tapData.nivelRisco}</div>
                </div>
                <div className="tap-info-item">
                  <div className="tap-info-label">Score (Prob x Imp)</div>
                  <div className="tap-info-value">{tapData.score}</div>
                </div>
              </div>
              <div className="tap-description-box" style={{ marginTop: 16 }}>
                <strong>Justificativa:</strong> {tapData.justificativaRisco}
              </div>
            </div>

            {/* Responsáveis */}
            <div className="tap-section">
              <div className="tap-section-title"><i className="fa-solid fa-user-tie"></i> Responsáveis</div>
              <div className="tap-info-grid">
                <div className="tap-info-item">
                  <div className="tap-info-label">Gerente do Projeto</div>
                  {editando ? (
                    <select className="tap-input" value={tapData.gerenteProjeto} onChange={e => updateField('gerenteProjeto', e.target.value)}>
                      <option value="">Selecione...</option>
                      {colaboradores?.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                    </select>
                  ) : (
                    <div className="tap-info-value">{tapData.gerenteProjeto || 'A definir'}</div>
                  )}
                </div>
                <div className="tap-info-item">
                  <div className="tap-info-label">Patrocinador</div>
                  {editando ? (
                    <input type="text" className="tap-input" value={tapData.patrocinador} onChange={e => updateField('patrocinador', e.target.value)} />
                  ) : (
                    <div className="tap-info-value">{tapData.patrocinador || 'A definir'}</div>
                  )}
                </div>
                <div className="tap-info-item">
                  <div className="tap-info-label">Responsável Técnico</div>
                  {editando ? (
                    <select className="tap-input" value={tapData.responsavelTecnico} onChange={e => updateField('responsavelTecnico', e.target.value)}>
                      <option value="">Selecione...</option>
                      {colaboradores?.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                    </select>
                  ) : (
                    <div className="tap-info-value">{tapData.responsavelTecnico || 'A definir'}</div>
                  )}
                </div>
                <div className="tap-info-item">
                  <div className="tap-info-label">Última Atualização</div>
                  <div className="tap-info-value">{tapData.ultimaAtualizacao}</div>
                </div>
              </div>
            </div>

            {/* Orçamento e Prazo */}
            <div className="tap-section">
              <div className="tap-section-title"><i className="fa-solid fa-coins"></i> Orçamento e Prazo</div>
              <div className="tap-info-grid">
                <div className="tap-info-item">
                  <div className="tap-info-label">Orçamento Estimado (R$)</div>
                  {editando ? (
                    <input type="number" className="tap-input" value={tapData.orcamentoEstimado} onChange={e => updateField('orcamentoEstimado', parseFloat(e.target.value) || 0)} step="0.01" />
                  ) : (
                    <div className="tap-info-value">{tapData.orcamentoEstimado ? `R$ ${tapData.orcamentoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'A definir'}</div>
                  )}
                </div>
                <div className="tap-info-item">
                  <div className="tap-info-label">Prazo Estimado</div>
                  {editando ? (
                    <input type="date" className="tap-input" value={tapData.prazoEstimado} onChange={e => updateField('prazoEstimado', e.target.value)} />
                  ) : (
                    <div className="tap-info-value">{tapData.prazoEstimado ? new Date(tapData.prazoEstimado).toLocaleDateString('pt-BR') : 'A definir'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Histórico */}
            {tapData.historico.length > 0 && (
              <div className="tap-section">
                <div className="tap-section-title"><i className="fa-solid fa-history"></i> Histórico de Andamento</div>
                <div className="tap-timeline">
                  {tapData.historico.slice(-10).map((h, idx) => (
                    <div key={idx} className="tap-timeline-item">
                      <div className="tap-timeline-date">{new Date(h.data).toLocaleDateString('pt-BR')}</div>
                      <div className="tap-timeline-content">{h.evento}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assinaturas */}
            <div className="tap-section">
              <div className="tap-section-title"><i className="fa-solid fa-signature"></i> Aprovações</div>
              <div className="tap-info-grid tap-signatures">
                <div className="tap-info-item">
                  <div className="tap-signature-line">_________________________</div>
                  <div className="tap-info-label">Gerente do Projeto</div>
                </div>
                <div className="tap-info-item">
                  <div className="tap-signature-line">_________________________</div>
                  <div className="tap-info-label">Patrocinador Executivo</div>
                </div>
                <div className="tap-info-item">
                  <div className="tap-signature-line">_________________________</div>
                  <div className="tap-info-label">Data de Aprovação</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Painel de Ações */}
        <div className="tap-actions-panel">
          <div className="tap-actions-card">
            <div className="tap-card-header">
              <div className="tap-card-title"><i className="fa-solid fa-cogs"></i> Ações</div>
            </div>
            
            <div className="tap-actions-list">
              {!editando ? (
                <button className="tap-action-btn primary" onClick={() => setEditando(true)}>
                  <i className="fa-solid fa-pen-to-square"></i>
                  <div>
                    <strong>Editar TAP</strong>
                    <div className="tap-action-desc">Preencher/ajustar campos</div>
                  </div>
                </button>
              ) : (
                <button className="tap-action-btn success" onClick={handleSalvar} disabled={salvando}>
                  <i className="fa-solid fa-save"></i>
                  <div>
                    <strong>{salvando ? 'Salvando...' : 'Salvar Alterações'}</strong>
                    <div className="tap-action-desc">Confirmar edições</div>
                  </div>
                </button>
              )}
              
              {editando && (
                <button className="tap-action-btn" onClick={() => setEditando(false)}>
                  <i className="fa-solid fa-times"></i>
                  <div>
                    <strong>Cancelar Edição</strong>
                    <div className="tap-action-desc">Descartar alterações</div>
                  </div>
                </button>
              )}
              
              <button className="tap-action-btn" onClick={() => window.print()}>
                <i className="fa-solid fa-print"></i>
                <div>
                  <strong>Imprimir TAP</strong>
                  <div className="tap-action-desc">Versão para impressão</div>
                </div>
              </button>
              
              <button className="tap-action-btn success" onClick={gerarPDF} disabled={gerandoPDF}>
                <i className={`fa-solid ${gerandoPDF ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i>
                <div>
                  <strong>{gerandoPDF ? 'Gerando...' : 'Gerar PDF'}</strong>
                  <div className="tap-action-desc">Anexar ao projeto</div>
                </div>
              </button>
            </div>
          </div>

          {/* Informações do Sistema */}
          <div className="tap-actions-card">
            <div className="tap-card-header">
              <div className="tap-card-title"><i className="fa-solid fa-info-circle"></i> Informações</div>
            </div>
            <div className="tap-info-item">
              <div className="tap-info-label">TAP Gerado em:</div>
              <div className="tap-info-value">{new Date().toLocaleString('pt-BR')}</div>
            </div>
            <div className="tap-info-item">
              <div className="tap-info-label">Versão:</div>
              <div className="tap-info-value">1.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
