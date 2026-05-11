import AuthGuard from "@/components/layout/AuthGuard";
import OwnerBottomNav from "@/components/layout/OwnerBottomNav";
import OwnerSidebar from "@/components/layout/OwnerSidebar";
import DataSyncProvider from "@/components/layout/DataSyncProvider";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="owner">
      <DataSyncProvider>
        <div className="flex h-[100dvh] bg-brand-bg overflow-hidden">

          {/* Sidebar — desktop only */}
          <OwnerSidebar />

          {/* Main content */}
          <div className="flex flex-col flex-1 md:ml-60 relative h-full">
            <main className="flex-1 overflow-y-auto pt-safe-top pb-24 md:pb-6 no-scrollbar">
              <div className="mx-auto w-full max-w-2xl md:max-w-none px-4 animate-fadeIn">
                {children}
              </div>
            </main>

            {/* Bottom nav — mobile only */}
            <div className="md:hidden shrink-0">
              <OwnerBottomNav />
            </div>
          </div>
        </div>
      </DataSyncProvider>
    </AuthGuard>
  );
}
