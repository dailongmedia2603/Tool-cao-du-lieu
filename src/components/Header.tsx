import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, ArrowUpToLine, LogOut, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  session: Session;
}

const Header = ({ session }: HeaderProps) => {
  const navigate = useNavigate();
  const user = session.user;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getInitials = (email: string) => {
    return email ? email.charAt(0).toUpperCase() : 'P';
  }

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        {/* Placeholder for breadcrumbs or title if needed later */}
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="outline" className="space-x-2" onClick={() => navigate('/guide')}>
          <BookOpen className="h-5 w-5" />
          <span>Hướng dẫn</span>
        </Button>
        <Button variant="outline" className="space-x-2">
          <ArrowUpToLine className="h-5 w-5" />
          <span>Upgrade Plan</span>
        </Button>
        <Button variant="outline" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                <AvatarFallback className="bg-brand-orange text-white">{getInitials(user.email || '')}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Tài khoản</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/account')}>
              Tài khoản
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              Cài đặt
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500 focus:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;