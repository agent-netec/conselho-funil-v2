import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface pt-20 pb-10 border-t border-bronze/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div>
            <h4 className="text-primary font-bold mb-6">Produto</h4>
            <ul className="space-y-3 text-sm text-secondary">
              <li><a href="#" className="hover:text-accent transition">Funcionalidades</a></li>
              <li><a href="#" className="hover:text-accent transition">Preços</a></li>
              <li><a href="#" className="hover:text-accent transition">Changelog</a></li>
              <li><a href="#" className="hover:text-accent transition">Status</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-primary font-bold mb-6">Recursos</h4>
             <ul className="space-y-3 text-sm text-secondary">
              <li><a href="#" className="hover:text-accent transition">Blog</a></li>
              <li><a href="#" className="hover:text-accent transition">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-accent transition">API Docs</a></li>
              <li><a href="#" className="hover:text-accent transition">Comunidade</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-primary font-bold mb-6">Empresa</h4>
             <ul className="space-y-3 text-sm text-secondary">
              <li><a href="#" className="hover:text-accent transition">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-accent transition">Contato</a></li>
              <li><a href="#" className="hover:text-accent transition">Carreiras</a></li>
              <li><a href="#" className="hover:text-accent transition">Imprensa</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-primary font-bold mb-6">Legal</h4>
             <ul className="space-y-3 text-sm text-secondary">
              <li><a href="#" className="hover:text-accent transition">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-accent transition">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-accent transition">LGPD</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-bronze/20 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-2xl font-bold text-primary tracking-tight">
              Mkt<span className="text-accent">Honey</span>
            </span>
          </div>
          
          <div className="flex space-x-6 mb-4 md:mb-0">
            <span className="text-sm cursor-pointer text-muted hover:text-accent transition">[Instagram]</span>
            <span className="text-sm cursor-pointer text-muted hover:text-accent transition">[LinkedIn]</span>
            <span className="text-sm cursor-pointer text-muted hover:text-accent transition">[Twitter/X]</span>
            <span className="text-sm cursor-pointer text-muted hover:text-accent transition">[YouTube]</span>
          </div>

          <div className="text-xs text-muted">
            &copy; 2026 MktHoney. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;