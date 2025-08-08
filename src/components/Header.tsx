import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, HelpCircle, FileText, ArrowUpToLine, ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-brand-orange text-white text-xs">P</AvatarFallback>
            </Avatar>
            <span className="font-semibold">Personal Team</span>
            <ChevronsUpDown className="h-4 w-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Team 1</DropdownMenuItem>
          <DropdownMenuItem>Team 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="outline" className="space-x-2">
          <HelpCircle className="h-5 w-5" />
          <span>Help</span>
        </Button>
        <Button variant="outline" className="space-x-2">
          <FileText className="h-5 w-5" />
          <span>Docs</span>
        </Button>
        <Button variant="outline" className="space-x-2">
          <ArrowUpToLine className="h-5 w-5" />
          <span>Upgrade Plan</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;