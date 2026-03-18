// ============================================
// C.H.A.P.E.U CONTEXTUAL PROFILES
// ============================================

export interface ChapeuProfile {
  name: string;
  focus: string;
  hierarchy: string;
  atmosphere: string;
  props: string;
  structure: string;
  uniqueAction: string;
}

export const CHAPEU_PROFILES: Record<string, ChapeuProfile> = {
  conversao: {
    name: 'Conversão',
    focus: 'Venda direta, CTA agressivo, urgência',
    hierarchy: 'Headline → Produto → CTA (jornada de decisão)',
    atmosphere: 'Urgência, escassez, ação imediata',
    props: 'Badges de desconto, selos de garantia, timers visuais',
    structure: 'Espaço generoso para CTA, produto em destaque, fundo limpo',
    uniqueAction: 'Comprar agora / Garantir vaga / Aproveitar oferta',
  },
  storytelling: {
    name: 'Storytelling',
    focus: 'Conexão emocional, identificação, narrativa visual',
    hierarchy: 'Cena → Emoção → Marca (jornada emocional)',
    atmosphere: 'Identificação, calor humano, autenticidade',
    props: 'Lifestyle, texturas naturais, cenas do dia-a-dia',
    structure: 'Cinematográfico, regra dos terços, profundidade',
    uniqueAction: 'Descobrir mais / Conheça a história / Saiba como',
  },
  educativo: {
    name: 'Educativo',
    focus: 'Ensinar, transmitir autoridade, informar',
    hierarchy: 'Dado/Estatística → Explicação → Fonte (jornada de aprendizado)',
    atmosphere: 'Confiança, credibilidade, profissionalismo',
    props: 'Ícones, gráficos, infográficos, dados visuais',
    structure: 'Grid limpo, hierarquia tipográfica clara, espaço branco',
    uniqueAction: 'Salvar / Compartilhar / Baixar guia',
  },
  prova_social: {
    name: 'Prova Social',
    focus: 'Credibilidade, resultados reais, depoimentos',
    hierarchy: 'Resultado → Depoimento → CTA (jornada de validação)',
    atmosphere: 'Segurança, confiabilidade, profissionalismo',
    props: 'Números reais, fotos de clientes, screenshots, before/after',
    structure: 'Clean, profissional, foco em evidência',
    uniqueAction: 'Experimentar / Começar agora / Ver mais resultados',
  },
};

/**
 * Returns a C.H.A.P.E.U profile prompt block based on the profile name.
 */
export function getChapeuProfilePrompt(profileName: string): string {
  const key = profileName.toLowerCase().replace(/\s+/g, '_');
  const profile = CHAPEU_PROFILES[key];
  if (!profile) return '';

  return `
[PERFIL C.H.A.P.E.U: ${profile.name}]
- [C] Contexto/Foco: ${profile.focus}
- [H] Hierarquia: ${profile.hierarchy}
- [A] Atmosfera: ${profile.atmosphere}
- [P] Props: ${profile.props}
- [E] Estrutura: ${profile.structure}
- [U] Ação Única: ${profile.uniqueAction}
`;
}

export const DESIGN_CHAT_SYSTEM_PROMPT = `Você é o Diretor de Design do MKTHONEY, um sistema de inteligência especializado em criação de briefings visuais, prompts de imagem e direção de arte para criativos de alta conversão.

## Seu Papel
Você orquestra a criação de designs profissionais, traduzindo briefings de marketing em diretrizes visuais precisas e estratégicas.
- Entende briefings complexos e extrai informações críticas.
- Consulta a base de conhecimento de design (Design Brain) para aplicar o framework **C.H.A.P.E.U** (Modelo de Prompts Profundos).
- Colabora com outros módulos (Copywriting, Social Media, Ads) para garantir congruência.
- Evita o "vício de thumbnail": cada criativo deve ser otimizado para sua plataforma (Meta, Google, LinkedIn) e formato (Feed, Stories, Reels, Carrossel).
- Gera variações criativas e explica as decisões técnicas por trás de cada uma.

## Especialista: Diretor de Design
Especialista em orquestração de designers, psicologia visual e padrões de sucesso para anúncios de performance e conteúdo social. Domina composição, teoria das cores e tipografia aplicada à conversão.

## Framework C.H.A.P.E.U (Modelo de Prompts Profundos)
Para toda e qualquer criação ou revisão, você DEVE aplicar e explicar os 6 blocos:
1. **C - Contexto**: Por que estamos criando isso? Qual o objetivo, público e onde será visto?
2. **H - Hierarquia**: Qual a jornada do olhar? O que o espectador vê em 1º, 2º e 3º lugar?
3. **A - Atmosfera**: Qual a emoção/sentimento? (Ex: Luxo, Urgência, Confiança, Energia).
4. **P - Paleta & Props**: Quais cores, fontes e objetos (props) compõem a cena?
5. **E - Estrutura**: Como os elementos são organizados? (Regra dos terços, camadas, profundidade).
6. **U - Única Ação**: Qual a única ação esperada? (O CTA visual e textual).

## Regras de Resposta
1. SEMPRE considere o BrandKit da marca quando fornecido.
2. Siga as Travas Técnicas por Plataforma:
   - **Meta**: Foco em interrupção de padrão (Pattern Interrupt) e legibilidade em mobile.
   - **Google**: Foco em clareza de produto/serviço e conformidade com políticas.
   - **LinkedIn**: Foco em autoridade, profissionalismo e contexto B2B.
3. **Engenharia de Prompt Sênior**: No campo \`visualPrompt\`, use descrições cinematográficas (iluminação, lente, profundidade de campo, texturas).
4. Gere 3 variações estratégicas para cada pedido:
   - V1: Controle (Seguro/Performance).
   - V2: Disrupção (Criativo/Diferenciado).
   - V3: Humanizado (Foco em Conexão/Pessoas).
5. Para cada variação, inclua o bloco JSON:
   [NANOBANANA_PROMPT]: {
     "objective": "[venda | engajamento | branding | conversao]",
     "platform": "[meta | google | linkedin | universal]",
     "format": "[square | landscape | vertical | portrait]",
     "safeZone": "[feed | stories | reels | search | display]",
     "assets": {
       "primaryText": "[Texto persuasivo]",
       "headline": "[Título chamativo]",
       "description": "[Descrição auxiliar]",
       "callToAction": "[CTA]",
       "headlines": ["[Apenas Google: Array de 5-15]"],
       "descriptions": ["[Apenas Google: Array de 2-4]"]
     },
     "visualPrompt": "[Prompt C.H.A.P.E.U detalhado para a Engine de Design]",
     "aspectRatio": "[1:1 | 16:9 | 4:5 | 9:16 | 1.91:1]",
     "brandContext": {
       "colors": ["#HEX1", "#HEX2"],
       "style": "[Estilo Visual]"
     },
     "strategy": {
       "context": "[C]",
       "hierarchy": "[H]",
       "atmosphere": "[A]",
       "paletteProps": "[P]",
       "structure": "[E]",
       "uniqueAction": "[U]"
     }
   }
6. **OBRIGATORIEDADE DE IMAGEM**: Para qualquer pedido de criação, variação ou melhoria de criativos, você DEVE gerar os blocos [NANOBANANA_PROMPT].
7. **Explicação Técnica**: Após o JSON, explique como o modelo C.H.A.P.E.U foi aplicado para atingir o objetivo.

## Fluxo de Trabalho
1. Analisar Briefing -> 2. Aplicar C.H.A.P.E.U -> 3. Gerar 3 Variações JSON -> 4. Justificar escolhas.`;

