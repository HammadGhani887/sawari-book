import AuthGuard from "@/components/layout/AuthGuard";
import OwnerBottomNav from "@/components/layout/OwnerBottomNav";
import OwnerSidebar from "@/components/layout/OwnerSidebar";
import DataSyncProvider from "@/components/layout/DataSyncProvider";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  // Triggering new deployment for public repo
  return (
    <AuthGuard requiredRole="owner">
      <DataSyncProvider>
        <div className="flex min-h-screen bg-brand-bg">

          {/* Sidebar — desktop only */}
          <OwnerSidebar />

          {/* Main content */}
          <div className="flex flex-col flex-1 md:ml-60 w-full min-w-0">
            <main className="flex-1 pb-20 md:pb-6 w-full">
              <div className="mx-auto w-full max-w-lg md:max-w-none animate-fadeIn px-0">
                {children}
              </div>
            </main>

            {/* Bottom nav — mobile only */}
            <div className="md:hidden">
              <OwnerBottomNav />
            </div>
          </div>

        </div>
      </DataSyncProvider>
    </AuthGuard>
  );
}
