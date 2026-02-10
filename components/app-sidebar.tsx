"use client";

import * as React from "react";
import {
  IconHome,
  IconBrandGithub,
  IconPencil,
  IconQuestionMark,
  IconUsersGroup,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useAuth } from "@/hooks/authContext";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const data = {
    user: {
      email: user?.email || "me@example.com",
      avatar: `https://robohash.org/${user?.uid}`,
    },
    navMain: [
      {
        title: "Home",
        url: "/",
        icon: IconHome,
      },
      {
        title: "Answer",
        url: "/answer",
        icon: IconPencil,
      },
      {
        title: "Channel",
        url: "/channel",
        icon: IconUsersGroup,
      },
      {
        title: "Question Portal",
        url: "/questionPortal",
        icon: IconQuestionMark,
      },
    ],
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <span className="text-base font-semibold">StudyBits</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                href="https://github.com/abhi3231/StudyBits-Web"
                target="_blank"
                rel="noreferrer"
              >
                <IconBrandGithub className="size-4" />
                <span>abhi3231/StudyBits-Web</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
