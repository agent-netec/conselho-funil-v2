import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqData = [
    {
        q: "Isso substitui minha agência?",
        a: "Sim. Esse é o ponto. Com a MKTHoney, você opera inteligência competitiva, criação de conteúdo, automação de campanhas e monitoramento de performance sozinho. Funções que normalmente exigem de 5 a 10 pessoas. Sua marca fica 100% consistente. Sua operação roda 24/7. E você não depende mais de ninguém."
    },
    {
        q: "E se eu não entendo de marketing?",
        a: "Não precisa. O setup leva 5 minutos. Você define sua marca, audiência e tom de voz. A plataforma traduz estratégias complexas em ações práticas que você aprova com um clique. Os 23 conselheiros fazem a análise pesada — você toma a decisão final. Se sabe o que vende e pra quem vende, é o suficiente."
    },
    {
        q: "Quem são os \"23 conselheiros\"?",
        a: "São sistemas de avaliação treinados nos frameworks reais de lendas do marketing direto — Gary Halbert, Eugene Schwartz, Dan Kennedy, Russell Brunson, David Ogilvy, entre outros. Quando você consulta, múltiplos conselheiros analisam pelo seu prisma específico, debatem entre si e entregam UM veredito unificado com score de confiança. Não é chatbot com nome bonito. É engenharia de decisão."
    },
    {
        q: "Consigo mesmo operar 10+ clientes sozinho?",
        a: "Sim. Cada marca tem seu próprio espaço isolado — tom de voz, identidade visual, conselheiros configurados e métricas independentes. Você alterna entre marcas instantaneamente. Uma pessoa gerenciando 10, 15, 20 marcas com a mesma consistência que uma agência com 50 funcionários."
    },
    {
        q: "Meus dados ficam seguros?",
        a: "Isolamento total por marca. Encriptação AES-256-GCM. Cada marca tem namespace próprio. Nenhum dado cruza de uma marca pra outra. Seus tokens e credenciais são armazenados com criptografia de nível bancário. Servidores no Brasil."
    },
    {
        q: "E se eu não gostar em 14 dias?",
        a: "Você sai. Sem pergunta. Sem retenção. Sem cobrar cartão que você nem cadastrou. Os 14 dias são reais — não é trial com funcionalidades cortadas. É o produto inteiro. Se não servir, vai embora. Simples."
    },
    {
        q: "Que tipo de conteúdo eu consigo produzir?",
        a: "Posts, stories, carrosséis, reels, headlines, hooks, scripts de anúncio, copies de email, estruturas de funil, ofertas formatadas. Tudo sai com a voz e identidade da sua marca. Não é template. É conteúdo sob medida, calibrado para o nível de consciência da sua audiência. Você produz em horas o que levava semanas."
    },
    {
        q: "Funciona pra qual nicho?",
        a: "Qualquer marca que precisa de marketing consistente e não quer — ou não pode — manter uma equipe pra isso. Infoprodutores, SaaS, e-commerce, serviços, agências solo. A plataforma se adapta à sua vertical, ao seu público e ao seu tom de voz."
    }
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="relative py-32 px-6 md:px-12 lg:px-24 bg-[#050505] overflow-hidden">
            <div className="max-w-4xl mx-auto relative z-10">

                {/* Header */}
                <div className="mb-16 md:mb-24 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <span className="font-data text-xs text-[#C9A84C] tracking-[0.3em] uppercase mb-4 block font-bold">PERGUNTAS FREQUENTES</span>
                        <h2 className="font-heading font-black text-4xl md:text-6xl uppercase tracking-tighter text-[#FAF8F5] leading-[0.9]">
                            Sem Enrolação.<br />Só Respostas.
                        </h2>
                    </div>
                </div>

                {/* FAQ List */}
                <div className="flex flex-col gap-4">
                    {faqData.map((faq, index) => (
                        <div
                            key={index}
                            className={`border border-[#FAF8F5]/5 rounded-2xl overflow-hidden transition-colors duration-300 ${openIndex === index ? 'bg-[#FAF8F5]/5 border-[#C9A84C]/30' : 'bg-transparent hover:border-[#FAF8F5]/10'}`}
                        >
                            <button
                                onClick={() => toggleAccordion(index)}
                                className="w-full text-left px-6 py-5 md:px-8 md:py-6 flex items-center justify-between gap-4 outline-none"
                            >
                                <h3 className={`font-heading font-medium text-lg md:text-xl transition-colors duration-300 ${openIndex === index ? 'text-[#C9A84C]' : 'text-[#FAF8F5]/90'}`}>
                                    {faq.q}
                                </h3>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${openIndex === index ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-[#FAF8F5]/5 text-[#FAF8F5]/50'}`}>
                                    {openIndex === index ? <Minus size={16} /> : <Plus size={16} />}
                                </div>
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-6 pb-6 md:px-8 md:pb-8 pt-0 text-[#FAF8F5]/60 text-sm md:text-base leading-relaxed">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
