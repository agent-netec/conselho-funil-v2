# 🔧 Guia de Ferramenta: Firebase & Firestore (NETECMT v2.0)

Este documento define o uso seguro e padronizado do Firebase no projeto "Conselho de Funil".

## 📜 1. Escopo de Uso
- **Agente Responsável:** Monara (Integrações) e Darllyson (Implementação).
- **Coleções Críticas:** `brands`, `funnels`, `campaigns`, `copyDecisions`.

## 🛠️ 2. Padrões de Operação (CRUD)

### 2.1 O Manifesto (Coleção `campaigns`)
- **Regra de Escrita:** Deve ser feita preferencialmente via API Routes (`/api/...`) para garantir a execução de lógica atômica.
- **Merge Mode:** Sempre utilize `{ merge: true }` ao atualizar etapas da campanha para evitar o apagamento de dados anteriores (O Cérebro vs A Voz).

### 2.2 IDs e Hierarquia
- **ID da Campanha:** Deve seguir o padrão `[funnelId]` para garantir o vínculo visual imediato.
- **Sub-coleções:** Evite sub-coleções profundas. Use coleções de nível raiz com chaves estrangeiras (`brandId`, `funnelId`) para facilitar o scanner de emergência documentado pelo Wilder.

## 🛑 3. Bloqueios de Segurança
- **NUNCA** apague a coleção `funnels` sem antes verificar se existem manifestos ativos na coleção `campaigns`.
- **NUNCA** realize operações de `delete` em massa via console sem a documentação de Wilder em um script de transição.

---
*Assinado: Monara (Integrator)*
