import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="fixed top-0 md:top-6 left-0 w-full z-50 flex justify-center px-4 md:px-6 pointer-events-none transition-all duration-500">
            <nav
                className={`pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center justify-between border ${scrolled
                    ? 'bg-[#050505]/70 backdrop-blur-2xl text-white border-white/10 w-full max-w-5xl rounded-full py-3 px-6 md:px-8 mt-4 md:mt-0 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]'
                    : 'bg-transparent text-white w-full max-w-7xl py-6 px-4 md:px-0 border-transparent'
                    }`}
            >
                <a href="#hero" className="flex-shrink-0 flex items-center justify-start h-10 md:h-12 w-32 md:w-40 overflow-hidden group cursor-pointer">
                    <img src="/logo.png" alt="MKTHONEY Logo" className="h-full w-full object-contain filter brightness-0 invert drop-shadow-[0_2px_15px_rgba(255,255,255,0.2)] origin-left scale-125 md:scale-150 relative -left-2 md:-left-4 group-hover:scale-[1.3] md:group-hover:scale-[1.55] transition-transform duration-500" />
                </a>

                <div className={`hidden md:flex items-center gap-10 font-heading text-xs uppercase tracking-[0.2em] font-bold ${scrolled ? 'text-white/70' : 'text-white/80'}`}>
                    <a href="#features" className="hover:text-[#C9A84C] hover:-translate-y-0.5 transition-all">Arsenal</a>
                    <a href="#philosophy" className="hover:text-[#C9A84C] hover:-translate-y-0.5 transition-all">Filosofia</a>
                    <a href="#protocol" className="hover:text-[#C9A84C] hover:-translate-y-0.5 transition-all">Protocolo</a>
                    <a href="#pricing" className="hover:text-[#C9A84C] hover:-translate-y-0.5 transition-all">O Preço</a>
                    <a href="#faq" className="hover:text-[#C9A84C] hover:-translate-y-0.5 transition-all">FAQ</a>
                </div>

                <a href="#pricing" className="relative group/btn overflow-hidden rounded-full cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] via-[#E5C77A] to-[#C9A84C] bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]" />
                    <button className="relative bg-[#050505] m-[1.5px] px-5 py-2 md:px-7 md:py-2.5 rounded-full font-heading font-bold text-[10px] md:text-xs uppercase tracking-widest text-white group-hover/btn:bg-transparent group-hover/btn:text-[#050505] transition-colors duration-300">
                        <span className="relative z-10 flex items-center gap-2">
                            Iniciar Guerra <span className="text-lg leading-none">&rarr;</span>
                        </span>
                    </button>
                    {/* Internal Button Glare */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover/btn:animate-[glare_1s_ease-in-out_forwards] pointer-events-none" />
                </a>
            </nav>
            {/* Global Glare Keyframe if not already defined */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
            `}} />
        </div>
    );
}
