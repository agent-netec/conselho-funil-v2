import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politica de Cookies | MKTHONEY',
  description: 'Politica de cookies da plataforma MKTHONEY',
};

/**
 * Cookie Policy page.
 * Lists all cookies by category with purpose and duration.
 */
export default function CookiesPage() {
  return (
    <article className="prose prose-invert prose-zinc max-w-none">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs text-zinc-500 mb-2">
          Ultima atualizacao: 26 de fevereiro de 2026
        </p>
        <h1 className="text-3xl font-bold text-white mb-4">Politica de Cookies</h1>
        <p className="text-zinc-400 text-lg">
          Esta politica explica como usamos cookies e tecnologias similares para
          reconhecer voce quando visita nossa plataforma.
        </p>
      </div>

      {/* What are cookies */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white">O que sao cookies?</h2>
        <p>
          Cookies sao pequenos arquivos de texto armazenados em seu dispositivo (computador,
          smartphone ou tablet) quando voce visita um site. Eles permitem que o site lembre
          suas acoes e preferencias ao longo do tempo.
        </p>
        <p>
          Tambem utilizamos tecnologias similares como pixels, web beacons e armazenamento
          local (localStorage) para propositos semelhantes.
        </p>
      </section>

      {/* Cookie categories */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white">Categorias de Cookies</h2>
        <p>Usamos tres categorias de cookies:</p>

        {/* Essential */}
        <div className="mt-8 p-6 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <span className="text-blue-400 text-lg">🔒</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white m-0">Cookies Essenciais</h3>
              <p className="text-xs text-zinc-500 m-0">Sempre ativos - necessarios para funcionamento</p>
            </div>
          </div>
          <p className="text-sm text-zinc-300 mb-4">
            Esses cookies sao estritamente necessarios para fornecer servicos disponiveis
            atraves de nossa plataforma e para usar alguns de seus recursos, como login
            e gerenciamento de sessao. Sem esses cookies, os servicos que voce solicitou
            nao podem ser fornecidos.
          </p>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.1]">
                <th className="text-left py-2 text-zinc-300">Nome</th>
                <th className="text-left py-2 text-zinc-300">Finalidade</th>
                <th className="text-left py-2 text-zinc-300">Duracao</th>
                <th className="text-left py-2 text-zinc-300">Provedor</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.06]">
                <td className="py-2 font-mono text-xs">__session</td>
                <td className="py-2">Sessao de autenticacao Firebase</td>
                <td className="py-2">Sessao</td>
                <td className="py-2">Firebase</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-2 font-mono text-xs">mkthoney_cookie_consent</td>
                <td className="py-2">Armazena preferencias de cookies</td>
                <td className="py-2">1 ano</td>
                <td className="py-2">MKTHONEY</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-2 font-mono text-xs">__cf_bm</td>
                <td className="py-2">Protecao anti-bot Cloudflare</td>
                <td className="py-2">30 min</td>
                <td className="py-2">Cloudflare</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-2 font-mono text-xs">_vercel_*</td>
                <td className="py-2">Roteamento e balanceamento de carga</td>
                <td className="py-2">Sessao</td>
                <td className="py-2">Vercel</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Analytics */}
        <div className="mt-6 p-6 rounded-xl bg-[#E6B447]/5 border border-[#E6B447]/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E6B447]/10">
              <span className="text-[#E6B447] text-lg">📊</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white m-0">Cookies Analiticos</h3>
              <p className="text-xs text-zinc-500 m-0">Opt-in - requer seu consentimento</p>
            </div>
          </div>
          <p className="text-sm text-zinc-300 mb-4">
            Esses cookies nos ajudam a entender como os visitantes interagem com nossa
            plataforma, coletando e relatando informacoes anonimamente. Isso nos permite
            melhorar continuamente a experiencia do usuario.
          </p>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.1]">
                <th className="text-left py-2 text-zinc-300">Nome</th>
                <th className="text-left py-2 text-zinc-300">Finalidade</th>
                <th className="text-left py-2 text-zinc-300">Duracao</th>
                <th className="text-left py-2 text-zinc-300">Provedor</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.06]">
                <td className="py-2 font-mono text-xs">ph_*</td>
                <td className="py-2">Analytics de produto (cliques, navegacao)</td>
                <td className="py-2">1 ano</td>
                <td className="py-2">PostHog</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-2 font-mono text-xs">__ph_opt_in_out_*</td>
                <td className="py-2">Preferencia de opt-out de rastreamento</td>
                <td className="py-2">1 ano</td>
                <td className="py-2">PostHog</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-2 font-mono text-xs">distinct_id</td>
                <td className="py-2">Identificador anonimo de sessao</td>
                <td className="py-2">1 ano</td>
                <td className="py-2">PostHog</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Marketing */}
        <div className="mt-6 p-6 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <span className="text-purple-400 text-lg">📢</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white m-0">Cookies de Marketing</h3>
              <p className="text-xs text-zinc-500 m-0">Opt-in - requer seu consentimento</p>
            </div>
          </div>
          <p className="text-sm text-zinc-300 mb-4">
            Esses cookies sao usados para rastrear visitantes em varios sites. A intencao
            e exibir anuncios que sejam relevantes e envolventes para o usuario individual
            e, portanto, mais valiosos para editores e anunciantes terceirizados.
          </p>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.1]">
                <th className="text-left py-2 text-zinc-300">Nome</th>
                <th className="text-left py-2 text-zinc-300">Finalidade</th>
                <th className="text-left py-2 text-zinc-300">Duracao</th>
                <th className="text-left py-2 text-zinc-300">Provedor</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.06]">
                <td className="py-2 font-mono text-xs">_fbp</td>
                <td className="py-2">Pixel do Facebook para remarketing</td>
                <td className="py-2">3 meses</td>
                <td className="py-2">Meta</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-2 font-mono text-xs">_fbc</td>
                <td className="py-2">Atribuicao de cliques em anuncios</td>
                <td className="py-2">2 anos</td>
                <td className="py-2">Meta</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="py-2 font-mono text-xs">fr</td>
                <td className="py-2">Entrega de anuncios Facebook</td>
                <td className="py-2">3 meses</td>
                <td className="py-2">Meta</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* How to manage */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white">Como gerenciar seus cookies</h2>

        <h3 className="text-lg font-medium text-white mt-6">Na nossa plataforma</h3>
        <p>
          Ao acessar a plataforma pela primeira vez, voce vera um banner de cookies onde
          pode aceitar todos, rejeitar cookies opcionais ou personalizar suas preferencias.
          Voce pode alterar suas preferencias a qualquer momento nas configuracoes da conta.
        </p>

        <h3 className="text-lg font-medium text-white mt-6">No seu navegador</h3>
        <p>
          A maioria dos navegadores permite que voce controle cookies atraves das configuracoes.
          Voce pode bloquear cookies de terceiros, limpar cookies ao fechar o navegador ou
          receber alertas quando um cookie esta sendo definido.
        </p>
        <ul>
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#E6B447]">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/pt-BR/kb/cookies-informacoes-sites-armazenam-no-computador" target="_blank" rel="noopener noreferrer" className="text-[#E6B447]">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#E6B447]">Apple Safari</a></li>
          <li><a href="https://support.microsoft.com/pt-br/microsoft-edge/excluir-cookies-no-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[#E6B447]">Microsoft Edge</a></li>
        </ul>

        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-200 m-0">
            <strong>Atencao:</strong> Desabilitar cookies essenciais pode afetar o funcionamento
            da plataforma, incluindo a impossibilidade de fazer login ou usar funcionalidades
            basicas.
          </p>
        </div>
      </section>

      {/* Updates */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white">Atualizacoes desta politica</h2>
        <p>
          Podemos atualizar esta Politica de Cookies periodicamente para refletir alteracoes
          em nossas praticas ou por outros motivos operacionais, legais ou regulatorios.
          Recomendamos que voce revise esta pagina regularmente para se manter informado
          sobre o uso de cookies.
        </p>
      </section>

      {/* Contact */}
      <section className="mt-12 p-6 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
        <h3 className="text-lg font-semibold text-white mb-2">Duvidas sobre cookies?</h3>
        <p className="text-zinc-400 mb-4">
          Entre em contato com nosso time de privacidade:
        </p>
        <p className="text-[#E6B447]">support@mkthoney.com</p>
      </section>
    </article>
  );
}
