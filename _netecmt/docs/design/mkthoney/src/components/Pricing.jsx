import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

// Custom Hook for Smooth 3D Tilt Effect
const useTilt = () => {
    const ref = useRef(null);
    const [style, setStyle] = useState({ transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)' });

    const handleMouseMove = useCallback((e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        // Softer rotation for a larger card
        const rotateX = ((y - cy) / cy) * -3;
        const rotateY = ((x - cx) / cx) * 3;

        setStyle({
            transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`,
            transition: 'none'
        });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setStyle({
            transform: `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
            transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
        });
    }, []);

    return { ref, style, handleMouseMove, handleMouseLeave };
};

export default function Pricing() {
    const { ref, style, handleMouseMove, handleMouseLeave } = useTilt();

    return (
        <section id="pricing" className="relative py-40 px-6 md:px-12 lg:px-24 bg-[#FAFAFA] flex flex-col items-center justify-center overflow-hidden">

            {/* Background glowing accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-[#C9A84C]/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="mb-24 text-center max-w-5xl mx-auto relative z-10 px-4">
                <span className="font-data text-xs text-[#C9A84C] uppercase tracking-[0.3em] font-bold py-2 px-6 rounded-full mb-6 inline-block">O PREÇO DA GUERRA</span>
                <h2 className="font-heading font-black text-4xl md:text-6xl lg:text-[5.5rem] uppercase tracking-tighter text-[#050505] leading-[0.9] flex flex-col items-center justify-center gap-2 md:gap-4">
                    <span>Sua Agência Cobra R$ 15.000 Por Mês</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] to-[#E5C77A] italic font-serif font-medium tracking-normal drop-shadow-[0_10px_30px_rgba(201,168,76,0.3)]">
                        E Você Ainda Precisa Cobrar o Relatório.
                    </span>
                </h2>
                <p className="mt-8 text-lg md:text-xl text-[#050505]/60 font-medium leading-relaxed max-w-3xl mx-auto">
                    Aqui, você opera sozinho. Espionagem, conteúdo, funil, tracking e otimização. Tudo no mesmo painel. Todo dia. Toda hora. O custo de uma pessoa fazendo o trabalho de dez? Menos do que o almoço executivo do dono da sua agência.
                </p>
            </div>

            {/* Pricing Card Wrapper */}
            <div
                ref={ref}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={style}
                className="w-full max-w-xl relative group z-20"
            >
                {/* 
                  Animated Conic Gradient Border
                  Simulates a high-end spinning laser border around the card 
                */}
                <div className="absolute -inset-[3px] rounded-[3.5rem] opacity-60 group-hover:opacity-100 transition-opacity duration-700 overflow-hidden shadow-[0_20px_60px_-15px_rgba(201,168,76,0.3)] pointer-events-none">
                    <div className="w-[200%] h-[200%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_5s_linear_infinite]"
                        style={{
                            background: 'conic-gradient(from 0deg, transparent 0 280deg, #C9A84C 360deg)'
                        }}
                    />
                    <div className="w-[200%] h-[200%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_5s_linear_infinite_reverse]"
                        style={{
                            background: 'conic-gradient(from 0deg, transparent 0 100deg, #E5C77A 180deg, transparent 180deg)'
                        }}
                    />
                </div>

                {/* The Card Surface */}
                <div className="bg-[#050505] rounded-[3.4rem] p-8 md:p-12 lg:p-14 relative flex flex-col items-center text-center inset-0 z-10 overflow-hidden">

                    {/* Subtle Texture Inside Card */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] opacity-[0.04] mix-blend-screen pointer-events-none bg-cover bg-center" />

                    {/* Top Glow Inside Card */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#C9A84C]/20 blur-[60px] rounded-full pointer-events-none" />

                    {/* Badge */}
                    <div className="relative z-10 mb-8 mt-2">
                        <span className="font-heading text-[#C9A84C] uppercase tracking-[0.3em] text-[11px] md:text-xs font-bold border border-[#C9A84C]/30 bg-[#C9A84C]/5 py-2.5 px-8 rounded-full shadow-[0_0_20px_rgba(201,168,76,0.15)] group-hover:shadow-[0_0_30px_rgba(201,168,76,0.3)] transition-shadow duration-500">
                            Licença Tática Black
                        </span>
                    </div>

                    <p className="relative z-10 text-[#C9A84C] font-bold text-[13px] md:text-sm tracking-wide mb-6 text-center max-w-sm">
                        Menos que um freelancer. Mais que uma agência inteira.
                    </p>

                    {/* Price */}
                    <div className="relative z-10 mb-8 flex items-baseline justify-center gap-2 group-hover:scale-105 transition-transform duration-700 ease-out">
                        <span className="font-heading font-bold text-3xl md:text-4xl text-[#FAF8F5]/40 mb-2 align-bottom">R$</span>
                        <span className="font-heading font-black text-[6rem] md:text-[8rem] text-transparent bg-clip-text bg-gradient-to-b from-[#FAF8F5] to-[#FAF8F5]/70 tracking-tighter leading-none drop-shadow-2xl">
                            297
                        </span>
                        <span className="font-heading font-bold text-xl md:text-2xl text-[#FAF8F5]/40 mb-2 align-bottom">/mês</span>
                    </div>

                    {/* Feature List */}
                    <ul className="relative z-10 text-left font-medium text-[#FAF8F5]/70 text-[13px] md:text-sm space-y-4 mb-10 flex flex-col w-full px-2">
                        {[
                            'Operação completa de marketing num painel só',
                            '23 Conselheiros com frameworks de lendas do marketing',
                            'Inteligência competitiva ilimitada (Spy Agent)',
                            'Funnel Autopsy — diagnóstico de funil em 60 segundos',
                            'Offer Lab — construção de oferta com score de irresistibilidade',
                            'Content Calendar com publicação automática',
                            'Copy DNA — headlines e hooks por nível de consciência',
                            'War Room — dashboard multi-canal em tempo real',
                            'Testes A/B automatizados com significância estatística',
                            'Brand Voice em todo conteúdo gerado',
                            'Social Listening e Trend Radar',
                            'Suporte prioritário'
                        ].map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3 group/item">
                                <div className="min-w-[6px] h-[6px] rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E5C77A] shadow-[0_0_12px_rgba(201,168,76,0.8)] group-hover/item:scale-150 transition-transform duration-300 mt-1.5" />
                                <span className="group-hover/item:text-white transition-colors duration-300 leading-tight">
                                    {feature}
                                </span>
                            </li>
                        ))}
                    </ul>

                    {/* CTA Button */}
                    <motion.button
                        className="relative z-10 group/btn w-full bg-gradient-to-r from-[#C9A84C] via-[#E5C77A] to-[#C9A84C] bg-[length:200%_auto] text-[#050505] py-5 md:py-6 px-4 rounded-full font-heading font-bold text-lg md:text-xl uppercase tracking-widest flex items-center justify-center gap-3 overflow-hidden transition-all shadow-[0_10px_30px_rgba(201,168,76,0.3)] hover:shadow-[0_15px_40px_rgba(201,168,76,0.6)]"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Iniciar Guerra <span className="text-xl md:text-2xl leading-none -mt-0.5">&rarr;</span>
                        </span>
                        {/* Internal Button Glare */}
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover/btn:animate-[glare_1s_ease-in-out_forwards]" />
                    </motion.button>

                    {/* Garantia */}
                    <div className="relative z-10 mt-8 text-center text-[#FAF8F5]/50 text-xs font-medium leading-relaxed max-w-sm mx-auto border-t border-white/10 pt-6">
                        <span className="text-white font-bold block mb-2 uppercase tracking-wide text-[10px] md:text-xs">14 dias para testar. Sem cartão na entrada.</span>
                        Se em 14 dias você não estiver operando mais rápido, com mais clareza e mais resultado do que com sua agência atual — você sai. Sem pergunta. Sem retenção.
                    </div>
                </div>
            </div>

            {/* Comparativo abaixo */}
            <div className="mt-20 flex flex-col gap-4 max-w-3xl mx-auto w-full px-4 relative z-10">
                <div className="p-5 md:p-6 rounded-2xl border border-[#050505]/10 bg-white/50 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-3">
                    <span className="font-black text-[#050505]/70 uppercase tracking-widest text-[10px] md:text-xs">Agência tradicional:</span>
                    <span className="text-[#050505]/80 text-sm md:text-base font-bold text-center md:text-right">R$ 5.000 - R$ 30.000/mês + contrato de 6 meses</span>
                </div>
                <div className="p-5 md:p-6 rounded-2xl border border-[#050505]/10 bg-white/50 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-3">
                    <span className="font-black text-[#050505]/70 uppercase tracking-widest text-[10px] md:text-xs">Equipe interna mínima:</span>
                    <span className="text-[#050505]/80 text-sm md:text-base font-bold text-center md:text-right">R$ 15.000 - R$ 40.000/mês + CLT + gestão</span>
                </div>
                <div className="p-5 md:p-6 rounded-2xl border border-[#050505]/10 bg-white/50 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-3">
                    <span className="font-black text-[#050505]/70 uppercase tracking-widest text-[10px] md:text-xs">Freelancers avulsos:</span>
                    <span className="text-[#050505]/80 text-sm md:text-base font-bold text-center md:text-right">R$ 2.000 - R$ 8.000/mês + depende de disponibilidade</span>
                </div>
                <div className="p-6 md:p-8 mt-4 rounded-2xl border-2 border-[#C9A84C]/50 bg-[#C9A84C]/10 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-4 shadow-[0_0_30px_rgba(201,168,76,0.15)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent -translate-x-[150%] animate-[glare_2.5s_ease-in-out_infinite]" />
                    <span className="font-black text-[#050505] text-sm md:text-base uppercase tracking-widest">MKTHoney BLACK:</span>
                    <span className="text-[#C9A84C] drop-shadow-md font-black text-lg md:text-xl text-center md:text-right uppercase">R$ 297/mês. Você. Sozinho.<br className="md:hidden" /> Operando tudo.</span>
                </div>
            </div>

            {/* Global Glare Keyframe */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes glare {
                    0% { transform: translateX(-100%) rotate(45deg); }
                    100% { transform: translateX(200%) rotate(45deg); }
                }
            `}} />
        </section>
    );
}
