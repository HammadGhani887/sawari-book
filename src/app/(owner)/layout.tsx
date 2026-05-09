import AuthGuard from "@/components/layout/AuthGuard";
import OwnerBottomNav from "@/components/layout/OwnerBottomNav";
import OwnerSidebar from "@/components/layout/OwnerSidebar";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="owner">
      <div className="flex min-h-screen bg-brand-bg">

        {/* Sidebar — desktop only */}
        <OwnerSidebar />

        {/* Main content */}
        <div className="flex flex-col flex-1 md:ml-60">
          <main className="flex-1 pb-20 md:pb-6">
            <div className="mx-auto w-full max-w-2xl md:max-w-none animate-fadeIn">
              {children}
            </div>
          </main>

          {/* Bottom nav — mobile only */}
          <div className="md:hidden">
            <OwnerBottomNav />
          </div>
        </div>

      </div>
    </AuthGuard>
  );
}
