import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, LogOut, Newspaper, Menu, X } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: admin, isLoading } = trpc.admin.me.useQuery();
  const logout = trpc.admin.logout.useMutation({
    onSuccess: () => navigate("/admin/login"),
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full" />
    </div>;
  }

  if (!admin) {
    navigate("/admin/login");
    return null;
  }

  const nav = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/articles", label: "Articles", icon: FileText },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? location === "/admin" : location.startsWith(href);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-3 bg-card border-b border-border/50">
        <Link href="/">
          <span className="flex items-center gap-2 text-gold font-black text-sm cursor-pointer">
            <Newspaper className="w-5 h-5" />
            VEB Admin
          </span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-muted-foreground hover:text-foreground"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 h-full bg-card border-r border-border/50 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <Link href="/">
                <span className="flex items-center gap-2 text-gold font-black text-sm cursor-pointer">
                  <Newspaper className="w-5 h-5" />
                  VEB Admin
                </span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  <span
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-sans cursor-pointer transition-colors ${
                      isActive(item.href) ? "bg-gold/10 text-gold font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-card"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>
            <div className="p-3 border-t border-border/50">
              <button
                onClick={() => logout.mutate()}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-sans text-muted-foreground hover:text-red-400 w-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 bg-card border-r border-border/50 flex-col flex-shrink-0">
        <div className="p-4 border-b border-border/50">
          <Link href="/">
            <span className="flex items-center gap-2 text-gold font-black text-sm cursor-pointer">
              <Newspaper className="w-5 h-5" />
              VEB Admin
            </span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              <span className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-sans cursor-pointer transition-colors ${
                isActive(item.href) ? "bg-gold/10 text-gold font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-card"
              }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border/50">
          <button
            onClick={() => logout.mutate()}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-sans text-muted-foreground hover:text-red-400 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
