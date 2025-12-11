'use client';

import { Sidebar } from '@/components/sidebar';
import { MobileMenuProvider } from '@/contexts/mobile-menu-context';
import { TaskReminderProvider } from '@/contexts/task-reminder-context';
import { SidebarProvider } from '@/contexts/sidebar-context';
import { ViewAsProvider } from '@/contexts/view-as-context';
import { ViewAsBanner } from '@/components/view-as-banner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ViewAsProvider>
      <MobileMenuProvider>
        <SidebarProvider>
          <TaskReminderProvider>
            <div className="flex h-screen overflow-hidden bg-gray-50">
              <Sidebar />
              <main className="flex flex-1 flex-col overflow-hidden lg:ml-0">
                <ViewAsBanner />
                <div className="flex-1 overflow-y-auto">{children}</div>
              </main>
            </div>
          </TaskReminderProvider>
        </SidebarProvider>
      </MobileMenuProvider>
    </ViewAsProvider>
  );
}
