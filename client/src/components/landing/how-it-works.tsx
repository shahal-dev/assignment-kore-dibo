import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function HowItWorks() {
  const { user } = useAuth();
  
  return (
    <section id="how-it-works" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Get your assignments done in just a few simple steps
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xl font-bold mb-4">1</div>
            <h3 className="text-xl font-semibold text-gray-900">Post Your Assignment</h3>
            <p className="mt-2 text-gray-600">
              Describe your assignment details, set your budget, and choose a deadline.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xl font-bold mb-4">2</div>
            <h3 className="text-xl font-semibold text-gray-900">Get Bids from Helpers</h3>
            <p className="mt-2 text-gray-600">
              Qualified helpers will place bids on your assignment with their proposed rates.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xl font-bold mb-4">3</div>
            <h3 className="text-xl font-semibold text-gray-900">Receive Quality Work</h3>
            <p className="mt-2 text-gray-600">
              Choose a helper, communicate your needs, and receive your completed assignment.
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link href={user ? `/dashboard/${user.userType}` : "/auth"}>
            <Button>
              Get Started Now
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
