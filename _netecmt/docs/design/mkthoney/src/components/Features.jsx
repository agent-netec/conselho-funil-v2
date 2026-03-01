import React, { useEffect, useState, useRef, useCallback } from 'react';
import { gsap } from 'gsap';

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

        const rotateX = ((y - cy) / cy) * -6;
        const rotateY = ((x - cx) / cx) * 6;

        setStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
            transition: 'none'
        });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setStyle({
            transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
            transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
        });
    }, []);

    return { ref, style, handleMouseMove, handleMouseLeave };
};

// --- Card 1: Diagnostic Shuffler --- //
const shufflerData = [
    { id: 1, title: 'Russell Brunson', desc: 'Sugerindo Bump Offer. Conversão +14%', color: 'border-blue-500/30' },
    { id: 2, title: 'Eugene Schwartz', desc: 'Headline no Nível 3. Ajustando gancho.', color: 'border-[#C9A84C]/40' },
    { id: 3, title: 'Dan Kennedy', desc: 'Garantia incondicional fraca. Reforçando.', color: 'border-rose-500/30' },
];

function DiagnosticShuffler() {
    const [cards, setCards] = useState(shufflerData);
    const { ref, style, handleMouseMove, handleMouseLeave } = useTilt();

    useEffect(() => {
        const interval = setInterval(() => {
            setCards(prev => {
                const newArr = [...prev];
                const last = newArr.pop();
                newArr.unshift(last);
                return newArr;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={style}
            className="relative h-72 w-full flex items-center justify-center cursor-crosshair z-10"
        >
            {cards.map((card, idx) => (
                <div
                    key={card.id}
                    className={`absolute w-full max-w-[90%] bg-[#0A0A0A] border ${card.color} rounded-2xl p-6 md:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] transition-all duration-[800ms] cubic-bezier(0.23, 1, 0.32, 1)`}
                    style={{
                        zIndex: cards.length - idx,
                        transform: `translateY(${idx * 16}px) scale(${1 - idx * 0.06})`,
                        opacity: 1 - idx * 0.3,
                        filter: `blur(${idx * 1.5}px)`
                    }}
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center border border-white/5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#C9A84C] animate-pulse shadow-[0_0_10px_rgba(201,168,76,0.6)]" />
                        </div>
                        <h4 className="font-bold text-[#FAF8F5] tracking-wide text-lg">{card.title}</h4>
                    </div>
                    <p className="text-[#FAF8F5]/60 text-sm font-data font-medium tracking-wide">{card.desc}</p>
                </div>
            ))}
        </div>
    );
}

// --- Card 2: Telemetry Typewriter --- //
const msgs = [
    "> INITIALIZING ATTRIBUTION ENGINE...",
    "> TRACKING LEAD A49B...",
    "> TOUCHPOINT 1: META AD (CLICK)",
    "> TOUCHPOINT 2: ORGANIC SEARCH",
    "> PREDICTIVE ROI: +312% 🟢",
    "> LTV PROJECTION: $450/m"
];

function TelemetryTypewriter() {
    const [text, setText] = useState("");
    const [msgIdx, setMsgIdx] = useState(0);
    const { ref, style, handleMouseMove, handleMouseLeave } = useTilt();

    useEffect(() => {
        let charIdx = 0;
        const currentMsg = msgs[msgIdx] + "\n";

        setText("");
        const interval = setInterval(() => {
            setText(prev => prev + currentMsg[charIdx]);
            charIdx++;
            if (charIdx === currentMsg.length) {
                clearInterval(interval);
                setTimeout(() => {
                    setMsgIdx((prev) => (prev + 1) % msgs.length);
                }, 1500);
            }
        }, 35);

        return () => clearInterval(interval);
    }, [msgIdx]);

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={style}
            className="h-72 w-full bg-[#0A0A0A] border border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:border-[#C9A84C]/40 transition-colors duration-500 rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-end z-10"
        >
            <div className="absolute inset-0 bg-gradient-to-t from-[#C9A84C]/5 to-transparent pointer-events-none" />

            <div className="absolute top-6 left-8 flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[11px] text-emerald-400 font-data uppercase tracking-[0.2em] font-bold">Live Feed</span>
            </div>

            <div className="font-data text-xs md:text-sm text-[#C9A84C] whitespace-pre-wrap leading-relaxed">
                {text}
                <span className="inline-block w-2.5 h-4 bg-[#C9A84C] ml-1.5 align-middle animate-pulse" />
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
        </div>
    );
}

// --- Card 3: Cursor Protocol Scheduler --- //
function CursorScheduler() {
    const containerRef = useRef(null);
    const cursorRef = useRef(null);
    const btnRef = useRef(null);
    const { ref, style, handleMouseMove, handleMouseLeave } = useTilt();

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

            tl.set(cursorRef.current, { x: 40, y: 160, opacity: 0 })
                .to(cursorRef.current, { opacity: 1, duration: 0.4 })
                .to(cursorRef.current, { x: 130, y: 80, duration: 1.2, ease: 'power3.inOut' })
                .to(cursorRef.current, { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1 })
                .to('.day-cell-3', { backgroundColor: '#C9A84C', color: '#0A0A0A', scale: 1.05, duration: 0.2 }, "-=0.15")
                .to(cursorRef.current, { x: 230, y: 180, duration: 1.2, ease: 'power3.inOut', delay: 0.4 })
                .to(cursorRef.current, { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1 })
                .to(btnRef.current, { scale: 0.95, backgroundColor: '#333', duration: 0.1, yoyo: true, repeat: 1 }, "-=0.1")
                .to(cursorRef.current, { opacity: 0, duration: 0.4, delay: 0.6 })
                .to('.day-cell-3', { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(250,248,245,0.5)', scale: 1, duration: 0.5 }, "-=0.2");

        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div
            ref={(el) => { ref.current = el; containerRef.current = el; }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={style}
            className="h-72 w-full bg-[#0A0A0A] border border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:border-[#C9A84C]/40 transition-colors duration-500 rounded-3xl p-6 md:p-8 relative z-10 overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full pointer-events-none" />

            <div className="flex justify-between items-center mb-8">
                <span className="text-xs text-[#FAF8F5]/60 font-heading tracking-widest uppercase">Auto Rules</span>
                <span className="text-xs text-rose-400 font-data bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">If CPA {'>'} R$30</span>
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-3 mb-10 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className={`day-cell-${i} h-10 flex items-center justify-center rounded-lg bg-white/5 text-[#FAF8F5]/50 text-xs font-data transition-all duration-300 font-bold border border-white/5`}>
                        {day}
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center w-full mt-auto absolute bottom-6 md:bottom-8 left-0 px-6 md:px-8">
                <div className="h-2 w-20 bg-white/10 rounded-full" />
                <button ref={btnRef} className="bg-white/10 text-[#FAF8F5]/80 text-[10px] md:text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg border border-white/5">
                    Pause Ads
                </button>
            </div>

            {/* SVG Cursor */}
            <div ref={cursorRef} className="absolute top-0 left-0 w-7 h-7 z-20 pointer-events-none filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.6)]">
                <svg viewBox="0 0 24 24" fill="#FAF8F5" stroke="#000" strokeWidth="1.5">
                    <path d="M4 2l6.5 20 2.5-6.5L19.5 13z" />
                </svg>
            </div>
        </div>
    );
}


export default function Features() {
    return (
        <section id="features" className="py-32 md:py-48 px-6 md:px-12 lg:px-24 bg-[#FAFAFA] relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="mb-20 md:mb-32 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="max-w-4xl">
                        <h4 className="text-sm font-bold text-[#C9A84C] tracking-widest uppercase mb-4 block">INFRAESTRUTURA</h4>
                        <h2 className="font-heading font-black text-4xl md:text-6xl uppercase tracking-tighter text-[#050505] leading-[0.9]">
                            Tudo Que Uma Agência de 10 Pessoas Faz.<br />
                            <span className="text-[#C9A84C] block md:inline mt-2 md:mt-0 font-serif italic font-medium tracking-normal">Numa Tela. Na Sua Mão.</span>
                        </h2>
                        <p className="mt-8 text-lg md:text-xl text-[#050505]/80 max-w-3xl font-medium leading-relaxed">
                            Você não precisa de um gestor de tráfego, um copywriter, um social media, um analista de dados e um diretor criativo. Precisa de um sistema que coloca tudo isso no mesmo painel — e te deixa no controle.
                        </p>
                    </div>
                </div>

                {/* Grid of Features */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 relative z-20 perspective-1000">

                    {/* Feature 1 */}
                    <div className="flex flex-col gap-8 group">
                        <DiagnosticShuffler />
                        <div className="px-2">
                            <h3 className="font-heading font-bold text-2xl uppercase text-[#050505] tracking-tight group-hover:text-[#C9A84C] transition-colors duration-300">
                                Inteligência
                            </h3>
                            <p className="mt-2 text-[#C9A84C] font-bold text-sm tracking-wide">Saiba tudo. Antes de todos. Sozinho.</p>
                            <p className="mt-3 text-[#050505]/70 leading-relaxed font-medium text-base">
                                Espionagem competitiva em tempo real. Social listening que não depende de hashtag. Keywords que seus concorrentes estão comprando agora. Pesquisa de mercado que levaria 3 semanas com uma equipe de análise — você tem em 3 minutos. Sem delegar. Sem esperar. Sem briefing.
                            </p>
                            <p className="mt-4 text-[#050505]/40 text-xs font-bold uppercase tracking-widest leading-loose">
                                Spy Agent · Social Listening · Keywords Miner · Deep Research · Audience Scan · Trend Radar
                            </p>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="flex flex-col gap-8 group">
                        <TelemetryTypewriter />
                        <div className="px-2">
                            <h3 className="font-heading font-bold text-2xl uppercase text-[#050505] tracking-tight group-hover:text-[#C9A84C] transition-colors duration-300">
                                Biblioteca
                            </h3>
                            <p className="mt-2 text-[#C9A84C] font-bold text-sm tracking-wide">Seu cofre de munição. Sempre carregado.</p>
                            <p className="mt-3 text-[#050505]/70 leading-relaxed font-medium text-base">
                                Todo criativo que funcionou. Todo funil que converteu. Todo headline que passou no teste. Organizado, versionado e pronto pra reutilizar. Com score preditivo em cada peça. Você não procura — você acessa. Não é o Google Drive da sua agência. É um arsenal curado.
                            </p>
                            <p className="mt-4 text-[#050505]/40 text-xs font-bold uppercase tracking-widest leading-loose">
                                Creative Vault · Copy DNA · Funnel Blueprints · Conversion Predictor · Content Autopilot
                            </p>
                        </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="flex flex-col gap-8 group">
                        <CursorScheduler />
                        <div className="px-2">
                            <h3 className="font-heading font-bold text-2xl uppercase text-[#050505] tracking-tight group-hover:text-[#C9A84C] transition-colors duration-300">
                                Operações
                            </h3>
                            <p className="mt-2 text-[#C9A84C] font-bold text-sm tracking-wide">Execução no piloto automático. Você no comando.</p>
                            <p className="mt-3 text-[#050505]/70 leading-relaxed font-medium text-base">
                                Calendário editorial rodando. Conteúdo saindo com a voz da SUA marca. Testes A/B decidindo o que performa melhor — sem achismo. Dashboard multi-canal mostrando o que importa e alertando quando algo quebra. Você acorda e a operação já está 3 passos à frente. Uma pessoa fazendo o que equipes inteiras não conseguem manter.
                            </p>
                            <p className="mt-4 text-[#050505]/40 text-xs font-bold uppercase tracking-widest leading-loose">
                                Content Calendar · Content Gen · A/B Testing · Campaign Automation · War Room · Funnel Autopsy · Offer Lab
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
