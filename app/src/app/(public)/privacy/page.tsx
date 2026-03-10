import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politica de Privacidade | MKTHONEY',
  description: 'Politica de privacidade e protecao de dados da plataforma MKTHONEY',
};

/**
 * Privacy Policy page.
 * LGPD compliant with data processors listed.
 * [PLACEHOLDERS] for company data.
 */
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mkthoney.com' },
    { '@type': 'ListItem', position: 2, name: 'Política de Privacidade', item: 'https://mkthoney.com/privacy' },
  ],
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert prose-zinc max-w-none">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs text-zinc-500 mb-2">
          Ultima atualizacao: 26 de fevereiro de 2026
        </p>
        <h1 className="text-3xl font-bold text-white mb-4">Politica de Privacidade</h1>
        <p className="text-zinc-400 text-lg">
          Esta Politica descreve como coletamos, usamos e protegemos seus dados pessoais em
          conformidade com a Lei Geral de Protecao de Dados (LGPD - Lei 13.709/2018).
        </p>
      </div>

      {/* Navigation */}
      <nav className="mb-12 p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Navegacao rapida</p>
        <ul className="grid grid-cols-2 gap-2 list-none pl-0">
          <li><a href="#controlador" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">1. Controlador</a></li>
          <li><a href="#dados" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">2. Dados Coletados</a></li>
          <li><a href="#finalidades" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">3. Finalidades</a></li>
          <li><a href="#base-legal" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">4. Base Legal</a></li>
          <li><a href="#compartilhamento" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">5. Compartilhamento</a></li>
          <li><a href="#processadores" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">6. Processadores de Dados</a></li>
          <li><a href="#retencao" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">7. Retencao</a></li>
          <li><a href="#seguranca" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">8. Seguranca</a></li>
          <li><a href="#direitos" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">9. Seus Direitos</a></li>
          <li><a href="#contato" className="text-[#E6B447] hover:text-[#F0C35C] text-sm no-underline">10. Contato</a></li>
        </ul>
      </nav>

      {/* Content */}
      <section id="controlador" className="mb-10">
        <h2 className="text-xl font-semibold text-white">1. Controlador de Dados</h2>
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
          <p className="mb-2"><strong>Razao Social:</strong> LEVIARK INTERMEDIACOES LTDA</p>
          <p className="mb-2"><strong>CNPJ:</strong> 62.625.246/0001-06</p>
          <p className="mb-2"><strong>Endereco:</strong> Av. Republica do Libano, 251 - Sao Paulo/SP</p>
          <p className="mb-2"><strong>E-mail do DPO:</strong> support@mkthoney.com</p>
        </div>
      </section>

      <section id="dados" className="mb-10">
        <h2 className="text-xl font-semibold text-white">2. Dados Pessoais Coletados</h2>
        <p>Coletamos os seguintes dados pessoais:</p>

        <h3 className="text-lg font-medium text-white mt-6">2.1 Dados de Cadastro</h3>
        <ul>
          <li>Nome completo</li>
          <li>Endereco de e-mail</li>
          <li>Telefone (opcional)</li>
          <li>Dados da empresa (se aplicavel): CNPJ, razao social, cargo</li>
        </ul>

        <h3 className="text-lg font-medium text-white mt-6">2.2 Dados de Uso</h3>
        <ul>
          <li>Historico de navegacao na plataforma</li>
          <li>Interacoes com funcionalidades (cliques, tempo de uso)</li>
          <li>Conteudo inserido (textos, imagens, configuracoes de marca)</li>
          <li>Logs de acesso (IP, dispositivo, navegador)</li>
        </ul>

        <h3 className="text-lg font-medium text-white mt-6">2.3 Dados de Pagamento</h3>
        <ul>
          <li>Informacoes de cartao de credito (processadas pelo gateway de pagamento)</li>
          <li>Historico de transacoes</li>
          <li>Dados de faturamento</li>
        </ul>
      </section>

      <section id="finalidades" className="mb-10">
        <h2 className="text-xl font-semibold text-white">3. Finalidades do Tratamento</h2>
        <p>Seus dados sao utilizados para:</p>
        <ul>
          <li><strong>Prestacao do Servico:</strong> fornecer acesso a plataforma, processar comandos de IA, armazenar configuracoes</li>
          <li><strong>Comunicacao:</strong> enviar notificacoes sobre sua conta, atualizacoes de funcionalidades, alertas de seguranca</li>
          <li><strong>Melhoria do Produto:</strong> analisar padroes de uso para aprimorar a experiencia do usuario</li>
          <li><strong>Personalizacao:</strong> adaptar recomendacoes e conteudo gerado por IA ao seu perfil</li>
          <li><strong>Obrigacoes Legais:</strong> cumprir requisitos fiscais, regulatorios e judiciais</li>
          <li><strong>Prevencao a Fraudes:</strong> identificar e prevenir atividades suspeitas</li>
        </ul>
      </section>

      <section id="base-legal" className="mb-10">
        <h2 className="text-xl font-semibold text-white">4. Base Legal (LGPD)</h2>
        <p>O tratamento de seus dados e fundamentado nas seguintes bases legais:</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.1]">
              <th className="text-left py-3 text-zinc-300">Finalidade</th>
              <th className="text-left py-3 text-zinc-300">Base Legal (Art. 7o)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Prestacao do servico</td>
              <td className="py-3">Execucao de contrato (V)</td>
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Comunicacoes essenciais</td>
              <td className="py-3">Execucao de contrato (V)</td>
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Analise de uso (Analytics)</td>
              <td className="py-3">Consentimento (I)</td>
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Marketing direto</td>
              <td className="py-3">Consentimento (I)</td>
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Obrigacoes fiscais</td>
              <td className="py-3">Obrigacao legal (II)</td>
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Prevencao a fraude</td>
              <td className="py-3">Interesse legitimo (IX)</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="compartilhamento" className="mb-10">
        <h2 className="text-xl font-semibold text-white">5. Compartilhamento de Dados</h2>
        <p>Seus dados podem ser compartilhados com:</p>
        <ul>
          <li><strong>Prestadores de servico:</strong> empresas que processam dados em nosso nome (veja secao 6)</li>
          <li><strong>Autoridades:</strong> quando exigido por lei, ordem judicial ou requisicao de autoridade competente</li>
          <li><strong>Parceiros de integracao:</strong> plataformas que voce conectar (Meta, Google, etc.), apenas com seu consentimento explicito</li>
        </ul>
        <p>
          <strong>NAO vendemos seus dados pessoais a terceiros.</strong>
        </p>
      </section>

      <section id="processadores" className="mb-10">
        <h2 className="text-xl font-semibold text-white">6. Processadores de Dados (Subcontratados)</h2>
        <p>
          Para fornecer nossos servicos, utilizamos os seguintes processadores de dados que
          podem acessar ou armazenar suas informacoes:
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.1]">
              <th className="text-left py-3 text-zinc-300">Empresa</th>
              <th className="text-left py-3 text-zinc-300">Servico</th>
              <th className="text-left py-3 text-zinc-300">Localizacao</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Google LLC (Firebase)</td>
              <td className="py-3">Autenticacao, banco de dados, armazenamento</td>
              <td className="py-3">EUA</td>
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Google LLC (Gemini AI)</td>
              <td className="py-3">Processamento de inteligencia artificial</td>
              <td className="py-3">EUA</td>
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Pinecone Systems</td>
              <td className="py-3">Banco de dados vetorial (RAG)</td>
              <td className="py-3">EUA</td>
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Vercel Inc.</td>
              <td className="py-3">Hospedagem e CDN</td>
              <td className="py-3">EUA</td>
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">PostHog Inc.</td>
              <td className="py-3">Analytics de produto</td>
              <td className="py-3">EUA</td>
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Meta Platforms Inc.</td>
              <td className="py-3">Pixel de conversao (se ativado)</td>
              <td className="py-3">EUA</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-4 text-sm text-zinc-500">
          Todos os processadores listados estao em conformidade com clausulas contratuais padrao
          para transferencia internacional de dados (SCCs) ou mecanismos equivalentes.
        </p>
      </section>

      <section id="retencao" className="mb-10">
        <h2 className="text-xl font-semibold text-white">7. Periodo de Retencao</h2>
        <p>Mantemos seus dados pelo tempo necessario para:</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.1]">
              <th className="text-left py-3 text-zinc-300">Tipo de Dado</th>
              <th className="text-left py-3 text-zinc-300">Periodo</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Dados de conta (cadastro)</td>
              <td className="py-3">Enquanto a conta estiver ativa + 6 meses apos exclusao</td>
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Conteudo criado (funis, marcas)</td>
              <td className="py-3">Enquanto a conta estiver ativa + 30 dias apos exclusao</td>
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Logs de acesso</td>
              <td className="py-3">6 meses (Marco Civil da Internet)</td>
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Dados de faturamento</td>
              <td className="py-3">5 anos (legislacao fiscal)</td>
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="py-3">Dados de analytics</td>
              <td className="py-3">24 meses (anonimizados apos)</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="seguranca" className="mb-10">
        <h2 className="text-xl font-semibold text-white">8. Seguranca dos Dados</h2>
        <p>Implementamos medidas tecnicas e organizacionais para proteger seus dados:</p>
        <ul>
          <li>Criptografia em transito (TLS 1.3) e em repouso (AES-256)</li>
          <li>Controle de acesso baseado em funcoes (RBAC)</li>
          <li>Monitoramento continuo de ameacas</li>
          <li>Backups automaticos com retencao geografica</li>
          <li>Auditorias periodicas de seguranca</li>
          <li>Treinamento de equipe em protecao de dados</li>
        </ul>
      </section>

      <section id="direitos" className="mb-10">
        <h2 className="text-xl font-semibold text-white">9. Seus Direitos (LGPD Art. 18)</h2>
        <p>Voce tem direito a:</p>
        <ul>
          <li><strong>Confirmacao e acesso:</strong> saber se tratamos seus dados e obter copia</li>
          <li><strong>Correcao:</strong> atualizar dados incompletos ou incorretos</li>
          <li><strong>Anonimizacao/bloqueio/eliminacao:</strong> de dados desnecessarios ou tratados em desconformidade</li>
          <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
          <li><strong>Eliminacao:</strong> solicitar exclusao dos dados tratados com consentimento</li>
          <li><strong>Informacao:</strong> saber com quem compartilhamos seus dados</li>
          <li><strong>Revogacao:</strong> retirar consentimento a qualquer momento</li>
          <li><strong>Oposicao:</strong> opor-se a tratamento em desconformidade com a lei</li>
        </ul>
        <div className="mt-6 p-4 rounded-xl bg-[#E6B447]/10 border border-[#E6B447]/20">
          <h4 className="text-[#E6B447] font-medium mb-2">Como exercer seus direitos</h4>
          <p className="text-sm text-zinc-300">
            Voce pode exportar seus dados ou solicitar exclusao da conta diretamente nas
            configuracoes da plataforma, ou entrar em contato pelo e-mail do DPO.
            Responderemos em ate 15 dias uteis.
          </p>
        </div>
      </section>

      <section id="contato" className="mb-10">
        <h2 className="text-xl font-semibold text-white">10. Contato e Reclamacoes</h2>
        <p>Para questoes sobre privacidade:</p>
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
          <p className="mb-2"><strong>E-mail do DPO:</strong> support@mkthoney.com</p>
          <p className="mb-2"><strong>Endereco:</strong> Av. Republica do Libano, 251 - Sao Paulo/SP</p>
        </div>
        <p className="mt-4">
          Caso considere que o tratamento de seus dados viola a LGPD, voce pode apresentar
          reclamacao a Autoridade Nacional de Protecao de Dados (ANPD):
          <br />
          <a
            href="https://www.gov.br/anpd/pt-br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E6B447] hover:text-[#F0C35C]"
          >
            www.gov.br/anpd
          </a>
        </p>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </article>
  );
}
