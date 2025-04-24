import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function Cta() {
  const { user } = useAuth();
  
  return (
    <section className="bg-gradient-to-r from-primary-600 to-accent-600 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white">Ready to Get Started?</h2>
        <p className="mt-4 text-xl text-white opacity-90 max-w-2xl mx-auto">
          Join thousands of students and helpers on Bangladesh's premier assignment assistance platform
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={user ? (user.userType === 'student' ? '/assignments/create' : '/assignments') : "/auth"}>
            <Button variant="default" className="bg-white text-primary-600 hover:bg-gray-50">
              {user?.userType === 'student' ? 'Post an Assignment' : 
               user?.userType === 'helper' ? 'Find Assignments' : 'Post an Assignment'}
            </Button>
          </Link>
          <Link href={user ? `/dashboard/${user.userType}` : "/auth?type=helper"}>
            <Button variant="outline" className="border-white text-white hover:bg-primary-700">
              {user ? 'Go to Dashboard' : 'Become a Helper'}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
