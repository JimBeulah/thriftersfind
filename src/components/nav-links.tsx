
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  LineChart,
  Settings,
  User,
  ShieldCheck,
  Package,
  Boxes,
  DollarSign,
  ChevronDown,
  Database,
  Download,
  MapPin,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { UserPermissions } from "@/lib/types";

const links = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard />,
    permission: "dashboard",
  },
  {
    href: "/orders",
    label: "Orders",
    icon: <ShoppingCart />,
    permission: "orders",
  },
  {
    href: "/batches",
    label: "Batches",
    icon: <Package />,
    permission: "batches",
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: <Boxes />,
    permission: "inventory",
  },
  {
    href: "/customers",
    label: "Customers",
    icon: <Users />,
    permission: "customers",
  },
  {
    href: "/stations",
    label: "Courier & Pickup Stations",
    icon: <MapPin />,
    permission: "settings", // Assuming stations falls under settings or needs its own permission. using 'settings' or 'dashboard' or NONE?
    // User requested "disabled features must not appear". Custom logic needed.
    // Let's assume stations is allowed for everyone or maybe check if there's a permission.
    // The previous code had admin: true.
    // I'll leave it as visible or map to 'settings' for now, or maybe 'dashboard' if general.
    // Actually, let's map it to 'settings' for safety, or create a 'stations' permission if needed.
    // Looking at actions, default permissions include 'settings'.
    // Let's rely on 'settings' for now as it's configuration.
  },
  {
    href: "/users",
    label: "Users",
    icon: <ShieldCheck />,
    permission: "users",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: <LineChart />,
    permission: "reports",
  },
  {
    href: "/sales",
    label: "Sales",
    icon: <DollarSign />,
    permission: "reports", // map sales to reports for now? or maybe it needs 'sales' permission? defaulting to reports.
  },
  {
    href: "/profile",
    label: "Profile",
    icon: <User />,
    permission: null, // Always visible
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <Settings />,
    permission: "settings",
  },
];

interface NavLinksProps {
  permissions?: UserPermissions;
  role?: string;
}

export function NavLinks({ permissions, role }: NavLinksProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [adminManageOpen, setAdminManageOpen] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    // Auto-open Settings accordion if on a settings-related page
    if (pathname.startsWith('/settings')) {
      setSettingsOpen(true);
    }
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  if (!isMounted) return null;

  const isSuperAdmin = role === 'Super Admin';

  // Debug logging
  console.log('NavLinks - Role:', role);
  console.log('NavLinks - isSuperAdmin:', isSuperAdmin);

  const filteredLinks = links.filter(link => {
    if (link.permission === null) return true; // Always visible
    if (isSuperAdmin) return true; // Super Admin sees all associated permissions
    // Note: Stations mapped to 'settings'. If users have 'settings: false', they won't see Stations.

    // Check strict permission
    const permKey = link.permission as keyof UserPermissions;
    return !!permissions?.[permKey];
  });

  return (
    <SidebarMenu>
      {filteredLinks.map((link) => {
        // Special handling for Settings - make it collapsible
        if (link.href === '/settings') {
          return (
            <Collapsible
              key={link.href}
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={link.label}
                    isActive={isActive(link.href)}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu className="pl-4 border-l ml-4 mt-1">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive('/settings/import-database')}
                        tooltip="Import Database"
                      >
                        <Link href="/settings/import-database">
                          <Database className="h-4 w-4" />
                          <span>Import Database</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive('/settings/download-database')}
                        tooltip="Download Database"
                      >
                        <Link href="/settings/download-database">
                          <Download className="h-4 w-4" />
                          <span>Download Database</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        }

        // Regular menu items
        return (
          <SidebarMenuItem key={link.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive(link.href)}
              tooltip={link.label}
            >
              <Link href={link.href}>
                {link.icon}
                <span>{link.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}

      {/* Admin Manage Section - Only visible for Super Admin */}
      {isSuperAdmin && (
        <>
          {/* Boundary separator */}
          <div className="my-2 border-t border-sidebar-border" />

          <Collapsible
            open={adminManageOpen}
            onOpenChange={setAdminManageOpen}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Admin Manage">
                  <ShieldCheck />
                  <span>Admin Manage</span>
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenu className="pl-4 border-l ml-4 mt-1">
                  {/* Add admin management items here */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Manage System"
                    >
                      <div className="text-muted-foreground text-sm py-2">
                        Admin features coming soon
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </>
      )}
    </SidebarMenu>
  );
}
