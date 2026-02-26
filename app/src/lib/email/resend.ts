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
          <li>23 conselheiros de IA especializados</li>
          <li>Sistema de debate multi-agentes</li>
          <li>Diagnostico de funil (Autopsy)</li>
          <li>Inteligencia competitiva (Spy Agent)</li>
          <li>Calendario de conteudo com auto-publicacao</li>
        </ul>
        <a href="${APP_URL}/dashboard" class="button">Acessar Meu Dashboard</a>
        <p style="font-size: 14px; color: #AB8648;">
          Dicas: Comece criando sua primeira marca no Brand Hub para
          personalizar as recomendacoes dos conselheiros.
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
            : `Seu trial PRO expira em ${daysRemaining} dias. Nao perca acesso aos 23 conselheiros de IA e todas as funcionalidades PRO.`
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
