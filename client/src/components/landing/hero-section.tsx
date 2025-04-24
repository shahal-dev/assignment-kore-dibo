import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function HeroSection() {
  const { user } = useAuth();
  
  return (
    <section className="bg-gradient-to-r from-primary-600 to-accent-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Get Your Assignments Done by Experts
            </h1>
            <p className="mt-6 text-xl max-w-lg">
              Connect with skilled assignment helpers in Bangladesh and get your academic work completed on time.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href={user ? `/dashboard/${user.userType}` : "/auth"} className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50">
                Post an Assignment
              </Link>
              <Link href={user ? `/dashboard/${user.userType}` : "/auth?type=helper"} className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-secondary-600 hover:bg-secondary-700">
                Become a Helper
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80" 
              alt="Students studying together" 
              className="rounded-lg shadow-lg" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
