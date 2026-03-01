import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function Protocol() {
    const containerRef = useRef(null);
    const cardsRef = useRef([]);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            cardsRef.current.forEach((card, index) => {
                // Pin each card as it reaches the top
                gsap.to(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top top",
                        endTrigger: containerRef.current,
                        end: "bottom bottom",
                        pin: true,
                        pinSpacing: false,
                    }
                });

                // Shrink, dark-blur and fade when the NEXT card scrolls up over it
                if (index < cardsRef.current.length - 1) {
                    gsap.to(card, {
                        scale: 0.9,
                        opacity: 0,
                        filter: "blur(20px)",
                        ease: "none",
                        scrollTrigger: {
                            trigger: cardsRef.current[index + 1],
                            start: "top bottom",
                            end: "top top",
                            scrub: true,
                        }
                    });
                }
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const protocols = [
        {
            step: "01",
            title: "Mapeamento & Funil",
            subtitle: "Antes de atirar, você mira.",
            desc: "Você não começa gastando. Começa entendendo. Em minutos, você tem o dossiê completo dos seus concorrentes. Sabe o que estão rodando, quanto estão gastando, onde estão falhando. Seu funil é dissecado em 60 segundos — cada buraco exposto, cada vazamento de lead identificado. Você sozinho fazendo o que um departamento de inteligência competitiva leva semanas pra entregar. Sem analista. Sem briefing. Sem reunião de alinhamento.",
            animation: (
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-70 animate-[spin_25s_linear_infinite] drop-shadow-[0_0_20px_rgba(201,168,76,0.3)]">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#C9A84C" strokeWidth="0.5" strokeDasharray="3 6" />
                    <circle cx="50" cy="50" r="25" fill="none" stroke="#FAF8F5" strokeWidth="1" strokeDasharray="8 4" className="animate-[spin_15s_linear_infinite_reverse]" style={{ transformOrigin: 'center' }} />
                    <circle cx="50" cy="50" r="10" fill="none" stroke="#E5C77A" strokeWidth="0.5" className="animate-pulse" />
                    <path d="M50 0 L50 100 M0 50 L100 50" stroke="#C9A84C" strokeWidth="0.2" opacity="0.5" />
                </svg>
            )
        },
        {
            step: "02",
            title: "Copy & Criativos",
            subtitle: "Conteúdo bom não viraliza. Conteúdo preciso converte.",
            desc: "Com o mapa na mão, você parte pra produção. Ofertas construídas com score de irresistibilidade. Headlines e hooks calibrados pro nível de consciência exato da sua audiência. Conteúdo que sai com a VOZ da sua marca — não com cara de template. Posts, stories, carrosséis, reels. Na frequência certa, no tom certo, no canal certo. Você produz em uma manhã o que seu time antigo levava uma sprint inteira.",
            animation: (
                <div className="relative w-full h-full flex flex-col justify-center items-center gap-2 opacity-80">
                    <div className="w-4/5 h-16 border border-[#C9A84C]/30 relative overflow-hidden flex shadow-[0_0_30px_rgba(201,168,76,0.1)_inset] rounded-sm bg-[#050505]/50">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="flex-1 border-r border-[#C9A84C]/10" />
                        ))}
                        <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-transparent via-[#FAF8F5] to-transparent shadow-[0_0_15px_#FAF8F5] animate-[ping_3s_ease-in-out_infinite_alternate]" style={{ animation: 'scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate' }}></div>
                    </div>
                    <style>{`@keyframes scan { 0% { left: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { left: 100%; opacity: 0; } }`}</style>
                </div>
            )
        },
        {
            step: "03",
            title: "Tracking & Otimização",
            subtitle: "O que não se mede, morre.",
            desc: "Conteúdo no ar é só o começo. Todas as métricas que importam, num painel só. Multi-canal. Tempo real. Com alerta automático antes do problema virar crise. Testes A/B rodando com significância estatística. Os números decidem, não a opinião do estagiário. E quando algo quebra no funil? Diagnóstico em 60 segundos. Recomendação. Ajuste. Ciclo infinito de melhoria. Enquanto você dorme, a operação otimiza. Enquanto sua concorrência contrata, você escala.",
            animation: (
                <svg viewBox="0 0 200 100" className="w-full h-full opacity-90 drop-shadow-[0_0_15px_rgba(201,168,76,0.5)]">
                    <path
                        d="M 0 50 C 30 50, 40 20, 50 20 C 60 20, 70 80, 80 80 C 90 80, 100 50, 200 50"
                        fill="none"
                        stroke="url(#grad)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ strokeDasharray: 300, strokeDashoffset: 300, animation: 'drawWave 4s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
                    />
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#C9A84C" stopOpacity="0" />
                        <stop offset="50%" stopColor="#E5C77A" stopOpacity="1" />
                        <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
                    </linearGradient>
                    <style>{`@keyframes drawWave { 0% { stroke-dashoffset: 300; } 50% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -300; } }`}</style>
                </svg>
            )
        }
    ];

    return (
        <section ref={containerRef} id="protocol" className="relative w-full bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-[#FAFAFA] pt-16">
            {/* Subtle glow background */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-[#C9A84C]/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Top Header */}
            <div className="w-full text-center py-16 px-6 z-10 relative">
                <span className="font-data text-xs text-[#C9A84C] uppercase tracking-[0.3em] font-bold border border-[#C9A84C]/20 bg-[#C9A84C]/5 py-2 px-6 rounded-full mb-6 inline-block">PROTOCOLO DE COMBATE</span>
                <h2 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter text-[#FAF8F5] leading-tight max-w-5xl mx-auto">
                    Uma Pessoa. Três Fases.<br className="hidden md:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] to-[#E5C77A]">Mais Resultado Que Sua Última Agência em 12 Meses.</span>
                </h2>
            </div>

            {protocols.map((card, idx) => (
                <div
                    key={idx}
                    ref={el => cardsRef.current[idx] = el}
                    className="h-screen w-full flex items-center justify-center p-6 md:p-12 lg:p-24 relative overflow-hidden"
                    style={{ zIndex: idx }}
                >
                    {/* Premium Glassmorphism Card */}
                    <div className="w-full max-w-7xl h-[85vh] md:h-[75vh] bg-[#050505]/60 backdrop-blur-3xl rounded-[3rem] p-10 md:p-20 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] flex flex-col md:flex-row justify-between items-center gap-12 border border-white/5 relative overflow-hidden">

                        {/* Top Accent Line */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />

                        {/* Left Content */}
                        <div className="flex-1 flex flex-col justify-center relative z-20 w-full h-full">
                            <div className="mb-6 inline-flex items-center gap-4">
                                <span className="font-data text-xs md:text-sm text-[#C9A84C] tracking-[0.3em] uppercase py-1.5 px-4 rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/5">
                                    Fase {card.step}
                                </span>
                                <div className="h-px w-12 bg-gradient-to-r from-[#C9A84C]/40 to-transparent" />
                            </div>

                            <h2 className="font-heading font-black text-4xl md:text-5xl lg:text-7xl uppercase tracking-tighter mb-4 leading-[0.9] text-[#FAF8F5]">
                                {card.title.split(' & ').map((part, i) => (
                                    <React.Fragment key={i}>
                                        {part}
                                        {i === 0 && <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] to-[#E5C77A] italic font-serif font-medium tracking-normal mt-1 mb-1">&</span>}
                                    </React.Fragment>
                                ))}
                            </h2>
                            {card.subtitle && (
                                <p className="font-bold text-lg md:text-2xl text-[#C9A84C] mb-4">
                                    {card.subtitle}
                                </p>
                            )}
                            <p className="font-medium text-base md:text-lg text-[#FAF8F5]/60 max-w-xl leading-relaxed mix-blend-plus-lighter">
                                {card.desc}
                            </p>
                        </div>

                        {/* Right Visualization */}
                        <div className="flex-1 w-full h-full min-h-[300px] flex justify-center items-center relative z-20 mix-blend-screen bg-gradient-to-tr from-[#C9A84C]/5 to-transparent rounded-[2rem] border border-white/5 p-8">
                            {card.animation}
                        </div>

                        {/* Noise overlay specific to card */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay rounded-[3rem]" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')", backgroundSize: "cover" }} />
                    </div>
                </div>
            ))}
        </section>
    );
}
