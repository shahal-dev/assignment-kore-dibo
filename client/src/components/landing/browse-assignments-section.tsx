import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Clock, FileText, User, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function BrowseAssignmentsSection() {
  const { user } = useAuth();
  
  const { 
    data: assignments, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/assignments/recent'],
    queryFn: async () => {
      const res = await fetch('/api/assignments/recent?limit=3');
      if (!res.ok) throw new Error('Failed to fetch recent assignments');
      return res.json();
    }
  });
  
  return (
    <section id="browse-assignments" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Browse Recent Assignments</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Find assignments that match your expertise and start bidding
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Select>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="essay">Essay Writing</SelectItem>
                <SelectItem value="math">Mathematics</SelectItem>
                <SelectItem value="programming">Programming</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="business">Business Studies</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative">
            <Select>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Any Budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Budget</SelectItem>
                <SelectItem value="under500">Under ৳500</SelectItem>
                <SelectItem value="500-1000">৳500 - ৳1000</SelectItem>
                <SelectItem value="1000-2000">৳1000 - ৳2000</SelectItem>
                <SelectItem value="over2000">৳2000+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative">
            <Select>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Any Deadline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Deadline</SelectItem>
                <SelectItem value="24hours">Within 24 hours</SelectItem>
                <SelectItem value="1-3days">1-3 days</SelectItem>
                <SelectItem value="3-7days">3-7 days</SelectItem>
                <SelectItem value="7plus">7+ days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button className="sm:w-auto">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">Failed to load assignments. Please try again later.</p>
            </div>
          ) : assignments?.length > 0 ? (
            assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">
                      <Link href={`/assignments/${assignment.id}`} className="hover:text-primary-600 transition-colors">
                        {assignment.title}
                      </Link>
                    </h3>
                    <Badge>
                      Open
                    </Badge>
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-600">
                    {assignment.description.length > 120 
                      ? `${assignment.description.substring(0, 120)}...` 
                      : assignment.description}
                  </p>
                  
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>Due {formatDistanceToNow(new Date(assignment.deadline), { addSuffix: true })}</span>
                  </div>
                  
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <FileText className="mr-1 h-4 w-4" />
                    <span>Budget: ৳{assignment.budget}</span>
                  </div>
                  
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <User className="mr-1 h-4 w-4" />
                    <span>{assignment.bidCount || 0} bids so far</span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link href={user ? `/assignments/${assignment.id}` : "/auth"}>
                      <Button className="w-full">
                        {user?.userType === 'helper' ? 'Place Bid' : 'View Details'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No assignments found. Check back soon!</p>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <Link href="/assignments">
            <Button>
              View All Assignments
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Search icon component
function Search(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
