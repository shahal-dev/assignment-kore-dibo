import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-primary-600 font-bold text-xl">Assignment Kore Dibo</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/#how-it-works" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
              How It Works
            </Link>
            <Link href="/assignments" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
              Browse Assignments
            </Link>
            <Link href="/#become-helper" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
              Become a Helper
            </Link>
            
            {!user ? (
              <>
                <Link href="/auth" className="px-3 py-2 rounded-md text-sm font-medium text-primary-600 hover:text-primary-700">
                  Sign In
                </Link>
                <Link href="/auth?tab=register" className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                  Sign Up
                </Link>
              </>
            ) : (
              <Link href={`/dashboard/${user.userType}`} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                Dashboard
              </Link>
            )}
          </div>
          
          {/* Mobile Navigation Button */}
          <div className="flex md:hidden items-center">
            <button 
              onClick={toggleMobileMenu} 
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/#how-it-works" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
              How It Works
            </Link>
            <Link href="/assignments" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
              Browse Assignments
            </Link>
            <Link href="/#become-helper" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
              Become a Helper
            </Link>
            
            {!user ? (
              <>
                <Link href="/auth" className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:text-primary-700">
                  Sign In
                </Link>
                <Link href="/auth?tab=register" className="block px-3 py-2 rounded-md text-base font-medium w-full text-center text-white bg-primary-600 hover:bg-primary-700 py-3 mt-2">
                  Sign Up
                </Link>
              </>
            ) : (
              <Link href={`/dashboard/${user.userType}`} className="block px-3 py-2 rounded-md text-base font-medium w-full text-center text-white bg-primary-600 hover:bg-primary-700 py-3 mt-2">
                Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
