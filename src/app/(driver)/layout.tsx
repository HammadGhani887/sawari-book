import AuthGuard from "@/components/layout/AuthGuard";
import DriverBottomNav from "@/components/layout/DriverBottomNav";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="driver">
      <div className="flex flex-col min-h-screen bg-brand-bg">
        <main className="flex-1 pb-20">
          <div className="mx-auto w-full max-w-lg animate-fadeIn">
            {children}
          </div>
        </main>
        <DriverBottomNav />
      </div>
    </AuthGuard>
  );
}
