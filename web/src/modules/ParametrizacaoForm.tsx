import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

export const ParametrizacaoForm: React.FC = () => {
  const [minutes, setMinutes] = useState<number>(1);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const cfg: any = await api.getConfig();
        setMinutes(cfg.projectArchiveMinutes || 1);
      } catch (e) { }
    })();
  }, []);

  const save = async () => {
    try {
      await api.updateConfig({ projectArchiveMinutes: Number(minutes) });
      toast.show('Parâmetros salvos', 'success');
    } catch (e) { toast.show('Erro ao salvar parâmetros', 'error'); }
  };

  return (
    <div>
      <div className="form-group" style={{ maxWidth: 420 }}>
        <label className="label">Tempo (minutos) para mover projetos encerrados para Arquivados (teste)</label>
        <input type="number" min={0} value={minutes} onChange={e => setMinutes(parseInt(e.target.value || '0', 10))} />
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={save}>Salvar Parâmetro</button>
        </div>
      </div>
    </div>
  );
};

export default ParametrizacaoForm;
