import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useParams, useLocation, Link } from "wouter";
import { 
  User, 
  Award, 
  Briefcase, 
  MessageSquare, 
  Star,
  Clock,
  Loader2,
  AlertCircle,
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/landing/navbar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow } from "date-fns";

export default function HelperDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Fetch helper profile
  const {
    data: helper,
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/helpers', id],
    queryFn: async () => {
      const res = await fetch(`/api/helpers/${id}`);
      if (!res.ok) throw new Error('Failed to fetch helper profile');
      return res.json();
    },
    enabled: !!id,
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !helper) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Helper Not Found</h1>
        <p className="text-gray-600 mb-6">The helper profile you're looking for doesn't exist or has been removed.</p>
        <Link href="/helpers">
          <Button>Browse Helpers</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{helper.fullName} - Helper Profile - Assignment Kore Dibo</title>
      </Helmet>
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sidebar with Profile Info */}
            <div className="md:col-span-1">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={helper.profileImage} alt={helper.fullName} />
                      <AvatarFallback>{getInitials(helper.fullName)}</AvatarFallback>
                    </Avatar>
                    
                    <h1 className="text-xl font-bold text-gray-900">{helper.fullName}</h1>
                    
                    <div className="flex items-center mt-2">
                      <StarRating rating={helper.rating || 0} />
                      <span className="ml-2 text-sm text-gray-600">
                        ({helper.reviewCount || 0} reviews)
                      </span>
                    </div>
                    
                    <div className="mt-4 w-full">
                      {user && user.id !== helper.id && (
                        <Button 
                          className="w-full"
                          onClick={() => navigate(`/messages/${helper.id}`)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Message
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-2">About</h3>
                    <p className="text-gray-600 text-sm">
                      {helper.bio || "No bio available."}
                    </p>
                  </div>
                  
                  {helper.skills && helper.skills.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {helper.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="bg-gray-100">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-2">Member Since</h3>
                    <p className="text-gray-600 text-sm flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {helper.createdAt 
                        ? format(new Date(helper.createdAt), 'MMMM yyyy')
                        : "Not available"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-2">
              <Tabs defaultValue="reviews">
                <TabsList className="mb-6">
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="assignments">Completed Assignments</TabsTrigger>
                </TabsList>
                
                <TabsContent value="reviews">
                  <Card>
                    <CardHeader>
                      <CardTitle>Reviews ({helper.reviews?.length || 0})</CardTitle>
                      <CardDescription>
                        Feedback from students who have worked with {helper.fullName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!helper.reviews || helper.reviews.length === 0 ? (
                        <div className="text-center py-8">
                          <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900">No Reviews Yet</h3>
                          <p className="mt-2 text-gray-600">
                            This helper hasn't received any reviews yet.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {helper.reviews.map((review) => (
                            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                              <div className="flex items-start">
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarImage src={review.student?.profileImage} alt={review.student?.fullName} />
                                  <AvatarFallback>{getInitials(review.student?.fullName)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <h4 className="font-medium text-gray-900">{review.student?.fullName}</h4>
                                      <div className="flex items-center mt-1">
                                        <StarRating rating={review.rating} size="sm" />
                                        <span className="ml-2 text-sm text-gray-500">
                                          {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                        </span>
                                      </div>
                                    </div>
                                    {review.assignment && (
                                      <Badge variant="outline" className="mt-2 sm:mt-0">
                                        {review.assignment.title}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="mt-2 text-gray-600">
                                    {review.comment || "No comment provided."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="assignments">
                  <Card>
                    <CardHeader>
                      <CardTitle>Completed Assignments</CardTitle>
                      <CardDescription>
                        Assignments successfully completed by {helper.fullName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!helper.completedAssignments || helper.completedAssignments.length === 0 ? (
                        <div className="text-center py-8">
                          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900">No Completed Assignments</h3>
                          <p className="mt-2 text-gray-600">
                            This helper hasn't completed any assignments yet.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {helper.completedAssignments.map((assignment) => (
                            <Card key={assignment.id}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <Link href={`/assignments/${assignment.id}`}>
                                      <h4 className="font-medium text-gray-900 hover:text-primary-600">
                                        {assignment.title}
                                      </h4>
                                    </Link>
                                    <div className="flex items-center mt-1 text-sm text-gray-500">
                                      <Clock className="h-4 w-4 mr-1" />
                                      Completed {formatDistanceToNow(new Date(assignment.completedAt || assignment.updatedAt), { addSuffix: true })}
                                    </div>
                                  </div>
                                  <Badge>
                                    {assignment.category}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </>
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
