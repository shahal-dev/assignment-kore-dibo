import { Link } from "wouter";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  MapPin, 
  Mail, 
  Phone 
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center">
              <span className="text-white font-bold text-xl">Assignment Kore Dibo</span>
            </div>
            <p className="mt-2 text-sm">
              The premier platform connecting students with assignment helpers across Bangladesh.
            </p>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">For Students</h3>
            <ul className="space-y-2">
              <li><Link href="#how-it-works" className="text-gray-400 hover:text-white">How It Works</Link></li>
              <li><Link href="/auth" className="text-gray-400 hover:text-white">Post an Assignment</Link></li>
              <li><Link href="/helpers" className="text-gray-400 hover:text-white">Browse Helpers</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Payment Methods</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Student FAQs</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">For Helpers</h3>
            <ul className="space-y-2">
              <li><Link href="#become-helper" className="text-gray-400 hover:text-white">Why Join Us</Link></li>
              <li><Link href="/auth?type=helper" className="text-gray-400 hover:text-white">Apply as Helper</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Helper Guidelines</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Commission Rates</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Helper FAQs</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mt-1 mr-2" />
                <span>Dhaka, Bangladesh</span>
              </li>
              <li className="flex items-start">
                <Mail className="h-5 w-5 mt-1 mr-2" />
                <span>info@assignmentkoredibo.com</span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 mt-1 mr-2" />
                <span>+880 1XXXXXXXXX</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">© 2023 Assignment Kore Dibo. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link>
            <Link href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link>
            <Link href="#" className="text-gray-400 hover:text-white text-sm">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
