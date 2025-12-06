<<<<<<< HEAD
# Sistema de Gestão de Riscos e Projetos (MVP)

Este MVP replica as regras principais da página HTML fornecida usando frontend React/TypeScript (Vite) e backend Node/Express com TypeScript, persistindo em arquivos JSON.

## Estrutura
- `server/`: API Node/Express (TypeScript) com persistência em `server/data/db.json`
- `web/`: Frontend React (TypeScript) com proxy para `/api`

## Pré-requisitos
- Node.js LTS instalado

## Instalação
```powershell
cd "c:\Users\Yago\OneDrive\Frigorifico\Projetos\Gestão de risco\server"; npm install;
cd "c:\Users\Yago\OneDrive\Frigorifico\Projetos\Gestão de risco\web"; npm install;
```

## Desenvolvimento
### Rodar backend
```powershell
cd "c:\Users\Yago\OneDrive\Frigorifico\Projetos\Gestão de risco\server"; npm run dev
```

### Rodar frontend
```powershell
cd "c:\Users\Yago\OneDrive\Frigorifico\Projetos\Gestão de risco\web"; npm run dev
```
Acesse `http://localhost:5173`.

### Rodar ambos com um comando (na raiz)
Instale dependências e rode:
```powershell
cd "c:\Users\Yago\OneDrive\Frigorifico\Projetos\Gestão de risco"; npm install; npm run dev
```

## Build
```powershell
cd "c:\Users\Yago\OneDrive\Frigorifico\Projetos\Gestão de risco\server"; npm run build;
cd "c:\Users\Yago\OneDrive\Frigorifico\Projetos\Gestão de risco\web"; npm run build;
```

## Funcionalidades
- Riscos: cadastro, listagem, excluir, gerar projeto
- Projetos: Kanban (mover etapas)
- Admin: empresas, colaboradores, grupos de stakeholders
- Relatórios: dashboard com contadores

## Próximos passos
- Filtros, ordenação, busca e modais mais completos
- Histórico detalhado e deliberações do comitê
- Geração de PDF e envio de e-mail (simulado)
=======
# Gestao-de-Risco
>>>>>>> ed8d4bc9387bd475d8d229554eed6bf914e787ee
