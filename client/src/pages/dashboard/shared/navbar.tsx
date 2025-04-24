import { Bell, MessageSquare, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function Navbar() {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Get unread messages count
  const { data: conversations } = useQuery({
    queryKey: ['/api/messages'],
    queryFn: async () => {
      const res = await fetch('/api/messages', {
        credentials: 'include'
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user
  });
  
  const unreadMessagesCount = conversations?.reduce(
    (count, conversation) => count + conversation.unreadCount, 
    0
  ) || 0;
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/auth');
      }
    });
  };
  
  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-end">
            <div className="flex items-center space-x-4">
              <Link href="/messages" className="relative">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MessageSquare className="h-5 w-5" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={user?.profileImage} alt={user?.fullName} />
                      <AvatarFallback>{getInitials(user?.fullName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">{user?.fullName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href={`/dashboard/${user?.userType}`}>
                    <DropdownMenuItem>Dashboard</DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="pt-2 pb-3 space-y-1">
            <Link href={`/dashboard/${user?.userType}`}>
              <Button
                variant="ghost"
                className={`w-full justify-start ${location === `/dashboard/${user?.userType}` ? 'bg-gray-100' : ''}`}
              >
                Dashboard
              </Button>
            </Link>
            {user?.userType === 'student' ? (
              <>
                <Link href="/assignments/create">
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start ${location === '/assignments/create' ? 'bg-gray-100' : ''}`}
                  >
                    Post Assignment
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/assignments">
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start ${location === '/assignments' ? 'bg-gray-100' : ''}`}
                  >
                    Find Assignments
                  </Button>
                </Link>
              </>
            )}
            <Link href="/messages">
              <Button 
                variant="ghost" 
                className={`w-full justify-start ${location.startsWith('/messages') ? 'bg-gray-100' : ''}`}
              >
                Messages
              </Button>
            </Link>
            <Link href="/settings">
              <Button 
                variant="ghost" 
                className={`w-full justify-start ${location === '/settings' ? 'bg-gray-100' : ''}`}
              >
                Settings
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function getInitials(name: string = '') {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
