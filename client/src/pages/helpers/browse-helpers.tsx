import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { 
  Search, 
  Loader2,
  AlertCircle,
  Info
} from "lucide-react";
import Navbar from "@/components/landing/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/ui/star-rating";

export default function BrowseHelpers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredHelpers, setFilteredHelpers] = useState([]);
  
  // Fetch helpers
  const { 
    data: helpers, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/helpers'],
    queryFn: async () => {
      const res = await fetch('/api/helpers');
      if (!res.ok) throw new Error('Failed to fetch helpers');
      return res.json();
    },
  });
  
  // Apply search filter
  useEffect(() => {
    if (!helpers) return;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = helpers.filter(
        helper => 
          helper.fullName.toLowerCase().includes(query) || 
          (helper.bio && helper.bio.toLowerCase().includes(query)) ||
          (helper.skills && helper.skills.some(skill => skill.toLowerCase().includes(query)))
      );
      setFilteredHelpers(filtered);
    } else {
      setFilteredHelpers(helpers);
    }
  }, [helpers, searchQuery]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by the useEffect above
  };
  
  return (
    <>
      <Helmet>
        <title>Browse Assignment Helpers - Assignment Kore Dibo</title>
      </Helmet>
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Browse Assignment Helpers</h1>
            <p className="mt-2 text-lg text-gray-600">
              Find qualified helpers to complete your assignments
            </p>
          </div>
          
          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, skills, or bio..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Button type="submit" className="sm:w-auto w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
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
              <h3 className="text-lg font-medium text-gray-900">Error loading helpers</h3>
              <p className="mt-2 text-gray-600">
                Please try again later.
              </p>
            </div>
          ) : filteredHelpers.length === 0 ? (
            <div className="text-center py-16">
              <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No helpers found</h3>
              <p className="mt-2 text-gray-600">
                No helpers match your search criteria. Try a different search term.
              </p>
              {searchQuery && (
                <Button className="mt-4" onClick={() => setSearchQuery("")}>Clear Search</Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHelpers.map(helper => (
                <HelperCard key={helper.id} helper={helper} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function HelperCard({ helper }) {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center mb-4">
          <Avatar className="h-16 w-16 mr-4">
            <AvatarImage src={helper.profileImage} alt={helper.fullName} />
            <AvatarFallback>{getInitials(helper.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {helper.fullName}
            </h3>
            <div className="flex items-center mt-1">
              <StarRating rating={helper.rating || 0} size="sm" />
              <span className="ml-2 text-sm text-gray-600">
                ({helper.reviewCount || 0} reviews)
              </span>
            </div>
          </div>
        </div>
        
        {helper.bio && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
            {helper.bio}
          </p>
        )}
        
        {helper.skills && helper.skills.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {helper.skills.slice(0, 4).map((skill, index) => (
              <Badge key={index} variant="secondary" className="bg-gray-100">
                {skill}
              </Badge>
            ))}
            {helper.skills.length > 4 && (
              <Badge variant="secondary" className="bg-gray-100">
                +{helper.skills.length - 4} more
              </Badge>
            )}
          </div>
        )}
        
        <div className="mt-auto pt-4 border-t border-gray-200">
          <Link href={`/helpers/${helper.id}`}>
            <Button className="w-full">View Profile</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function getInitials(name: string = '') {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
