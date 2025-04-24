
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import SubmissionBox from "./submission-box";

export default function HeroSection() {
  return (
    <section className="bg-[#FDF8F3] min-h-[80vh] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-gray-900">
            Study help built for how you learn
          </h1>
        </div>
        <div className="max-w-2xl mx-auto">
          <SubmissionBox />
        </div>
      </div>
    </section>
  );
}
