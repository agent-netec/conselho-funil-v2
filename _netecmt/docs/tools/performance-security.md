# 🛡️ Performance Encryption & Security (War Room)

Este documento descreve o sistema de criptografia e as variáveis de ambiente necessárias para o funcionamento seguro do **Performance War Room** (Sprint 18), garantindo a proteção de chaves de API de terceiros (BYO Keys).

## 🚀 Visão Geral

Para permitir que cada marca (brand) utilize suas próprias chaves de API (Meta, Google, etc.) sem comprometer a segurança global, implementamos um sistema de criptografia simétrica AES-256-GCM.

## 🛠️ Variáveis de Ambiente (Produção)

As seguintes variáveis devem ser configuradas no ambiente de produção (Vercel/Cloud):

| Variável | Descrição | Obrigatória | Exemplo/Formato |
| :--- | :--- | :--- | :--- |
| `PERFORMANCE_ENCRYPTION_KEY` | Chave mestra de 32 bytes (hex) usada para criptografar/descriptografar segredos no Firestore. | **SIM** | `64 caracteres hexadecimais` |
| `NEXT_PUBLIC_PERFORMANCE_MOCK` | Habilita/Desabilita dados de mock para o dashboard. | NÃO | `true` ou `false` (default) |

### ⚠️ Geração da Chave
Para gerar uma chave segura em ambiente local para produção, utilize:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🔒 Protocolo de Segurança

1. **At-Rest Encryption**: Todas as chaves de API salvas em `brands/{brandId}/integrations/*` são armazenadas criptografadas.
2. **Multi-Tenant Isolation**: A `PERFORMANCE_ENCRYPTION_KEY` nunca é exposta ao cliente (browser). A descriptografia ocorre exclusivamente no Server-Side.
3. **Key Rotation**: Em caso de comprometimento da `PERFORMANCE_ENCRYPTION_KEY`, todas as integrações de marcas devem ser reconfiguradas.

## 👤 Responsabilidades

- **Monara (Integrator)**: Responsável pela gestão e rotação das chaves de criptografia.
- **Darllyson (Dev)**: Deve garantir que nenhum segredo seja logado ou exposto em respostas de API.
- **Luke (Release)**: Validar a presença da variável no ambiente de destino antes do deploy.

---
*NETECMT v2.0 | Segurança e Integridade em Primeiro Lugar*
