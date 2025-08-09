import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Home, Play, SlidersHorizontal, List, BarChart2, KeyRound, Settings, Megaphone, PanelLeftClose, PanelRightClose } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const NavLink = ({ to, icon: Icon, children, isCollapsed }: { to: string; icon: React.ElementType; children: React.ReactNode; isCollapsed: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  const linkContent = (
    <Link
      to={to}
      className={cn(
        "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100",
        isActive && "bg-brand-orange-light text-brand-orange",
        isCollapsed && "justify-center space-x-0"
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!isCollapsed && <span className="flex-1">{children}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right"><p>{children}</p></TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
};

const SubNavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "block rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100",
        isActive && "text-brand-orange font-medium"
      )}
    >
      {children}
    </Link>
  );
};

const Sidebar = ({ isCollapsed, toggleSidebar }: { isCollapsed: boolean, toggleSidebar: () => void }) => {
  const location = useLocation();
  const isDataSourceActive = location.pathname.startsWith('/data-source');

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "flex-shrink-0 border-r border-gray-200 bg-sidebar flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn(
          "flex h-16 flex-shrink-0 items-center justify-center border-b border-gray-200 px-4"
        )}>
          <Link to="/">
            <img src="/logolistenpro.png" alt="Listen Pro Logo" className="h-14 object-contain" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-1">
            <NavLink to="/overview" icon={Home} isCollapsed={isCollapsed}>Overview</NavLink>
            <NavLink to="/" icon={Play} isCollapsed={isCollapsed}>Playground</NavLink>
            
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger className="w-full">
                  <div className="flex items-center justify-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600">
                    <SlidersHorizontal className="h-5 w-5 flex-shrink-0" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Thiết lập nguồn</p></TooltipContent>
              </Tooltip>
            ) : (
              <Accordion type="single" collapsible defaultValue={isDataSourceActive ? "item-1" : undefined}>
                <AccordionItem value="item-1" className="border-none">
                  <AccordionTrigger className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <div className="flex items-center space-x-3">
                      <SlidersHorizontal className="h-5 w-5" />
                      <span>Thiết lập nguồn</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-8 pb-0">
                    <nav className="space-y-1">
                      <SubNavLink to="/data-source/website">Website</SubNavLink>
                      <SubNavLink to="/data-source/facebook">Group Facebook</SubNavLink>
                    </nav>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            <NavLink to="/activity" icon={List} isCollapsed={isCollapsed}>Activity Logs</NavLink>
            <NavLink to="/usage" icon={BarChart2} isCollapsed={isCollapsed}>Usage</NavLink>
            <NavLink to="/keys" icon={KeyRound} isCollapsed={isCollapsed}>API Keys</NavLink>
            <NavLink to="/settings" icon={Settings} isCollapsed={isCollapsed}>Settings</NavLink>
          </nav>
        </div>
        <div className="p-4 space-y-4 border-t border-gray-200">
          {!isCollapsed && (
            <div className="rounded-lg border border-orange-200 bg-brand-orange-light p-4">
              <div className="flex items-center space-x-3">
                <Megaphone className="h-5 w-5 text-brand-orange" />
                <p className="font-semibold text-sm">What's New</p>
                <span className="text-xs font-bold bg-brand-orange text-white rounded-full px-2 py-0.5">5</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">View our latest update</p>
            </div>
          )}
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gray-200 text-sm">H</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">Hữu Long</span>
              </div>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
              {isCollapsed ? <PanelRightClose className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;