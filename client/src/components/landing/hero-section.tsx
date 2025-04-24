
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import SubmissionBox from "./submission-box";

export default function HeroSection() {
  const { user } = useAuth();
  
  return (
    <section className="bg-gradient-to-r from-blue-600 to-indigo-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-white">
              Get Your Assignments Done by Experts
            </h1>
            <p className="mt-6 text-xl max-w-lg text-gray-100">
              Connect with skilled assignment helpers in Bangladesh and get your academic work completed on time.
            </p>
          </div>
          
          <div className="flex justify-center">
            <SubmissionBox />
          </div>
        </div>
      </div>
    </section>
  );
}
