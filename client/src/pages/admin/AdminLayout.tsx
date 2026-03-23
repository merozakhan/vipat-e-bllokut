import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, LogOut, Newspaper } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 bg-card border-r border-border/50 flex flex-col">
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
                (item.href === "/admin" ? location === "/admin" : location.startsWith(item.href)) ? "bg-gold/10 text-gold font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-card"
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
        <div className="p-6 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
