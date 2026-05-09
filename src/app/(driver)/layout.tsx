import AuthGuard from "@/components/layout/AuthGuard";
import DriverBottomNav from "@/components/layout/DriverBottomNav";
import DriverSidebar from "@/components/layout/DriverSidebar";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="driver">
      <div className="flex min-h-screen bg-brand-bg">

        {/* Sidebar — desktop only */}
        <DriverSidebar />

        {/* Main content */}
        <div className="flex flex-col flex-1 md:ml-60">
          <main className="flex-1 pb-20 md:pb-6">
            <div className="mx-auto w-full max-w-lg md:max-w-none animate-fadeIn">
              {children}
            </div>
          </main>

          {/* Bottom nav — mobile only */}
          <div className="md:hidden">
            <DriverBottomNav />
          </div>
        </div>

      </div>
    </AuthGuard>
  );
}
