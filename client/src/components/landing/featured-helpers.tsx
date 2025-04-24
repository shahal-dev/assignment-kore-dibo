import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";

export default function FeaturedHelpers() {
  const { 
    data: helpers, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/helpers/top'],
    queryFn: async () => {
      const res = await fetch('/api/helpers/top');
      if (!res.ok) throw new Error('Failed to fetch top helpers');
      return res.json();
    }
  });
  
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Featured Assignment Helpers</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Our top-rated experts ready to help with your assignments
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">Failed to load helpers. Please try again later.</p>
            </div>
          ) : helpers?.length > 0 ? (
            helpers.map((helper) => (
              <div key={helper.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center">
                    <Avatar className="w-12 h-12 rounded-full object-cover mr-4">
                      <AvatarImage src={helper.profileImage} alt={helper.fullName} />
                      <AvatarFallback>{getInitials(helper.fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{helper.fullName}</h3>
                      <p className="text-sm text-gray-600">{getHelperTitle(helper)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center">
                    <StarRating rating={helper.rating || 0} />
                    <span className="ml-2 text-sm text-gray-600">
                      {helper.rating?.toFixed(1) || '0.0'} ({helper.reviewCount || 0} reviews)
                    </span>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-1">
                    {helper.skills?.slice(0, 2).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  
                  <p className="mt-4 text-sm text-gray-600 line-clamp-3">
                    {helper.bio || `Specialized in helping students with their academic assignments. ${helper.reviewCount || 0} successful projects.`}
                  </p>
                  
                  <div className="mt-6">
                    <Link href={`/helpers/${helper.id}`}>
                      <Button className="w-full">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No helpers found. Check back soon!</p>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <Link href="/helpers">
            <Button variant="outline">
              View All Helpers
            </Button>
          </Link>
        </div>
      </div>
    </section>
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

function getHelperTitle(helper) {
  if (helper.skills && helper.skills.length > 0) {
    const mainSkill = helper.skills[0];
    if (mainSkill.toLowerCase().includes('math')) return 'Math Tutor';
    if (mainSkill.toLowerCase().includes('program')) return 'Programming Expert';
    if (mainSkill.toLowerCase().includes('essay') || mainSkill.toLowerCase().includes('writing')) return 'Academic Writer';
    if (mainSkill.toLowerCase().includes('science')) return 'Science Specialist';
    return `${mainSkill} Specialist`;
  }
  return 'Academic Helper';
}
