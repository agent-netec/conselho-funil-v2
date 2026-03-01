import React from "react";
import { Icons } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Instagram, Linkedin, Twitter, Youtube, ArrowRight } from "lucide-react"

function StackedCircularFooter() {
    return (
        <footer className="bg-[#050505] py-20 border-t border-white/5 relative overflow-hidden">

            {/* Background Subtle Gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#C9A84C]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
                <div className="flex flex-col items-center relative z-10">

                    {/* Circular Logo Area */}
                    <div className="mb-10 rounded-full bg-gradient-to-b from-[#C9A84C]/20 to-transparent p-px group cursor-pointer shadow-[0_0_40px_rgba(201,168,76,0.1)] hover:shadow-[0_0_60px_rgba(201,168,76,0.2)] transition-shadow duration-700">
                        <div className="rounded-full bg-[#050505] w-24 h-24 md:w-32 md:h-32 p-4 md:p-6 flex items-center justify-center group-hover:bg-[#0a0a0a] transition-colors duration-500 overflow-hidden">
                            <img src="/logo.png" alt="MKTHONEY Logo" className="w-[180%] max-w-none h-auto object-contain filter brightness-0 invert opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                        </div>
                    </div>

                    <h3 className="font-heading font-black text-3xl md:text-5xl lg:text-6xl text-white mb-2 text-center uppercase tracking-tighter">
                        Seus concorrentes não estão esperando você montar uma equipe.
                    </h3>

                    <div className="mt-12 mb-6 w-full max-w-lg">
                        <form className="flex space-x-3 p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md focus-within:border-[#C9A84C]/50 transition-colors">
                            <div className="flex-grow">
                                <Label htmlFor="email" className="sr-only">Email</Label>
                                <Input
                                    id="email"
                                    placeholder="Seu melhor e-mail de guerra"
                                    type="email"
                                    className="rounded-full border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 h-14 md:h-16 px-6 font-medium md:text-lg"
                                />
                            </div>
                            <Button type="submit" className="rounded-full bg-[#C9A84C] text-[#050505] hover:bg-[#E5C77A] font-bold uppercase tracking-widest h-14 md:h-16 px-8 md:px-10 text-sm md:text-base">
                                Entrar <span className="text-xl md:text-2xl leading-none -mt-0.5 ml-2">&rarr;</span>
                            </Button>
                        </form>
                        <p className="text-[#FAF8F5]/40 font-medium text-xs md:text-sm mt-4 text-center tracking-wide">
                            Zero spam. Só munição estratégica.
                        </p>
                    </div>

                    <nav className="my-14 flex flex-wrap justify-center gap-6 md:gap-10 font-heading text-[11px] md:text-xs uppercase tracking-[0.2em] font-bold text-[#FAF8F5]/60">
                        <a href="#features" className="hover:text-[#C9A84C] transition-colors">Arsenal</a>
                        <span className="text-white/20">·</span>
                        <a href="#philosophy" className="hover:text-[#C9A84C] transition-colors">Filosofia</a>
                        <span className="text-white/20">·</span>
                        <a href="#protocol" className="hover:text-[#C9A84C] transition-colors">Protocolo</a>
                        <span className="text-white/20">·</span>
                        <a href="#pricing" className="hover:text-[#C9A84C] transition-colors">Preços</a>
                        <span className="text-white/20">·</span>
                        <a href="#faq" className="hover:text-[#C9A84C] transition-colors">FAQ</a>
                    </nav>

                    <div className="mb-14 flex space-x-5">
                        <Button variant="outline" size="icon" className="rounded-full w-12 h-12 bg-transparent border-white/10 text-white hover:bg-[#C9A84C] hover:text-[#050505] hover:border-[#C9A84C] transition-all duration-300 hover:scale-110">
                            <Instagram className="h-5 w-5" />
                            <span className="sr-only">Instagram</span>
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full w-12 h-12 bg-transparent border-white/10 text-white hover:bg-[#C9A84C] hover:text-[#050505] hover:border-[#C9A84C] transition-all duration-300 hover:scale-110">
                            <Linkedin className="h-5 w-5" />
                            <span className="sr-only">LinkedIn</span>
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full w-12 h-12 bg-transparent border-white/10 text-white hover:bg-[#C9A84C] hover:text-[#050505] hover:border-[#C9A84C] transition-all duration-300 hover:scale-110">
                            <Twitter className="h-5 w-5" />
                            <span className="sr-only">X</span>
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full w-12 h-12 bg-transparent border-white/10 text-white hover:bg-[#C9A84C] hover:text-[#050505] hover:border-[#C9A84C] transition-all duration-300 hover:scale-110">
                            <Youtube className="h-5 w-5" />
                            <span className="sr-only">YouTube</span>
                        </Button>
                    </div>

                    <div className="w-full pt-10 border-t border-white/10 flex flex-col items-center gap-6">
                        <div className="flex gap-6 md:gap-8 text-xs font-data text-[#FAF8F5]/40 uppercase tracking-widest font-bold">
                            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
                            <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
                            <a href="#" className="hover:text-white transition-colors">LGPD</a>
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full text-xs text-[#FAF8F5]/40 font-medium tracking-wide">
                            <p>© 2026 MKTHoney. Todos os direitos reservados.</p>
                            <p className="font-bold text-[#C9A84C]/60 tracking-widest uppercase">Uma pessoa. Uma plataforma. Sem limites.</p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default StackedCircularFooter;
