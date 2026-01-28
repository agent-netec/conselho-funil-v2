# NETECMT User Rule — Port Management (Anti-Conflito de Portas)

## Objetivo
Eliminar conflitos recorrentes de portas (principalmente ao iniciar `npm run dev`) e padronizar como o agente lida com servidores locais.

## Regras

- **Nunca iniciar um servidor “no escuro”**: antes de rodar qualquer `npm run dev`/`next dev`, verifique se já existe um processo rodando nessa porta.
- **Evitar múltiplos servidores**: se já existir um servidor saudável, **não** inicie um segundo.
- **Se precisar reiniciar**, limpe a porta antes:
  - Preferir `npx kill-port <PORTA>` quando disponível.
  - Alternativas:
    - Windows: `netstat -ano | findstr :<PORTA>` → `taskkill /PID <PID> /F`
    - macOS/Linux: `lsof -i :<PORTA>` → `kill -9 <PID>`
- **Portas padrão**:
  - Next.js: 3000 (principal)
  - Se a 3000 estiver ocupada e o projeto aceitar fallback, usar 3001/3002 **apenas com justificativa**.
- **Registrar evidência**: ao resolver conflito, reportar:
  - porta afetada
  - PID/processo encerrado
  - comando final utilizado

## Checklist rápido (antes de “dev”)
- [ ] Já existe terminal com `npm run dev` ativo?
- [ ] A porta está em uso?
- [ ] Precisa mesmo reiniciar?
- [ ] Se sim: mate a porta/proc e só então suba novamente.

