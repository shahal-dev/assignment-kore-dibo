import { Link } from "wouter";
import { 
  Home, 
  Book, 
  Users, 
  MessageSquare, 
  Settings,
  HelpCircle
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 p-4">
      <nav className="space-y-2">
        <Link href="/">
          <a className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Home className="h-5 w-5 mr-3" />
            Dashboard
          </a>
        </Link>
        <Link href="/assignments">
          <a className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Book className="h-5 w-5 mr-3" />
            Assignments
          </a>
        </Link>
        <Link href="/helpers">
          <a className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Users className="h-5 w-5 mr-3" />
            Helpers
          </a>
        </Link>
        <Link href="/messages">
          <a className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <MessageSquare className="h-5 w-5 mr-3" />
            Messages
          </a>
        </Link>
        <Link href="/help">
          <a className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <HelpCircle className="h-5 w-5 mr-3" />
            Help & Support
          </a>
        </Link>
        <Link href="/settings">
          <a className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </a>
        </Link>
      </nav>
    </aside>
  );
}
