/**
 * Email Transacional — R6.5
 *
 * Resend integration for MKTHONEY transactional emails.
 * Templates: verification, welcome, receipt, trial-expiring.
 */

import { Resend } from 'resend';

// ============================================
// RESEND CLIENT
// ============================================

let _resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured — emails will be skipped');
    return null;
  }
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// ============================================
// CONSTANTS
// ============================================

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'MktHoney <noreply@mkthoney.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mkthoney.com';

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * Base HTML wrapper for all emails.
 */
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MktHoney</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0D0B09;
      color: #F5E8CE;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: bold;
      color: #E6B447;
    }
    .card {
      background-color: #1A1715;
      border: 1px solid #2A2520;
      border-radius: 16px;
      padding: 32px;
    }
    h1 {
      font-size: 24px;
      color: #F5E8CE;
      margin: 0 0 16px 0;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #CAB792;
      margin: 0 0 16px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #E6B447;
      color: #0D0B09;
      text-decoration: none;
      font-weight: 600;
      border-radius: 8px;
      margin: 16px 0;
    }
    .button:hover {
      background-color: #F0C35C;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      font-size: 12px;
      color: #593519;
    }
    .highlight {
      color: #E6B447;
      font-weight: 600;
    }
    .divider {
      height: 1px;
      background-color: #2A2520;
      margin: 24px 0;
    }
    .info-box {
      background-color: #2A2520;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #3A3530;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #AB8648;
    }
    .info-value {
      color: #F5E8CE;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <span class="logo-text">MKTHONEY</span>
    </div>
    ${content}
    <div class="footer">
      <p>LEVIARK INTERMEDIACOES LTDA - CNPJ: 62.625.246/0001-06</p>
      <p>&copy; ${new Date().getFullYear()} MktHoney. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================
// EMAIL SEND FUNCTIONS
// ============================================

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Sends email verification link.
 */
export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationLink: string
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) return { success: false, error: 'RESEND_API_KEY not configured' };
  try {
    const html = baseTemplate(`
      <div class="card">
        <h1>Verifique seu email</h1>
        <p>Ola, <span class="highlight">${name}</span>!</p>
        <p>
          Para completar seu cadastro no MktHoney e comecar a usar todos os recursos,
          clique no botao abaixo para verificar seu email.
        </p>
        <a href="${verificationLink}" class="button">Verificar Email</a>
        <p style="font-size: 14px; color: #AB8648;">
          Se voce nao criou uma conta no MktHoney, ignore este email.
        </p>
      </div>
    `);

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Verifique seu email - MktHoney',
      html,
    });

    if (error) {
      console.error('[Email] Verification email failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Verification email error:', message);
    return { success: false, error: message };
  }
}

/**
 * Sends welcome email after verification.
 */
export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) return { success: false, error: 'RESEND_API_KEY not configured' };
  try {
    const html = baseTemplate(`
      <div class="card">
        <h1>Bem-vindo ao MktHoney!</h1>
        <p>Ola, <span class="highlight">${name}</span>!</p>
        <p>
          Sua conta foi verificada com sucesso! Voce agora tem acesso ao
          <span class="highlight">Trial PRO por 14 dias</span> — sem custos,
          sem compromisso, sem cartao de credito.
        </p>
        <div class="divider"></div>
        <p>
          Durante seu trial, voce tera acesso a:
        </p>
        <ul style="color: #CAB792; padding-left: 20px;">
          <li>23 especialistas de IA</li>
          <li>Sistema de debate multi-agentes</li>
          <li>Diagnostico de funil (Autopsy)</li>
          <li>Inteligencia competitiva (Spy Agent)</li>
          <li>Calendario de conteudo com auto-publicacao</li>
        </ul>
        <a href="${APP_URL}/dashboard" class="button">Acessar Meu Dashboard</a>
        <p style="font-size: 14px; color: #AB8648;">
          Dicas: Comece criando sua primeira marca no Brand Hub para
          personalizar as recomendacoes dos especialistas.
        </p>
      </div>
    `);

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Bem-vindo ao MktHoney - Seu Trial PRO comecou!',
      html,
    });

    if (error) {
      console.error('[Email] Welcome email failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Welcome email error:', message);
    return { success: false, error: message };
  }
}

