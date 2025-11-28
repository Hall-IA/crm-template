import { Sidebar } from "@/components/sidebar";
import { MobileMenuProvider } from "@/contexts/mobile-menu-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileMenuProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto lg:ml-0">
          {children}
        </main>
      </div>
    </MobileMenuProvider>
  );
}

