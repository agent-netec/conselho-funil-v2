import React, { useEffect, useRef, useState } from "react"
import { MeshGradient, PulsingBorder } from "@paper-design/shaders-react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Sparkles, Play } from "lucide-react"

export default function Hero() {
    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"],
    })

    const yOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
    const yParallax = useTransform(scrollYProgress, [0, 1], [0, 200])

    return (
        <section
            ref={containerRef}
            className="relative w-full xl:min-h-[100dvh] h-auto min-h-[90dvh] bg-[#050505] flex flex-col justify-center items-center overflow-hidden pt-24 pb-32"
        >
            {/* SVG Filters & Definitions */}
            <svg className="absolute inset-0 w-0 h-0">
                <defs>
                    <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
                        <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
                    </filter>
                    <filter id="text-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            </svg>

            {/* Shaders Background */}
            <div className="absolute inset-0 z-0">
                <MeshGradient
                    className="absolute inset-0 w-full h-full"
                    colors={["#000000", "#111111", "#1a1a1a", "#C9A84C", "#D4AF37"]}
                    speed={0.15}
                    backgroundColor="#020202"
                />
                {/* Wireframe overlay for a high-tech feel */}
                <MeshGradient
                    className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay"
                    colors={["#000000", "#ffffff", "#C9A84C", "#D4AF37"]}
                    speed={0.1}
                    wireframe={true}
                    backgroundColor="transparent"
                />
                {/* Gradients to fade out the edges perfectly */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-[#020202]/50" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020202] via-transparent to-[#020202]" />
            </div>

            {/* Main Content (Centered) */}
            <motion.main
                className="relative z-10 w-full max-w-6xl px-6 flex flex-col items-center text-center mt-12 md:mt-20"
                style={{ opacity: yOpacity, y: yParallax }}
            >

                {/* Hero Headline */}
                <motion.h1
                    className="flex flex-col items-center justify-center font-black tracking-tighter mb-8"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                >
                    <motion.span
                        className="block text-[2.5rem] sm:text-[4rem] md:text-6xl lg:text-[7.5rem] leading-[0.85] uppercase text-transparent bg-clip-text text-center px-4"
                        style={{
                            backgroundImage: "linear-gradient(135deg, #ffffff 0%, #C9A84C 40%, #E5C77A 60%, #ffffff 100%)",
                            backgroundSize: "200% auto",
                            filter: "url(#text-glow)",
                        }}
                        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                        Não é uma
                    </motion.span>
                    <div className="flex flex-col sm:flex-row items-center sm:gap-4 lg:gap-6 mt-4 sm:mt-2">
                        <span className="text-[2.8rem] sm:text-[4.5rem] md:text-[5.5rem] lg:text-[7rem] font-serif italic text-[#C9A84C] drop-shadow-[0_0_40px_rgba(201,168,76,0.3)] leading-none text-center px-4">
                            Luta Justa.
                        </span>
                    </div>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    className="text-base sm:text-lg md:text-xl font-light text-[#FAF8F5]/70 max-w-3xl leading-relaxed mb-12 px-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                >
                    <strong className="font-semibold text-white block mb-2 sm:mb-1">Uma pessoa. Uma plataforma. A operação de marketing inteira.</strong>
                    Espionagem, conteúdo, funil, tracking e otimização — sem agência, sem equipe, sem depender de ninguém.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    className="flex flex-col items-center w-full sm:w-auto px-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                >
                    <motion.button
                        className="group relative w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E5C77A] text-black font-bold uppercase tracking-widest text-sm sm:text-base overflow-hidden transition-all shadow-[0_0_30px_rgba(201,168,76,0.2)] hover:shadow-[0_0_50px_rgba(201,168,76,0.5)]"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Iniciar Guerra
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        {/* Hover Glare Effect */}
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[glare_1s_ease-in-out_forwards]" />
                    </motion.button>

                    <p className="mt-6 text-xs md:text-sm text-white/50 font-medium tracking-wide text-center">
                        Sem cartão. Sem contrato. Sem depender de ninguém.
                    </p>
                </motion.div>
            </motion.main>

            {/* Decorative Floating Spinning Badge */}
            <div className="absolute bottom-8 right-8 z-30 pointer-events-none hidden lg:block">
                <div className="relative w-[120px] h-[120px] flex items-center justify-center">
                    <PulsingBorder
                        colors={["#C9A84C", "#D4AF37", "#f97316", "#ffffff", "#C9A84C"]}
                        colorBack="#00000000"
                        speed={1.5}
                        roundness={1}
                        thickness={0.08}
                        softness={0.2}
                        intensity={5}
                        spotsPerColor={4}
                        spotSize={0.1}
                        pulse={0.1}
                        smoke={0.5}
                        smokeSize={4}
                        scale={0.55}
                        rotation={0}
                        frame={9161408}
                        style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                        }}
                    />
                    <motion.svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 100 100"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 20,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                        style={{ transform: "scale(1.15)" }}
                    >
                        <defs>
                            <path id="circlePath" d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
                        </defs>
                        <text className="text-[9.5px] fill-[#C9A84C]/80 font-bold uppercase tracking-[0.2em]">
                            <textPath href="#circlePath" startOffset="0%">
                                MKTHONEY • Escala Meets Genius • MKTHONEY • Escala •
                            </textPath>
                        </text>
                    </motion.svg>
                </div>
            </div>

            {/* Global CSS for Glare Animation */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes glare {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(200%) rotate(45deg); }
        }
      `}} />
        </section>
    )
}
