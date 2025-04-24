import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  UserCircle,
  Settings, 
  Search, 
  PlusCircle, 
  Users
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const isStudent = user?.userType === 'student';
  
  const navigation = [
    {
      name: "Dashboard",
      href: `/dashboard/${user?.userType}`,
      icon: LayoutDashboard,
      active: location === `/dashboard/${user?.userType}`
    },
    ...(isStudent ? [
      {
        name: "Post Assignment",
        href: "/assignments/create",
        icon: PlusCircle,
        active: location === "/assignments/create"
      }
    ] : [
      {
        name: "Find Assignments",
        href: "/assignments",
        icon: Search,
        active: location === "/assignments"
      }
    ]),
    {
      name: "Browse Assignments",
      href: "/assignments",
      icon: FileText,
      active: location === "/assignments" || location.startsWith("/assignments/")
    },
    {
      name: "Browse Helpers",
      href: "/helpers",
      icon: Users,
      active: location === "/helpers" || location.startsWith("/helpers/")
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageSquare,
      active: location.startsWith("/messages")
    },
    {
      name: "Reviews",
      href: "/reviews",
      icon: UserCircle,
      active: location === "/reviews"
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      active: location === "/settings"
    },
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow border-r border-gray-200 bg-white overflow-y-auto">
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
          <Link href="/">
            <span className="text-xl font-bold text-primary-600 cursor-pointer">Assignment Kore Dibo</span>
          </Link>
        </div>
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
              >
                <a
                  className={cn(
                    item.active
                      ? "bg-gray-100 text-primary-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                  )}
                >
                  <item.icon
                    className={cn(
                      item.active
                        ? "text-primary-500"
                        : "text-gray-400 group-hover:text-gray-500",
                      "mr-3 flex-shrink-0 h-5 w-5"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </a>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
