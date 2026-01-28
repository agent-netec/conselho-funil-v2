# 🎯 PRD: Sprint 12 - Deep Intelligence (Feedback Loops & Brand Voice)

**Versão:** 1.0  
**Status:** Ready for Architecture  
**Responsável:** Iuran (PM)  
**Data:** 22/01/2026

## 1. Visão Geral
A Sprint 12 foca em transformar o Conselho de Funil de uma ferramenta de geração passiva em um sistema de otimização ativa. Implementaremos o "Deep Intelligence", onde a IA não apenas cria, mas aprende com a performance real e se adapta perfeitamente à identidade de cada marca.

## 2. Objetivos Estratégicos
- **ST-12.1 (Automated Feedback Loop):** Fechar o ciclo entre tráfego e copy. A IA deve ler métricas (CTR, CVR) e sugerir iterações baseadas em dados, não apenas em heurísticas.
- **ST-12.2 (Brand Voice Hyper-Personalization):** Garantir que a "personalidade" da marca dite o comportamento técnico do modelo (temperatura, amostragem).

## 3. Requisitos Funcionais (Iuran)

### RF-01: Asset Health Index (AHI)
O sistema deve calcular um índice de saúde para cada ativo baseado em:
- **CTR (Ads):** Sucesso > 1.5% | Crítico < 0.8%
- **CVR (Landing Pages):** Sucesso > 3.5% | Crítico < 1.0%
- **CPC:** Sucesso < R$ 2.00 | Crítico > R$ 4.50

### RF-02: Otimização Proativa
- Se um ativo estiver em estado "Crítico", o Conselho deve gerar automaticamente uma notificação de "Ação Necessária" com uma proposta de ajuste (Copy ou Design).
- Se um ativo for um "Winner" (Sucesso), o Conselho deve sugerir variações para escala.

### RF-03: Configuração de Inferência por Marca
- O BrandKit deve permitir configurar o "Perfil de IA":
    - **Agressivo:** Alta Temperatura (0.9), Baixo Penalty.
    - **Sóbrio:** Baixa Temperatura (0.3), Alto Penalty.
    - **Equilibrado:** Temperatura Média (0.6).

## 4. Métricas de Sucesso
- Redução de 30% no tempo entre "queda de performance" e "proposta de ajuste".
- Aumento de 20% na taxa de aprovação de cópias personalizadas por marca.
- Zero alucinações sobre dados de performance (Grounding obrigatório).

---
*Documento gerado por Iuran (PM) - NETECMT v2.0*
