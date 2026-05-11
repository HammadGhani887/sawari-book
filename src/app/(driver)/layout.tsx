import AuthGuard from "@/components/layout/AuthGuard";
import DriverBottomNav from "@/components/layout/DriverBottomNav";
import DriverSidebar from "@/components/layout/DriverSidebar";
import DataSyncProvider from "@/components/layout/DataSyncProvider";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="driver">
      <DataSyncProvider>
        <div className="flex h-[100dvh] bg-brand-bg overflow-hidden">

          {/* Sidebar — desktop only */}
          <DriverSidebar />

          {/* Main content */}
          <div className="flex flex-col flex-1 md:ml-60 relative h-full">
            <main className="flex-1 overflow-y-auto pt-safe-top pb-24 md:pb-6 no-scrollbar">
              <div className="mx-auto w-full max-w-lg md:max-w-none px-4 animate-fadeIn">
                {children}
              </div>
            </main>

            {/* Bottom nav — mobile only */}
            <div className="md:hidden shrink-0">
              <DriverBottomNav />
            </div>
          </div>

        </div>
      </DataSyncProvider>
    </AuthGuard>
  );
}
