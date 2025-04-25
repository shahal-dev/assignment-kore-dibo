import { Helmet } from "react-helmet";
import Navbar from "@/components/landing/navbar";
import HeroSection from "@/components/landing/hero-section";
import Stats from "@/components/landing/stats";
import HowItWorks from "@/components/landing/how-it-works";
import FeaturedHelpers from "@/components/landing/featured-helpers";
import BecomeHelper from "@/components/landing/become-helper";
import Testimonials from "@/components/landing/testimonials";
import Faq from "@/components/landing/faq";
import Cta from "@/components/landing/cta";
import Footer from "@/components/landing/footer";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // If user is logged in, redirect to the appropriate dashboard
  if (user) {
    if (user.userType === 'student') {
      navigate('/dashboard/student');
    } else {
      navigate('/dashboard/helper');
    }
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Assignment Kore Dibo - Get Your Assignment Done in Bangladesh</title>
        <meta 
          name="description" 
          content="Connect with skilled assignment helpers in Bangladesh and get your academic work completed on time."
        />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-grow">
          <HeroSection />
          <Stats />
          <HowItWorks />
          <FeaturedHelpers />
          <BecomeHelper />
          <Testimonials />
          <Faq />
          <Cta />
        </main>
        
        <Footer />
      </div>
    </>
  );
}
