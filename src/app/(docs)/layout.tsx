import Link from "next/link";
import { HouseIcon } from "lucide-react";
import {
  Sidebar,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import DocsNav from "@/components/docs-nav";
import Breadcrumb from "@/components/breadcrumb";
import SearchPalette from "@/components/search-palette";
import ThemeToggle from "@/components/theme-toggle";
import { getAllCategories, getAllLectures } from "@/lib/content";
import { getSearchDocuments } from "@/lib/search-docs";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const categories = getAllCategories();
  const lectures = getAllLectures();
  const searchDocs = getSearchDocuments();

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <Sidebar variant="floating" collapsible="offcanvas">
        <DocsNav categories={categories} lectures={lectures} />
        <SidebarFooter className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2.5 px-2 text-[13px] text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <HouseIcon className="size-4 shrink-0" />
            Back to home
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-foreground/[0.08] bg-background/85 px-4 py-2 backdrop-blur">
          <SidebarTrigger />
          <Breadcrumb categories={categories} lectures={lectures} />
          <SearchPalette docs={searchDocs} />
          <ThemeToggle />
        </header>
        {children}
      </SidebarInset>
      <SidebarRail />
    </SidebarProvider>
  );
}
