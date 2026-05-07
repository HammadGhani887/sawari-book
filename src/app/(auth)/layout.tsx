export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <main className="flex-1 flex flex-col justify-center px-6 py-8 max-w-md mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
