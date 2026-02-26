import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politica de Reembolso | MKTHONEY',
  description: 'Politica de reembolso e cancelamento da plataforma MKTHONEY',
};

/**
 * Refund Policy page.
 * 7-day CDC guarantee + pro-rata for annual plans.
 */
export default function RefundPage() {
  return (
    <article className="prose prose-invert prose-zinc max-w-none">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs text-zinc-500 mb-2">
          Ultima atualizacao: 26 de fevereiro de 2026
        </p>
        <h1 className="text-3xl font-bold text-white mb-4">Politica de Reembolso</h1>
        <p className="text-zinc-400 text-lg">
          Nosso compromisso com sua satisfacao e a transparencia sobre nossos processos
          de cancelamento e reembolso.
        </p>
      </div>

      {/* Highlight box */}
      <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-10">
        <h2 className="text-lg font-semibold text-emerald-400 mt-0">
          Garantia de 7 dias (CDC Art. 49)
        </h2>
        <p className="text-zinc-300 mb-0">
          Em conformidade com o Codigo de Defesa do Consumidor, voce pode desistir da
          contratacao em ate <strong>7 (sete) dias corridos</strong> apos a data da compra,
          recebendo reembolso integral, sem necessidade de justificativa.
        </p>
      </div>

      {/* Right of withdrawal */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white">Direito de Arrependimento (7 dias)</h2>
        <p>
          De acordo com o Artigo 49 do Codigo de Defesa do Consumidor (Lei 8.078/1990),
          o consumidor pode desistir do contrato no prazo de 7 dias a contar da assinatura
          ou do ato de recebimento do produto/servico, sempre que a contratacao ocorrer
          fora do estabelecimento comercial (compra online).
        </p>

        <h3 className="text-lg font-medium text-white mt-6">Como funciona:</h3>
        <ol>
          <li>Solicite o cancelamento atraves das configuracoes da conta ou por e-mail</li>
          <li>Confirmaremos o recebimento em ate 2 dias uteis</li>
          <li>O reembolso sera processado em ate 10 dias uteis</li>
          <li>O valor sera creditado no mesmo meio de pagamento utilizado na compra</li>
        </ol>

        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mt-6">
          <p className="text-sm text-blue-200 m-0">
            <strong>Importante:</strong> Apos o periodo de 7 dias, o direito de arrependimento
            nao se aplica, mas voce ainda pode cancelar sua assinatura a qualquer momento
            (veja as condicoes abaixo).
          </p>
        </div>
      </section>

      {/* Monthly plans */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white">Planos Mensais</h2>
        <p>Para assinaturas mensais apos o periodo de 7 dias:</p>
        <ul>
          <li>Voce pode cancelar a qualquer momento nas configuracoes da conta</li>
          <li>O acesso permanece ativo ate o final do periodo ja pago</li>
          <li><strong>Nao ha reembolso proporcional</strong> para dias nao utilizados no mes corrente</li>
          <li>A renovacao automatica sera interrompida imediatamente</li>
        </ul>

        <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06] mt-6">
          <p className="text-sm text-zinc-400 m-0">
            <strong>Exemplo:</strong> Se voce assinou em 01/01 e cancelou em 15/01, tera acesso
            ate 31/01 (fim do ciclo), mas nao recebera reembolso dos 16 dias restantes.
          </p>
        </div>
      </section>

      {/* Annual plans */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white">Planos Anuais (Pro-rata)</h2>
        <p>
          Para assinaturas anuais, oferecemos reembolso <strong>pro-rata</strong> dos meses
          nao utilizados quando o cancelamento ocorre apos os primeiros 30 dias:
        </p>

        <h3 className="text-lg font-medium text-white mt-6">Calculo do reembolso:</h3>
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06] font-mono text-sm">
          <p className="m-0">Reembolso = (Valor anual / 12) x Meses restantes</p>
          <p className="text-zinc-500 mt-2 m-0">
            * Meses iniciados sao considerados como utilizados
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06] mt-6">
          <p className="text-sm text-zinc-400 mb-2">
            <strong>Exemplo:</strong>
          </p>
          <ul className="text-sm text-zinc-400 mb-0">
            <li>Plano anual: R$ 1.200,00 (equivalente a R$ 100/mes)</li>
            <li>Cancelamento apos 4 meses de uso</li>
            <li>Reembolso: R$ 100 x 8 meses = R$ 800,00</li>
          </ul>
        </div>

        <h3 className="text-lg font-medium text-white mt-6">Condicoes:</h3>
        <ul>
          <li>O reembolso pro-rata nao se aplica nos primeiros 30 dias (use o direito de arrependimento)</li>
          <li>Descontos promocionais serao considerados no calculo proporcional</li>
          <li>O processamento pode levar ate 15 dias uteis</li>
        </ul>
      </section>

      {/* Exceptions */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white">Situacoes que NAO dao direito a reembolso</h2>
        <ul>
          <li>Violacao dos Termos de Uso que resulte em cancelamento pela empresa</li>
          <li>Uso indevido da plataforma ou tentativa de fraude</li>
          <li>Solicitacao apos o termino do ciclo de faturamento</li>
          <li>Creditos ou consumo de IA ja utilizados (sao irrecuperaveis)</li>
        </ul>
      </section>

      {/* How to request */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white">Como solicitar reembolso</h2>

        <div className="space-y-4 mt-6">
          <div className="flex gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-medium text-white m-0">Acesse sua conta</h4>
              <p className="text-sm text-zinc-400 m-0">
                Va em Configuracoes → Assinatura → Cancelar assinatura
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-medium text-white m-0">Selecione o motivo</h4>
              <p className="text-sm text-zinc-400 m-0">
                Opcionalmente, nos conte por que esta cancelando para melhorarmos
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-medium text-white m-0">Confirme o cancelamento</h4>
              <p className="text-sm text-zinc-400 m-0">
                Se elegivel para reembolso, voce vera o valor estimado antes de confirmar
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex-shrink-0">
              4
            </div>
            <div>
              <h4 className="font-medium text-white m-0">Aguarde o processamento</h4>
              <p className="text-sm text-zinc-400 m-0">
                Reembolsos sao processados em ate 10 dias uteis (pode variar conforme operadora do cartao)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative contact */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white">Contato alternativo</h2>
        <p>
          Se voce encontrar dificuldades para cancelar pela plataforma, entre em contato:
        </p>
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
          <p className="mb-2"><strong>E-mail:</strong> support@mkthoney.com</p>
          <p className="mb-0"><strong>Prazo de resposta:</strong> Ate 2 dias uteis</p>
        </div>
      </section>

      {/* Disputes */}
      <section className="mt-12 p-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <h3 className="text-lg font-semibold text-amber-200 mt-0">Contestacoes e chargebacks</h3>
        <p className="text-zinc-300 mb-0">
          Antes de contestar uma cobranca junto a sua operadora de cartao, por favor entre
          em contato conosco. Contestacoes indevidas podem resultar em bloqueio permanente
          da conta. Estamos comprometidos em resolver qualquer questao de faturamento de
          forma amigavel.
        </p>
      </section>
    </article>
  );
}