/**
 * Sends payment receipt.
 */
export async function sendReceiptEmail(
  to: string,
  name: string,
  tier: string,
  amount: string,
  invoiceUrl?: string
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) return { success: false, error: 'RESEND_API_KEY not configured' };
  try {
    const tierNames: Record<string, string> = {
      starter: 'Starter',
      pro: 'Pro',
      agency: 'Agency',
    };

    const html = baseTemplate(`
      <div class="card">
        <h1>Pagamento Confirmado</h1>
        <p>Ola, <span class="highlight">${name}</span>!</p>
        <p>
          Seu pagamento foi processado com sucesso. Obrigado por assinar o
          <span class="highlight">MktHoney ${tierNames[tier] || tier}</span>!
        </p>
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Plano</span>
            <span class="info-value">${tierNames[tier] || tier}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Valor</span>
            <span class="info-value">${amount}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Data</span>
            <span class="info-value">${new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        ${invoiceUrl ? `<a href="${invoiceUrl}" class="button">Ver Fatura Completa</a>` : ''}
        <p style="font-size: 14px; color: #AB8648;">
          Esta e uma confirmacao automatica. Sua fatura completa esta disponivel
          em Configuracoes > Cobranca.
        </p>
      </div>
    `);

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Recibo - MktHoney ${tierNames[tier] || tier}`,
      html,
    });

    if (error) {
      console.error('[Email] Receipt email failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Receipt email error:', message);
    return { success: false, error: message };
  }
}

/**
 * Sends trial expiring warning.
 */
export async function sendTrialExpiringEmail(
  to: string,
  name: string,
  daysRemaining: number
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) return { success: false, error: 'RESEND_API_KEY not configured' };
  try {
    const isLastDay = daysRemaining <= 1;

    const html = baseTemplate(`
      <div class="card">
        <h1>${isLastDay ? 'Ultimo dia de Trial!' : `Seu trial expira em ${daysRemaining} dias`}</h1>
        <p>Ola, <span class="highlight">${name}</span>!</p>
        <p>
          ${isLastDay
            ? 'Seu trial PRO termina hoje! Para continuar usando todas as funcionalidades, assine agora.'
            : `Seu trial PRO expira em ${daysRemaining} dias. Nao perca acesso aos 23 especialistas de IA e todas as funcionalidades PRO.`
          }
        </p>
        <div class="divider"></div>
        <p>
          Com o plano PRO, voce continua tendo:
        </p>
        <ul style="color: #CAB792; padding-left: 20px;">
          <li>Ate 3 marcas ativas</li>
          <li>300 consultas por mes</li>
          <li>Todos os modos de chat especializados</li>
          <li>Suporte prioritario</li>
        </ul>
        <a href="${APP_URL}/settings/billing" class="button">
          ${isLastDay ? 'Assinar Agora' : 'Ver Planos'}
        </a>
        <p style="font-size: 14px; color: #AB8648;">
          Apos o trial, sua conta sera convertida para o plano Free com recursos limitados.
        </p>
      </div>
    `);

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: isLastDay
        ? 'Ultimo dia! Seu trial MktHoney termina hoje'
        : `Seu trial MktHoney expira em ${daysRemaining} dias`,
      html,
    });

    if (error) {
      console.error('[Email] Trial expiring email failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Trial expiring email error:', message);
    return { success: false, error: message };
  }
}

/**
 * Sends cancellation confirmation.
 */
export async function sendCancellationEmail(
  to: string,
  name: string,
  accessUntilDate: string
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) return { success: false, error: 'RESEND_API_KEY not configured' };
  try {
    const html = baseTemplate(`
      <div class="card">
        <h1>Assinatura Cancelada</h1>
        <p>Ola, <span class="highlight">${name}</span>.</p>
        <p>
          Confirmamos o cancelamento da sua assinatura MktHoney.
          Voce ainda tera acesso completo ate <span class="highlight">${accessUntilDate}</span>.
        </p>
        <p>
          Apos essa data, sua conta sera convertida para o plano Free.
          Seus dados e historico serao mantidos.
        </p>
        <div class="divider"></div>
        <p>
          Sentiremos sua falta! Se mudar de ideia, voce pode reativar
          sua assinatura a qualquer momento.
        </p>
        <a href="${APP_URL}/settings/billing" class="button">Reativar Assinatura</a>
        <p style="font-size: 14px; color: #AB8648;">
          Tem algum feedback? Responda este email — adorariamos saber como podemos melhorar.
        </p>
      </div>
    `);

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Confirmacao de Cancelamento - MktHoney',
      html,
    });

    if (error) {
      console.error('[Email] Cancellation email failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Cancellation email error:', message);
    return { success: false, error: message };
  }
}

/**
 * Sends payment failed notification.
 */
export async function sendPaymentFailedEmail(
  to: string,
  name: string,
  retryUrl: string
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) return { success: false, error: 'RESEND_API_KEY not configured' };
  try {
    const html = baseTemplate(`
      <div class="card">
        <h1>Falha no Pagamento</h1>
        <p>Ola, <span class="highlight">${name}</span>.</p>
        <p>
          Nao conseguimos processar seu ultimo pagamento.
          Por favor, atualize suas informacoes de pagamento para evitar a interrupcao do servico.
        </p>
        <a href="${retryUrl}" class="button">Atualizar Pagamento</a>
        <p style="font-size: 14px; color: #AB8648;">
          Se voce acha que isso e um erro ou precisa de ajuda,
          entre em contato com nosso suporte.
        </p>
      </div>
    `);

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Acao necessaria: Falha no pagamento - MktHoney',
      html,
    });

    if (error) {
      console.error('[Email] Payment failed email failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Payment failed email error:', message);
    return { success: false, error: message };
  }
}

// ============================================
// TRIAL NURTURING SEQUENCE (T6)
// ============================================

/**
 * Trial Day 1: Onboarding nudge — only sent if onboarding not completed.
 */
export async function sendTrialDay1Email(
  to: string,
  name: string
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) return { success: false, error: 'RESEND_API_KEY not configured' };
  try {
    const html = baseTemplate(`
      <div class="card">
        <h1>Seu MKTHONEY está quase pronto</h1>
        <p>Olá, <span class="highlight">${name}</span>!</p>
        <p>
          Falta só um passo para ativar os 23 especialistas
          de IA da sua conta: o briefing inicial.
        </p>
        <p>Em 3 minutos, você configura:</p>
        <ul style="color: #CAB792; padding-left: 20px;">
          <li>Nome e vertical da sua marca</li>
          <li>Tom de voz e posicionamento</li>
          <li>Público-alvo e oferta principal</li>
        </ul>
        <p>
          Com essas informações, todos os especialistas passam a gerar
          recomendações personalizadas para o seu negócio.
        </p>
        <a href="${APP_URL}/welcome" class="button">Completar Meu Briefing</a>
        <p style="font-size: 14px; color: #AB8648;">
          Se já completou o briefing, ignore este email.
          Estamos verificando automaticamente.
        </p>
      </div>
    `);

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Complete seu briefing em 3 minutos — MktHoney',
      html,
    });

    if (error) {
      console.error('[Email] Trial day 1 email failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Trial day 1 email error:', message);
    return { success: false, error: message };
  }
}

/**
 * Trial Day 3: First value — encourage first chat consultation.
 */
export async function sendTrialDay3Email(
  to: string,
  name: string
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) return { success: false, error: 'RESEND_API_KEY not configured' };
  try {
    const html = baseTemplate(`
      <div class="card">
        <h1>Hora de testar os especialistas</h1>
        <p>Olá, <span class="highlight">${name}</span>!</p>
        <p>Seu trial PRO está ativo há 3 dias. Já consultou algum especialista?</p>
        <p>Experimente agora:</p>
        <div class="info-box">
          <p style="margin: 0; font-style: italic; color: #F5E8CE;">
            "Analise meu funil de vendas atual e me diga os 3 maiores gargalos."
          </p>
        </div>
        <p>
          Os 23 especialistas vão cruzar referências de frameworks como
          Value Ladder, StoryBrand e Copy Lógica para te dar um
          diagnóstico que levaria semanas com uma consultoria tradicional.
        </p>
        <a href="${APP_URL}/chat" class="button">Iniciar Minha Primeira Consulta</a>
        <p style="font-size: 14px; color: #AB8648;">
          Cada consulta gasta 1 crédito. Você tem 300/mês no trial PRO.
        </p>
      </div>
    `);

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Peça seu primeiro diagnóstico ao MKTHONEY',
      html,
    });

    if (error) {
      console.error('[Email] Trial day 3 email failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Trial day 3 email error:', message);
    return { success: false, error: message };
  }
}

/**
 * Trial Day 5: Feature spotlight — Offer Lab.
 */
export async function sendTrialDay5Email(
  to: string,
  name: string
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) return { success: false, error: 'RESEND_API_KEY not configured' };
  try {
    const html = baseTemplate(`
      <div class="card">
        <h1>Teste sua oferta antes do mercado testar</h1>
        <p>Olá, <span class="highlight">${name}</span>!</p>
        <p>
          Uma das ferramentas que nossos usuários mais usam
          é o Offer Lab — um simulador que analisa sua oferta sob 8
          perspectivas diferentes.
        </p>
        <p>O que o Offer Lab avalia:</p>
        <ul style="color: #CAB792; padding-left: 20px;">
          <li>Clareza da proposta de valor</li>
          <li>Força do headline e hook</li>
          <li>Risco percebido vs. recompensa</li>
          <li>Urgência e escassez</li>
          <li>Prova social e autoridade</li>
          <li>Comparação com concorrência</li>
        </ul>
        <p>
          Muitos descobrem gaps na oferta que estavam custando
          conversões sem saber.
        </p>
        <a href="${APP_URL}/intelligence/offer-lab" class="button">Testar Minha Oferta</a>
        <p style="font-size: 14px; color: #AB8648;">
          Disponível durante todo o trial PRO. Após o trial,
          requer plano Starter ou superior.
        </p>
      </div>
    `);

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Sua oferta resiste a um stress test? — MktHoney',
      html,
    });

    if (error) {
      console.error('[Email] Trial day 5 email failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Trial day 5 email error:', message);
    return { success: false, error: message };
  }
}

/**
 * Trial Day 7: Mid-trial checklist.
 */
export async function sendTrialDay7Email(
  to: string,
  name: string
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) return { success: false, error: 'RESEND_API_KEY not configured' };
  try {
    const html = baseTemplate(`
      <div class="card">
        <h1>Metade do trial — checklist de aproveitamento</h1>
        <p>Olá, <span class="highlight">${name}</span>!</p>
        <p>Você está na metade do seu trial PRO. Aqui está o que os usuários mais ativos fazem:</p>
        <div class="info-box">
          <p style="margin: 0 0 8px 0; color: #CAB792;">✅ Completar o briefing da marca</p>
          <p style="margin: 0 0 8px 0; color: #CAB792;">✅ Fazer pelo menos 5 consultas ao chat</p>
          <p style="margin: 0 0 8px 0; color: #CAB792;">✅ Testar o Offer Lab</p>
          <p style="margin: 0 0 8px 0; color: #CAB792;">✅ Gerar um funil completo</p>
          <p style="margin: 0; color: #CAB792;">✅ Experimentar o Party Mode (debate entre especialistas)</p>
        </div>
        <p>
          Se fez tudo isso, já tem uma boa base para decidir.
          Se não, ainda dá tempo — faltam 7 dias.
        </p>
        <p>
          Dica: O Party Mode coloca vários especialistas
          debatendo sobre uma questão sua. É o recurso mais
          diferenciado do MKTHONEY.
        </p>
        <a href="${APP_URL}" class="button">Abrir Meu Dashboard</a>
        <p style="font-size: 14px; color: #AB8648;">Faltam 7 dias de trial PRO.</p>
      </div>
    `);

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Como extrair o máximo do MKTHONEY nos próximos 7 dias',
      html,
    });

    if (error) {
      console.error('[Email] Trial day 7 email failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Trial day 7 email error:', message);
    return { success: false, error: message };
  }
}

/**
 * Trial Day 10: Soft urgency — 4 days remaining with PRO vs Free comparison.
 */
export async function sendTrialDay10Email(
  to: string,
  name: string
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) return { success: false, error: 'RESEND_API_KEY not configured' };
  try {
    const html = baseTemplate(`
      <div class="card">
        <h1>4 dias para decidir</h1>
        <p>Olá, <span class="highlight">${name}</span>!</p>
        <p>Seu trial PRO expira em 4 dias.</p>
        <p>Após a expiração, sua conta será convertida para o plano Free:</p>
        <div class="info-box">
          <table style="width: 100%; font-size: 14px; color: #CAB792; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #3A3530;">
                <th style="text-align: left; padding: 8px; color: #E6B447;">PRO (trial atual)</th>
                <th style="text-align: left; padding: 8px; color: #AB8648;">Free (após expirar)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="padding: 6px 8px;">3 marcas</td><td style="padding: 6px 8px;">1 marca</td></tr>
              <tr><td style="padding: 6px 8px;">300 consultas/mês</td><td style="padding: 6px 8px;">10 consultas/mês</td></tr>
              <tr><td style="padding: 6px 8px;">Todos os modos de chat</td><td style="padding: 6px 8px;">Apenas modo Geral</td></tr>
              <tr><td style="padding: 6px 8px;">Offer Lab, Autopsy</td><td style="padding: 6px 8px;">Indisponível</td></tr>
              <tr><td style="padding: 6px 8px;">Party Mode</td><td style="padding: 6px 8px;">Indisponível</td></tr>
            </tbody>
          </table>
        </div>
        <p>Seus dados e histórico serão mantidos. Se assinar depois, tudo volta.</p>
        <a href="${APP_URL}/settings/billing" class="button">Ver Planos e Preços</a>
        <p style="font-size: 14px; color: #AB8648;">A partir de R$97/mês. Cancele quando quiser.</p>
      </div>
    `);

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Faltam 4 dias do seu trial PRO — MktHoney',
      html,
    });

    if (error) {
      console.error('[Email] Trial day 10 email failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Trial day 10 email error:', message);
    return { success: false, error: message };
  }
}

/**
 * Trial Day 12: Hard urgency — 2 days remaining.
 */
export async function sendTrialDay12Email(
  to: string,
  name: string
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) return { success: false, error: 'RESEND_API_KEY not configured' };
  try {
    const html = baseTemplate(`
      <div class="card">
        <h1>Último aviso antes da conversão</h1>
        <p>Olá, <span class="highlight">${name}</span>!</p>
        <p>
          Em 2 dias seu trial PRO expira e sua conta
          será automaticamente convertida para o plano Free.
        </p>
        <p>O que você perde:</p>
        <ul style="color: #CAB792; padding-left: 20px;">
          <li>Acesso aos 23 especialistas (fica só modo Geral)</li>
          <li>Offer Lab, Autopsy, Spy Agent</li>
          <li>Party Mode (debate entre especialistas)</li>
          <li>290 consultas/mês (Free tem 10)</li>
          <li>2 marcas adicionais</li>
        </ul>
        <p>
          Se o MKTHONEY gerou algum insight valioso nos últimos 12 dias,
          considere manter o acesso.
        </p>
        <a href="${APP_URL}/settings/billing" class="button">Assinar Agora</a>
        <p style="font-size: 14px; color: #AB8648;">
          Garantia de 7 dias (CDC Art. 49).
          Não gostou? Reembolso integral, sem perguntas.
        </p>
      </div>
    `);

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '2 dias para o fim do trial — MktHoney',
      html,
    });

    if (error) {
      console.error('[Email] Trial day 12 email failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Trial day 12 email error:', message);
    return { success: false, error: message };
  }
}
