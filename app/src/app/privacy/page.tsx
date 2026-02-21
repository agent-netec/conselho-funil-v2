export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-300 px-6 py-16 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Política de Privacidade</h1>
      <p className="text-sm text-gray-500 mb-8">Última atualização: 21 de fevereiro de 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">1. Coleta de Dados</h2>
          <p>
            O Conselho de Funil coleta informações necessárias para o funcionamento da plataforma,
            incluindo: nome, email, dados de campanhas de anúncios (Meta Ads, Google Ads) e métricas
            de performance. Esses dados são acessados exclusivamente via APIs oficiais com autorização
            explícita do usuário (OAuth).
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">2. Uso dos Dados</h2>
          <p>
            Os dados coletados são utilizados para: exibir métricas de campanhas no dashboard,
            gerar análises de performance com inteligência artificial, e fornecer recomendações
            estratégicas personalizadas. Não vendemos, compartilhamos ou transferimos seus dados
            para terceiros.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">3. Armazenamento e Segurança</h2>
          <p>
            Tokens de acesso são armazenados com criptografia AES-256 no Firebase Firestore.
            Dados sensíveis nunca são expostos no frontend. Utilizamos HTTPS em todas as
            comunicações e seguimos as melhores práticas de segurança da OWASP.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">4. Integrações com Terceiros</h2>
          <p>
            Ao conectar plataformas como Meta Ads, Google Ads, TikTok Ads ou LinkedIn Ads,
            o usuário autoriza o Conselho de Funil a acessar dados de campanhas em modo
            somente leitura. O usuário pode revogar esse acesso a qualquer momento nas
            configurações de integração.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">5. Exclusão de Dados</h2>
          <p>
            O usuário pode solicitar a exclusão completa de seus dados a qualquer momento
            entrando em contato pelo email de suporte ou utilizando a funcionalidade de
            exclusão de conta nas configurações da plataforma.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">6. Contato</h2>
          <p>
            Para dúvidas sobre privacidade, entre em contato pelo email:{' '}
            <a href="mailto:phsedicias@yahoo.com.br" className="text-emerald-400 hover:underline">
              phsedicias@yahoo.com.br
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
