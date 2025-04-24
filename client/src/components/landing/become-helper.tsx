import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function BecomeHelper() {
  const { user } = useAuth();
  
  return (
    <section id="become-helper" className="py-16 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Become an Assignment Helper</h2>
            <p className="mt-4 text-lg text-gray-600">
              Use your academic skills to help students and earn money on your own schedule.
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 text-accent-600">
                  <CheckCircle className="h-6 w-6" />
                </span>
                <p className="ml-3 text-base text-gray-600">
                  <strong className="font-medium text-gray-900">Flexible work:</strong> Choose assignments that match your expertise and schedule
                </p>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 text-accent-600">
                  <CheckCircle className="h-6 w-6" />
                </span>
                <p className="ml-3 text-base text-gray-600">
                  <strong className="font-medium text-gray-900">Competitive pay:</strong> Set your own rates based on your skills and experience
                </p>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 text-accent-600">
                  <CheckCircle className="h-6 w-6" />
                </span>
                <p className="ml-3 text-base text-gray-600">
                  <strong className="font-medium text-gray-900">Build your profile:</strong> Earn ratings and reviews to attract more clients
                </p>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 text-accent-600">
                  <CheckCircle className="h-6 w-6" />
                </span>
                <p className="ml-3 text-base text-gray-600">
                  <strong className="font-medium text-gray-900">Secure payments:</strong> Get paid reliably through our platform
                </p>
              </li>
            </ul>
            <div className="mt-8">
              <Link href={user ? (user.userType === 'helper' ? '/dashboard/helper' : '/auth?type=helper') : "/auth?type=helper"}>
                <Button className="bg-accent-600 hover:bg-accent-700">
                  Sign Up as Helper
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=500&q=80" 
              alt="Students working on laptops" 
              className="rounded-lg shadow-lg max-w-md w-full" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
