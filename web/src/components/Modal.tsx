import React from 'react';

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export const Modal: React.FC<ModalProps> = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 8, width: '90%', maxWidth: 800, maxHeight: '85vh', overflow: 'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
          <strong>{title}</strong>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 18 }}>×</button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
        {footer && <div style={{ padding: 16, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>{footer}</div>}
      </div>
    </div>
  );
};
