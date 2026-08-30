"use client"
import React, { useState, useEffect } from "react";
import { Search, Bell, Menu } from "lucide-react";
import { mockCenters } from "@/lib/data/mockData";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/lib/store/useUIStore";
import { usePathname } from "next/navigation";
import { MultiSelect } from "@/components/ui/multi-select";

export function Topbar() {
  const toggleMobileMenu = useUIStore(state => state.toggleMobileMenu);
  const pathname = usePathname();
  const isDashboard = pathname === "/";

  const [userProfile, setUserProfile] = useState<{ firstName: string, lastName: string, roles: string[], avatarUrl?: string } | null>(null);

  useEffect(() => {
    const loadUser = () => {
      const saved = localStorage.getItem('warriors_mock_user');
      if (saved) {
        setUserProfile(JSON.parse(saved));
      } else {
        setUserProfile({
          firstName: "Admin",
          lastName: "System",
          roles: ["ADMIN"]
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

  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const centerOptions = mockCenters.map(c => ({ label: c.name, value: c.id }));

  const isAdminView = pathname.startsWith('/centers') || pathname.startsWith('/users') || pathname.startsWith('/settings');

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4 justify-end">
        {/* Center Selector */}
        {!isAdminView && (
          <MultiSelect
            label="Tous les centres"
            options={centerOptions}
            selectedValues={selectedCenters}
            onChange={setSelectedCenters}
            className="w-36 md:w-48 flex-shrink-0"
          />
        )}

        {/* Search Bar removed to avoid duplication */}
        
        <div className="flex items-center gap-2 md:gap-3 border-l border-border pl-3 md:pl-4">
          <Badge variant="outline" className="h-7 px-2 font-medium bg-card text-muted-foreground whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 flex-shrink-0"></span>
            Système à jour
          </Badge>
          
          <button className="relative text-muted-foreground hover:text-foreground p-1 flex-shrink-0">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
          </button>
          
          {userProfile?.avatarUrl ? (
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-white ml-1 md:ml-2">
              <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold ml-1 md:ml-2 flex-shrink-0">
              {userProfile ? `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}` : 'U'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
