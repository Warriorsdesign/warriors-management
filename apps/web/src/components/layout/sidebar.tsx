"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  CreditCard, 
  Receipt,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Building,
  Users as UsersIcon,
  BarChart3,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useUIStore } from "@/lib/store/useUIStore";
import { mockOrganization, Organization } from "@/lib/data/mockData";

import { useRouter } from "next/navigation";

const gestionItems = [
  { name: "Étudiants", href: "/students", icon: GraduationCap },
  { name: "Formations", href: "/formations", icon: Layers },
  { name: "Classes", href: "/classes", icon: Users },
];

const financesItems = [
  { name: "Paiements", href: "/payments", icon: CreditCard },
  { name: "Dépenses", href: "/expenses", icon: Receipt },
  { name: "Rapports", href: "/reports", icon: BarChart3 },
];

const adminItems = [
  { name: "Centres", href: "/centers", icon: Building },
  { name: "Utilisateurs", href: "/users", icon: UsersIcon },
  { name: "Paramètres", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobileMenuOpen, closeMobileMenu, isSidebarCollapsed, toggleSidebar } = useUIStore();
  const [organization, setOrganization] = useState<Organization>(mockOrganization);
  const [userProfile, setUserProfile] = useState<{ firstName: string, lastName: string, role: string, avatarUrl?: string } | null>(null);

  useEffect(() => {
    const loadOrg = () => {
      const saved = localStorage.getItem('warriors_mock_organization');
      if (saved) {
        setOrganization(JSON.parse(saved));
      }
    };
    
    loadOrg(); // Initial load

    window.addEventListener('organization_updated', loadOrg);
    return () => window.removeEventListener('organization_updated', loadOrg);
  }, []);

  useEffect(() => {
    const loadUser = () => {
      const saved = localStorage.getItem('warriors_mock_user');
      if (saved) {
        setUserProfile(JSON.parse(saved));
      } else {
        setUserProfile({
          firstName: "Admin",
          lastName: "System",
          role: "ADMIN"
        });
      }
    };
    
    loadUser(); // Initial load

    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setUserProfile(customEvent.detail);
      } else {
        loadUser();
      }
    };

    window.addEventListener('user_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('user_profile_updated', handleProfileUpdate);
  }, []);

  const handleLogout = async () => {
    window.location.href = "/login";
  };

  // Compute initials for logo fallback
  const getInitials = (name?: string) => {
    if (!name) return "WM";
    return name
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}
      
      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-50 h-screen bg-card border-r border-border flex-shrink-0 transition-all duration-300 ease-in-out relative whitespace-nowrap",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        isSidebarCollapsed ? "w-[80px]" : "w-[220px]"
      )}>
        {/* Floating Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex absolute -right-3 top-6 w-6 h-6 bg-card border border-border rounded-full items-center justify-center text-muted-foreground hover:text-foreground z-10 shadow-sm cursor-pointer"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        <div className="w-full h-full flex flex-col overflow-x-hidden">
          {/* Brand Header */}
          <div className={cn("h-16 flex items-center border-b border-border", isSidebarCollapsed ? "justify-center px-0" : "px-6")}>
          <div className={cn("flex items-center overflow-hidden", isSidebarCollapsed ? "justify-center" : "gap-3 w-full")}>
            {organization.logoUrl ? (
              <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-white">
                <img key={organization.logoUrl} src={organization.logoUrl} alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            ) : (
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-xs flex-shrink-0">
                {getInitials(organization.name)}
              </div>
            )}
            {!isSidebarCollapsed && (
              <div className="flex-1 overflow-hidden">
                <h2 className="font-bold text-sm text-card-foreground truncate" title={organization?.name || "Warriors Management"}>
                  {organization?.name || "Warriors Management"}
                </h2>
                <p className="text-[11px] text-muted-foreground truncate">Application de Gestion</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto scrollbar-thin">
          {/* Pilotage */}
          <div className="mb-6">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                PILOTAGE
              </p>
            )}
            <div className={cn("space-y-1", isSidebarCollapsed && "flex flex-col items-center")}>
              <Link
                href="/"
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center rounded-lg text-sm transition-colors",
                  isSidebarCollapsed ? "justify-center p-2 w-10 h-10" : "gap-3 px-3 py-2",
                  pathname === "/" 
                    ? "bg-secondary text-foreground font-semibold" 
                    : "text-muted-foreground font-medium hover:bg-secondary hover:text-foreground"
                )}
                title={isSidebarCollapsed ? "Tableau de bord" : undefined}
              >
                <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Tableau de bord</span>}
              </Link>
            </div>
          </div>
          
          {/* Gestion */}
          <div className="mb-6">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                GESTION
              </p>
            )}
            <div className={cn("space-y-1", isSidebarCollapsed && "flex flex-col items-center")}>
              {gestionItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center rounded-lg text-sm transition-colors",
                      isSidebarCollapsed ? "justify-center p-2 w-10 h-10" : "gap-3 px-3 py-2",
                      isActive 
                        ? "bg-secondary text-foreground font-semibold" 
                        : "text-muted-foreground font-medium hover:bg-secondary hover:text-foreground"
                    )}
                    title={isSidebarCollapsed ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Finances */}
          <div className="mb-6">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                FINANCES
              </p>
            )}
            <div className={cn("space-y-1", isSidebarCollapsed && "flex flex-col items-center")}>
              {financesItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center rounded-lg text-sm transition-colors",
                      isSidebarCollapsed ? "justify-center p-2 w-10 h-10" : "gap-3 px-3 py-2",
                      isActive 
                        ? "bg-secondary text-foreground font-semibold" 
                        : "text-muted-foreground font-medium hover:bg-secondary hover:text-foreground"
                    )}
                    title={isSidebarCollapsed ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Administration */}
          <div className="mb-6">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                ADMINISTRATION
              </p>
            )}
            <div className={cn("space-y-1", isSidebarCollapsed && "flex flex-col items-center")}>
              {adminItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center rounded-lg text-sm transition-colors",
                      isSidebarCollapsed ? "justify-center p-2 w-10 h-10" : "gap-3 px-3 py-2",
                      isActive 
                        ? "bg-secondary text-foreground font-semibold" 
                        : "text-muted-foreground font-medium hover:bg-secondary hover:text-foreground"
                    )}
                    title={isSidebarCollapsed ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className={cn("p-4 border-t border-border mt-auto", isSidebarCollapsed && "flex flex-col items-center px-2")}>
          <div className={cn("flex items-center", isSidebarCollapsed ? "justify-center" : "gap-3 px-2")}>
            {userProfile?.avatarUrl ? (
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex-shrink-0">
                <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-sm flex-shrink-0">
                {userProfile ? `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}` : 'U'}
              </div>
            )}
            {!isSidebarCollapsed && (
              <>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold truncate text-foreground leading-tight">
                    {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Utilisateur'}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {userProfile ? (userProfile.role.charAt(0) + userProfile.role.slice(1).toLowerCase()) : 'Chargement...'}
                  </p>
                </div>
                <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
        </div>
      </aside>
    </>
  );
}
