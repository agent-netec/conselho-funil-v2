export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages don't have the sidebar
  return <>{children}</>;
}


