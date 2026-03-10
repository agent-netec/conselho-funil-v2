import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso | MKTHONEY',
  description: 'Termos de uso da plataforma MKTHONEY',
};

/**
 * Terms of Use page.
 * Standard SaaS terms for Brazilian market.
 * [PLACEHOLDERS] for company data.
 */
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mkthoney.com' },
    { '@type': 'ListItem', position: 2, name: 'Termos de Uso', item: 'https://mkthoney.com/terms' },
  ],
};

export default function TermsPage() {
  return (
    <article className="prose prose-invert prose-zinc max-w-none">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs text-zinc-500 mb-2">
          Ultima atualizacao: 26 de fevereiro de 2026
        </p>
        <h1 className="text-3xl font-bold text-white mb-4">Termos de Uso</h1>
        <p className="text-zinc-400 text-lg">
          Ao acessar e usar a plataforma MKTHONEY, voce concorda com estes termos.
        </p>
      </div>

      {/* Navigation */}
      <nav className="mb-12 p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Navegacao rapida</p>
        <ul className="grid grid-cols-2 gap-2 list-none pl-0">
          <li><a href="#definicoes" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">1. Definicoes</a></li>
          <li><a href="#objeto" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">2. Objeto</a></li>
          <li><a href="#cadastro" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">3. Cadastro</a></li>
          <li><a href="#licenca" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">4. Licenca de Uso</a></li>
          <li><a href="#obrigacoes" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">5. Obrigacoes</a></li>
          <li><a href="#pagamento" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">6. Pagamento</a></li>
          <li><a href="#propriedade" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">7. Propriedade Intelectual</a></li>
          <li><a href="#limitacao" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">8. Limitacao de Responsabilidade</a></li>
          <li><a href="#suspensao" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">9. Suspensao e Cancelamento</a></li>
          <li><a href="#disposicoes" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">10. Disposicoes Gerais</a></li>
        </ul>
      </nav>

      {/* Content */}
      <section id="definicoes" className="mb-10">
        <h2 className="text-xl font-semibold text-white">1. Definicoes</h2>
        <p>Para os fins destes Termos de Uso:</p>
        <ul>
          <li><strong>Plataforma</strong>: sistema MKTHONEY, acessivel via web, que oferece ferramentas de criacao, gestao e otimizacao de funis de vendas com inteligencia artificial.</li>
          <li><strong>Usuario</strong>: pessoa fisica ou juridica que se cadastra e utiliza a Plataforma.</li>
          <li><strong>Conteudo</strong>: textos, imagens, videos, dados e quaisquer materiais inseridos pelo Usuario na Plataforma.</li>
          <li><strong>Servicos</strong>: funcionalidades oferecidas pela Plataforma, incluindo geracao de conteudo por IA, analise de funis e gestao de campanhas.</li>
        </ul>
      </section>

      <section id="objeto" className="mb-10">
        <h2 className="text-xl font-semibold text-white">2. Objeto</h2>
        <p>
          Estes Termos regulam o acesso e uso da Plataforma MKTHONEY, um software como servico (SaaS)
          que fornece ferramentas de marketing digital e inteligencia artificial para criacao e
          otimizacao de funis de vendas.
        </p>
        <p>
          A LEVIARK INTERMEDIACOES LTDA reserva-se o direito de modificar, suspender ou
          descontinuar qualquer funcionalidade da Plataforma a qualquer momento, mediante aviso
          previo de 30 (trinta) dias.
        </p>
      </section>

      <section id="cadastro" className="mb-10">
        <h2 className="text-xl font-semibold text-white">3. Cadastro e Conta</h2>
        <p>Para utilizar a Plataforma, o Usuario deve:</p>
        <ul>
          <li>Ter capacidade legal para contratar (maior de 18 anos ou empresa regularmente constituida);</li>
          <li>Fornecer informacoes verdadeiras, completas e atualizadas no cadastro;</li>
          <li>Manter a confidencialidade de suas credenciais de acesso;</li>
          <li>Comunicar imediatamente qualquer uso nao autorizado de sua conta.</li>
        </ul>
        <p>
          O Usuario e integralmente responsavel por todas as atividades realizadas em sua conta,
          inclusive por terceiros autorizados.
        </p>
      </section>

      <section id="licenca" className="mb-10">
        <h2 className="text-xl font-semibold text-white">4. Licenca de Uso</h2>
        <p>
          Mediante o pagamento das tarifas aplicaveis, a LEVIARK INTERMEDIACOES LTDA concede ao Usuario uma
          licenca limitada, nao exclusiva, nao transferivel e revogavel para acessar e usar a
          Plataforma durante a vigencia da assinatura.
        </p>
        <p>Esta licenca NAO inclui:</p>
        <ul>
          <li>Direito de sublicenciar, vender ou transferir o acesso a terceiros;</li>
          <li>Modificar, adaptar ou criar obras derivadas da Plataforma;</li>
          <li>Fazer engenharia reversa, descompilar ou desmontar qualquer parte do software;</li>
          <li>Usar a Plataforma para desenvolver produto ou servico concorrente;</li>
          <li>Acessar a Plataforma por meios automatizados (bots, scrapers) sem autorizacao.</li>
        </ul>
      </section>

      <section id="obrigacoes" className="mb-10">
        <h2 className="text-xl font-semibold text-white">5. Obrigacoes do Usuario</h2>
        <p>O Usuario compromete-se a:</p>
        <ul>
          <li>Utilizar a Plataforma apenas para fins licitos e em conformidade com a legislacao vigente;</li>
          <li>Nao inserir conteudo ilegal, difamatorio, obsceno, discriminatorio ou que viole direitos de terceiros;</li>
          <li>Nao tentar violar a seguranca da Plataforma ou acessar dados de outros usuarios;</li>
          <li>Nao utilizar a Plataforma para envio de spam ou comunicacoes nao solicitadas;</li>
          <li>Respeitar os limites de uso estabelecidos para cada plano de assinatura.</li>
        </ul>
      </section>

      <section id="pagamento" className="mb-10">
        <h2 className="text-xl font-semibold text-white">6. Pagamento e Renovacao</h2>
        <p>
          Os precos e condicoes de pagamento estao disponiveis na pagina de planos da Plataforma.
          Salvo indicacao em contrario:
        </p>
        <ul>
          <li>As assinaturas sao renovadas automaticamente ao final de cada ciclo de faturamento;</li>
          <li>O Usuario pode cancelar a renovacao automatica a qualquer momento antes do vencimento;</li>
          <li>Nao ha reembolso proporcional para cancelamentos realizados no meio do ciclo, exceto conforme previsto na Politica de Reembolso;</li>
          <li>A LEVIARK INTERMEDIACOES LTDA pode reajustar os precos mediante aviso previo de 30 (trinta) dias.</li>
        </ul>
      </section>

      <section id="propriedade" className="mb-10">
        <h2 className="text-xl font-semibold text-white">7. Propriedade Intelectual</h2>
        <p>
          <strong>Da Plataforma</strong>: Todos os direitos de propriedade intelectual sobre a
          Plataforma, incluindo codigo-fonte, design, marcas e documentacao, pertencem exclusivamente
          a LEVIARK INTERMEDIACOES LTDA ou seus licenciadores.
        </p>
        <p>
          <strong>Do Conteudo do Usuario</strong>: O Usuario mantem a titularidade sobre o Conteudo
          que inserir na Plataforma. Ao utilizar os Servicos, o Usuario concede a LEVIARK INTERMEDIACOES LTDA uma
          licenca mundial, nao exclusiva e isenta de royalties para processar, armazenar e exibir
          esse Conteudo exclusivamente para prestacao dos Servicos.
        </p>
        <p>
          <strong>Conteudo Gerado por IA</strong>: O conteudo gerado pela inteligencia artificial da
          Plataforma e licenciado ao Usuario para uso em suas campanhas, sujeito aos termos da assinatura.
        </p>
      </section>

      <section id="limitacao" className="mb-10">
        <h2 className="text-xl font-semibold text-white">8. Limitacao de Responsabilidade</h2>
        <p>A LEVIARK INTERMEDIACOES LTDA NAO se responsabiliza por:</p>
        <ul>
          <li>Resultados comerciais decorrentes do uso da Plataforma;</li>
          <li>Interrupcoes temporarias para manutencao ou atualizacoes;</li>
          <li>Perdas de dados causadas por falha do Usuario ou forca maior;</li>
          <li>Conteudo inserido pelos Usuarios ou resultados de campanhas;</li>
          <li>Danos indiretos, especiais, incidentais ou consequenciais.</li>
        </ul>
        <p>
          Em qualquer caso, a responsabilidade total da LEVIARK INTERMEDIACOES LTDA esta limitada ao valor
          pago pelo Usuario nos ultimos 12 (doze) meses de assinatura.
        </p>
      </section>

      <section id="suspensao" className="mb-10">
        <h2 className="text-xl font-semibold text-white">9. Suspensao e Cancelamento</h2>
        <p>
          <strong>Suspensao</strong>: A LEVIARK INTERMEDIACOES LTDA pode suspender o acesso do Usuario em caso de:
        </p>
        <ul>
          <li>Violacao destes Termos;</li>
          <li>Inadimplencia superior a 15 (quinze) dias;</li>
          <li>Uso abusivo que comprometa a estabilidade da Plataforma;</li>
          <li>Determinacao judicial ou administrativa.</li>
        </ul>
        <p>
          <strong>Cancelamento pelo Usuario</strong>: O Usuario pode cancelar sua assinatura a
          qualquer momento atraves das configuracoes da conta. Consulte a Politica de Reembolso
          para detalhes sobre devolucao de valores.
        </p>
        <p>
          <strong>Cancelamento pela Empresa</strong>: A LEVIARK INTERMEDIACOES LTDA pode encerrar a conta do
          Usuario por justa causa, mediante notificacao previa de 7 (sete) dias, exceto em casos
          de violacao grave que justifiquem encerramento imediato.
        </p>
      </section>

      <section id="disposicoes" className="mb-10">
        <h2 className="text-xl font-semibold text-white">10. Disposicoes Gerais</h2>
        <p>
          <strong>Alteracoes</strong>: Estes Termos podem ser alterados a qualquer momento.
          Alteracoes substanciais serao comunicadas com antecedencia de 30 (trinta) dias.
          O uso continuado da Plataforma apos esse periodo constitui aceite das alteracoes.
        </p>
        <p>
          <strong>Nulidade</strong>: Se qualquer disposicao destes Termos for considerada nula
          ou inexequivel, as demais disposicoes permanecerao em pleno vigor.
        </p>
        <p>
          <strong>Foro</strong>: Fica eleito o foro da comarca de Sao Paulo/SP, Brasil,
          para dirimir quaisquer controversias decorrentes destes Termos.
        </p>
      </section>

      {/* Contact */}
      <section className="mt-12 p-6 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
        <h3 className="text-lg font-semibold text-white mb-2">Duvidas?</h3>
        <p className="text-zinc-400 mb-4">
          Entre em contato com nosso suporte juridico:
        </p>
        <p className="text-[#E6B447]">support@mkthoney.com</p>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </article>
  );
}
