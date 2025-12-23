/**
 * Layout para páginas públicas compartilhadas
 * Sem autenticação, sem sidebar
 */

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#09090b]">
      {children}
    </div>
  );
}

