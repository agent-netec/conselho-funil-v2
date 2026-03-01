import React from 'react';

export default function Footer() {
    return (
        <footer className="w-full bg-[#0D0D12] rounded-t-[4rem] text-[#FAF8F5] px-6 py-20 md:px-12 lg:px-24 border-t border-[#2A2A35]">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8">

                {/* Brand */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex items-center w-64 md:w-80 lg:w-96">
                        <img src="/logo.png" alt="MKTHONEY Logo" className="w-full h-auto object-contain object-left filter brightness-0 invert drop-shadow-[0_2px_15px_rgba(255,255,255,0.1)]" />
                    </div>
                    <p className="font-heading text-[#FAF8F5]/50 max-w-sm font-medium leading-relaxed">
                        O centro de inteligência e conselho de guerra de marketing integrado para agências e gestores de tráfego.
                    </p>

                    {/* Status Indicator */}
                    <div className="mt-4 flex items-center gap-3 w-fit px-4 py-2 rounded border border-[#2A2A35] bg-[#1a1a24]">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="font-data text-xs uppercase tracking-widest text-[#FAF8F5]/70">System Operational</span>
                    </div>
                </div>

                {/* Links 1 */}
                <div className="flex flex-col gap-4">
                    <h4 className="font-data text-xs text-[#C9A84C] uppercase tracking-widest mb-2 font-bold">Navegação</h4>
                    <a href="#features" className="font-heading text-[#FAF8F5]/70 hover:text-[#C9A84C] transition-colors w-fit">Funcionalidades</a>
                    <a href="#protocol" className="font-heading text-[#FAF8F5]/70 hover:text-[#C9A84C] transition-colors w-fit">O Protocolo</a>
                    <a href="#pricing" className="font-heading text-[#FAF8F5]/70 hover:text-[#C9A84C] transition-colors w-fit">Planos</a>
                </div>

                {/* Links 2 */}
                <div className="flex flex-col gap-4">
                    <h4 className="font-data text-xs text-[#C9A84C] uppercase tracking-widest mb-2 font-bold">Legal</h4>
                    <a href="#" className="font-heading text-[#FAF8F5]/70 hover:text-[#C9A84C] transition-colors w-fit">Termos de Uso</a>
                    <a href="#" className="font-heading text-[#FAF8F5]/70 hover:text-[#C9A84C] transition-colors w-fit">Política de Privacidade</a>
                    <a href="#" className="font-heading text-[#FAF8F5]/70 hover:text-[#C9A84C] transition-colors w-fit">Contato</a>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-[#2A2A35] flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-data text-[#FAF8F5]/40">
                <span>© {new Date().getFullYear()} MKTHONEY. All rights reserved.</span>
                <span>DESIGNED FOR DOMINANCE.</span>
            </div>
        </footer>
    );
}
