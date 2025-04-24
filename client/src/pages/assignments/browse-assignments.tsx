import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { 
  Search, 
  Filter, 
  Clock, 
  Tag, 
  Calendar,
  FileText,
  Loader2,
  User,
  Info,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/landing/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const categories = [
  "All Categories",
  "Essay Writing",
  "Mathematics",
  "Programming",
  "Science",
  "Research Paper",
  "Business Studies",
  "Engineering",
  "Literature Review",
  "Case Study",
  "Other"
];

const budgetRanges = [
  { label: "Any Budget", value: "any" },
  { label: "Under ৳500", value: "500" },
  { label: "৳500 - ৳1000", value: "1000" },
  { label: "৳1000 - ৳2000", value: "2000" },
  { label: "৳2000+", value: "2000+" }
];

const deadlineRanges = [
  { label: "Any Deadline", value: "any" },
  { label: "Within 24 hours", value: "24h" },
  { label: "1-3 days", value: "3d" },
  { label: "3-7 days", value: "7d" },
  { label: "7+ days", value: "7d+" }
];

export default function BrowseAssignments() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [budget, setBudget] = useState("any");
  const [deadline, setDeadline] = useState("any");
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  
  // Fetch assignments
  const { 
    data: assignments, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/assignments'],
    queryFn: async () => {
      const res = await fetch('/api/assignments');
      if (!res.ok) throw new Error('Failed to fetch assignments');
      return res.json();
    },
  });
  
  // Apply filters
  useEffect(() => {
    if (!assignments) return;
    
    let filtered = [...assignments];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        assignment => 
          assignment.title.toLowerCase().includes(query) || 
          assignment.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (category !== "All Categories") {
      filtered = filtered.filter(assignment => assignment.category === category);
    }
    
    // Filter by budget
    if (budget && budget !== "any") {
      if (budget === "2000+") {
        filtered = filtered.filter(assignment => assignment.budget >= 2000);
      } else {
        const maxBudget = parseInt(budget);
        if (budget.includes("-")) {
          const [min, max] = budget.split("-").map(b => parseInt(b.trim()));
          filtered = filtered.filter(
            assignment => assignment.budget >= min && assignment.budget <= max
          );
        } else {
          filtered = filtered.filter(assignment => assignment.budget <= maxBudget);
        }
      }
    }
    
    // Filter by deadline
    if (deadline && deadline !== "any") {
      const now = new Date();
      let compareDate = new Date();
      
      if (deadline === "24h") {
        compareDate.setHours(compareDate.getHours() + 24);
        filtered = filtered.filter(
          assignment => new Date(assignment.deadline) <= compareDate
        );
      } else if (deadline === "3d") {
        const nextDay = new Date(now);
        nextDay.setHours(nextDay.getHours() + 24);
        
        compareDate.setDate(compareDate.getDate() + 3);
        filtered = filtered.filter(
          assignment => 
            new Date(assignment.deadline) > nextDay && 
            new Date(assignment.deadline) <= compareDate
        );
      } else if (deadline === "7d") {
        const threeDaysLater = new Date(now);
        threeDaysLater.setDate(threeDaysLater.getDate() + 3);
        
        compareDate.setDate(compareDate.getDate() + 7);
        filtered = filtered.filter(
          assignment => 
            new Date(assignment.deadline) > threeDaysLater && 
            new Date(assignment.deadline) <= compareDate
        );
      } else if (deadline === "7d+") {
        compareDate.setDate(compareDate.getDate() + 7);
        filtered = filtered.filter(
          assignment => new Date(assignment.deadline) > compareDate
        );
      }
    }
    
    // Only show open assignments
    filtered = filtered.filter(assignment => assignment.isOpen);
    
    // Sort by newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setFilteredAssignments(filtered);
  }, [assignments, searchQuery, category, budget, deadline]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    // The search is already handled by the useEffect above
  };
  
  const handleClearFilters = () => {
    setSearchQuery("");
    setCategory("All Categories");
    setBudget("any");
    setDeadline("any");
  };

  return (
    <>
      <Helmet>
        <title>Browse Assignments - Assignment Kore Dibo</title>
      </Helmet>
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Browse Assignments</h1>
            <p className="mt-2 text-lg text-gray-600">
              Find assignments that match your expertise and start bidding
            </p>
          </div>
          
          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search assignments..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <Button type="submit" className="sm:w-auto w-full">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={budget} onValueChange={setBudget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetRanges.map(range => (
                        <SelectItem key={range.label} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={deadline} onValueChange={setDeadline}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select deadline" />
                    </SelectTrigger>
                    <SelectContent>
                      {deadlineRanges.map(range => (
                        <SelectItem key={range.label} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {(searchQuery || category !== "All Categories" || budget !== "any" || deadline !== "any") && (
                  <div className="flex justify-end">
                    <Button type="button" variant="outline" onClick={handleClearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Error loading assignments</h3>
              <p className="mt-2 text-gray-600">
                Please try again later.
              </p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-16">
              <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No assignments found</h3>
              <p className="mt-2 text-gray-600">
                No assignments match your current filters. Try changing your search criteria.
              </p>
              <Button className="mt-4" onClick={handleClearFilters}>Clear Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map(assignment => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function AssignmentCard({ assignment }) {
  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            <Link href={`/assignments/${assignment.id}`}>
              <a className="hover:text-primary-600 transition-colors">{assignment.title}</a>
            </Link>
          </h3>
          <Badge>{assignment.category}</Badge>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
          {assignment.description}
        </p>
        
        <div className="space-y-2 text-sm text-gray-500 mt-auto">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span>Due {formatDistanceToNow(new Date(assignment.deadline), { addSuffix: true })}</span>
          </div>
          
          <div className="flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            <span>Budget: ৳{assignment.budget}</span>
          </div>
          
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            <span>{assignment.bidCount || 0} bids</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link href={`/assignments/${assignment.id}`}>
            <Button className="w-full">View Details</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
