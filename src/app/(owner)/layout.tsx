import AuthGuard from "@/components/layout/AuthGuard";
import OwnerBottomNav from "@/components/layout/OwnerBottomNav";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="owner">
      <div className="flex flex-col min-h-screen bg-brand-bg">
        <main className="flex-1 pb-20">
          <div className="mx-auto w-full max-w-2xl lg:max-w-4xl animate-fadeIn">
            {children}
          </div>
        </main>
        <OwnerBottomNav />
      </div>
    </AuthGuard>
  );
}
