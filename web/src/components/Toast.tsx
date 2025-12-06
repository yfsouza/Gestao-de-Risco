import React, { createContext, useContext, useMemo, useState } from 'react';

export type ToastItem = { id: number; type?: 'info'|'success'|'error'; message: string };

type ToastCtx = {
  show: (message: string, type?: ToastItem['type']) => void;
};

const ToastContext = createContext<ToastCtx>({ show: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const show = (message: string, type: ToastItem['type'] = 'info') => {
    const id = Date.now();
    setItems(prev => [...prev, { id, type, message }]);
    setTimeout(() => setItems(prev => prev.filter(i => i.id !== id)), 4000);
  };
  const value = useMemo(() => ({ show }), []);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000 }}>
        {items.map(i => (
          <div key={i.id} style={{ minWidth: 280, background: '#fff', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', borderLeft: `4px solid ${i.type==='success'?'#27ae60': i.type==='error'?'#e74c3c':'#3498db'}`, padding: '10px 14px', borderRadius: 8 }}>
            {i.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
