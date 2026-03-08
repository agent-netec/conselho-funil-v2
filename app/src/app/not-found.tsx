import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0B09] px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 text-7xl font-black text-[#E6B447]">404</div>
        <h2 className="mb-2 text-xl font-bold text-[#F5E8CE]">
          Pagina nao encontrada
        </h2>
        <p className="mb-8 text-sm text-[#A89B84]">
          O endereco que voce tentou acessar nao existe ou foi movido.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-[#E6B447] px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#F0C35C]"
        >
          Voltar ao inicio
        </Link>
      </div>
    </div>
  );
}
