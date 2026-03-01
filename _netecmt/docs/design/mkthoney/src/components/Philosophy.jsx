import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Philosophy() {
    const containerRef = useRef(null);
    const textWrapperRef = useRef(null);
    const smallTextRef = useRef(null);

    // Helper to split text for character/word staggered reveal
    const splitWords = (text) => {
        return text.split(' ').map((word, wordIdx) => (
            <span key={wordIdx} className="inline-block overflow-hidden mr-3 md:mr-5 pb-2">
                <span className="word-inner inline-block translate-y-[120%] opacity-0 rotate-2 origin-top-left will-change-transform">
                    {word}
                </span>
            </span>
        ));
    };

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Smooth Parallax on Background
            gsap.to('.parallax-bg', {
                yPercent: 20,
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1.5,
                },
            });

            // Intro Top Text Reveal
            gsap.fromTo(smallTextRef.current,
                { y: 30, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1.5,
                    ease: 'power4.out',
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'top 70%',
                    }
                }
            );

            // Staggered Drama Text Reveal (The big text)
            gsap.to(textWrapperRef.current.querySelectorAll('.word-inner'), {
                y: '0%',
                opacity: 1,
                rotate: 0,
                duration: 1.2,
                stagger: 0.04,
                ease: 'back.out(1.2)',
                scrollTrigger: {
                    trigger: textWrapperRef.current,
                    start: 'top 80%',
                }
            });

        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative w-full py-32 md:py-48 px-6 md:px-12 lg:px-24 bg-[#050505] overflow-hidden rounded-t-[3rem] md:rounded-t-[4rem] z-20 border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
        >
            {/* Dark, subtle texture background for depth */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
            <div
                className="parallax-bg absolute inset-0 z-0 bg-cover bg-center opacity-[0.03] mix-blend-luminosity grayscale"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')" }}
            />
            {/* Subtle top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#C9A84C] opacity-[0.02] blur-[100px] pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-16 md:gap-24 items-center text-center">

                {/* Antítese (O problema do mercado) */}
                <div
                    ref={smallTextRef}
                    className="max-w-5xl flex flex-col items-center"
                >
                    <span className="px-5 py-2 rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/5 backdrop-blur-sm text-[#C9A84C] text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-8">
                        FILOSOFIA
                    </span>
                    <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl text-[#FAF8F5] font-black leading-tight uppercase tracking-widest px-4 md:px-0 mix-blend-plus-lighter mb-12 text-center">
                        O Mercado Te Convenceu Que Você<br />Precisa de Mais Gente. Mentira.
                    </h2>

                    <div className="text-[#FAF8F5]/70 text-base md:text-lg lg:text-xl font-medium leading-relaxed max-w-4xl text-left space-y-6 px-4 md:px-0">
                        <p>Você quer escalar. Todo mundo quer.<br />E o mercado te diz: "Contrata uma agência."<br />Aí você paga R$ 10.000, R$ 15.000, R$ 20.000 por mês. Recebe um relatório genérico, um estagiário te atendendo no WhatsApp, e conteúdo que poderia ser de qualquer marca.</p>

                        <p>Ou te dizem: "Monta uma equipe interna."<br />Aí você contrata copywriter, social media, gestor de tráfego, designer, analista de dados. Folha de R$ 30.000+. E ainda precisa GERENCIAR todo mundo.</p>

                        <p>Ou te dizem: "Usa umas ferramentas de IA."<br />Aí você assina 7 plataformas diferentes, cola prompt no ChatGPT, e reza pra sair algo que não pareça robô falando.</p>

                        <p>Três caminhos. O mesmo resultado: você continua dependendo dos outros. Seu marketing continua refém de terceiros. Sua operação continua mais lenta que a do concorrente.</p>

                        <p className="text-[#C9A84C] font-bold text-xl md:text-2xl mt-8">A MKTHoney existe pra acabar com isso.</p>

                        <p>Não é mais uma ferramenta. Não é mais uma agência. É o ponto onde UMA PESSOA ganha o poder de operar como uma agência inteira — sem pedir permissão, sem esperar aprovação, sem depender de contratação.</p>

                        <p>Dentro desta plataforma, 23 conselheiros treinados nos frameworks de Gary Halbert, Eugene Schwartz, Dan Kennedy e Russell Brunson analisam, debatem e te entregam vereditos fundamentados.</p>

                        <p>Eles não são o produto. <strong className="text-white">VOCÊ é o produto.</strong> Eles são o multiplicador de força que faz um operador solo competir com departamentos inteiros.</p>
                    </div>
                </div>

                {/* Tese (A Solução MKTHoney) */}
                <div
                    ref={textWrapperRef}
                    className="font-drama italic font-bold text-5xl md:text-7xl lg:text-[8rem] leading-[1.1] md:leading-[1.05] tracking-tight flex flex-col items-center mt-16"
                >
                    <div className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] via-[#E5C77A] to-[#C9A84C] flex flex-wrap justify-center drop-shadow-[0_0_40px_rgba(201,168,76,0.3)]">
                        {splitWords("LENDAS")}
                    </div>
                    <div className="text-white/60 font-sans not-italic text-xs md:text-lg font-bold tracking-[0.2em] uppercase mt-8">
                        23 mentes por trás de cada decisão sua.
                    </div>
                </div>

            </div>
        </section>
    );
}
