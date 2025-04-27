import { ReactNode } from "react";
import Navbar from "@/components/landing/navbar";
import Sidebar from "@/components/landing/sidebar";

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export default function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className={`flex-1 ${showSidebar ? 'ml-64' : ''} p-8`}>
          {children}
        </main>
      </div>
    </div>
  );
}
