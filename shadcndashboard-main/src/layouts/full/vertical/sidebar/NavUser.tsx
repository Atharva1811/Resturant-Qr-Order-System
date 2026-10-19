import { LifeBuoy, Settings } from 'lucide-react';
import { Link } from 'react-router';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroupContent, SidebarGroup } from "@/components/ui/sidebar";
import { BRAND_CONFIG } from 'src/config/brand.config';

export function NavUser() {
    const navItems = [
        {
            title: "Support",
            url: `mailto:${BRAND_CONFIG.supportEmail}`,
            icon: LifeBuoy,
            external: true,
        },
        {
            title: "Settings",
            url: "/admin/settings",
            icon: Settings,
            external: false,
        },
    ];

    return (
        <SidebarGroup className="mt-auto p-0">
            <SidebarGroupContent>
                <SidebarMenu className=" ">
                    {navItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton size="lg" className="h-full cursor-pointer">
                                <Link to={item.url}>
                                    <div className="flex items-center gap-3 w-full">
                                        <item.icon className="shadow-none size-5 shrink-0" />
                                        <div className="flex flex-col flex-1 text-left text-sm leading-tight hide-menu whitespace-nowrap">
                                            <span className="truncate font-medium">{item.title}</span>
                                        </div>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
