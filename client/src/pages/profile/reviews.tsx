import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Star, Loader2, AlertCircle, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/pages/dashboard/shared/navbar";
import Sidebar from "@/pages/dashboard/shared/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function Reviews() {
  const { user } = useAuth();
  
  // Get reviews for the current user
  const { 
    data: reviews, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/reviews/helper', user?.id],
    queryFn: async () => {
      if (!user || user.userType !== 'helper') return [];
      const res = await fetch(`/api/reviews/helper/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    },
    enabled: !!user && user.userType === 'helper',
  });
  
  return (
    <>
      <Helmet>
        <title>My Reviews - Assignment Kore Dibo</title>
      </Helmet>
      
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex flex-col flex-1">
          <Navbar />
          
          <main className="flex-1 p-6 ml-0 md:ml-64">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
              <p className="text-gray-600">Reviews and feedback from students</p>
            </div>
            
            {user?.userType === 'student' ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-gray-900 mb-2">Reviews are for helpers</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  This section is for assignment helpers to view reviews from students. 
                  As a student, you can leave reviews for helpers who have completed your assignments.
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-gray-900 mb-2">Couldn't load reviews</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  There was an error loading your reviews. Please try again later.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Reviews Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Reviews Summary</CardTitle>
                    <CardDescription>
                      Overview of your feedback from students
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="flex flex-col items-center">
                        <div className="text-5xl font-bold text-gray-900">{user?.rating || 0}</div>
                        <div className="mt-2">
                          <StarRating rating={user?.rating || 0} size="lg" />
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          Based on {user?.reviewCount || 0} reviews
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div>
                          <div className="flex items-center">
                            <div className="w-16 text-sm text-gray-600">5 stars</div>
                            <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                              <div 
                                className="h-full bg-yellow-400" 
                                style={{ 
                                  width: `${calculatePercentage(reviews, 5)}%` 
                                }}
                              ></div>
                            </div>
                            <div className="w-10 text-right text-sm text-gray-600">
                              {calculateCount(reviews, 5)}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center">
                            <div className="w-16 text-sm text-gray-600">4 stars</div>
                            <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                              <div 
                                className="h-full bg-yellow-400" 
                                style={{ 
                                  width: `${calculatePercentage(reviews, 4)}%` 
                                }}
                              ></div>
                            </div>
                            <div className="w-10 text-right text-sm text-gray-600">
                              {calculateCount(reviews, 4)}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center">
                            <div className="w-16 text-sm text-gray-600">3 stars</div>
                            <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                              <div 
                                className="h-full bg-yellow-400" 
                                style={{ 
                                  width: `${calculatePercentage(reviews, 3)}%` 
                                }}
                              ></div>
                            </div>
                            <div className="w-10 text-right text-sm text-gray-600">
                              {calculateCount(reviews, 3)}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center">
                            <div className="w-16 text-sm text-gray-600">2 stars</div>
                            <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                              <div 
                                className="h-full bg-yellow-400" 
                                style={{ 
                                  width: `${calculatePercentage(reviews, 2)}%` 
                                }}
                              ></div>
                            </div>
                            <div className="w-10 text-right text-sm text-gray-600">
                              {calculateCount(reviews, 2)}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center">
                            <div className="w-16 text-sm text-gray-600">1 star</div>
                            <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                              <div 
                                className="h-full bg-yellow-400" 
                                style={{ 
                                  width: `${calculatePercentage(reviews, 1)}%` 
                                }}
                              ></div>
                            </div>
                            <div className="w-10 text-right text-sm text-gray-600">
                              {calculateCount(reviews, 1)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Reviews List */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Reviews</CardTitle>
                    <CardDescription>
                      Detailed feedback from students
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!reviews || reviews.length === 0 ? (
                      <div className="text-center py-8">
                        <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No Reviews Yet</h3>
                        <p className="mt-2 text-gray-600">
                          You haven't received any reviews yet. Complete assignments to get feedback.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                            <div className="flex items-start">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage src={review.student?.profileImage} alt={review.student?.fullName} />
                                <AvatarFallback>{getInitials(review.student?.fullName)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
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
                                    <Link href={`/assignments/${review.assignment.id}`}>
                                      <Badge className="mt-2 sm:mt-0 cursor-pointer hover:bg-gray-100">
                                        {review.assignment.title}
                                      </Badge>
                                    </Link>
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
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

function calculateCount(reviews, rating) {
  if (!reviews) return 0;
  return reviews.filter(review => review.rating === rating).length;
}

function calculatePercentage(reviews, rating) {
  if (!reviews || reviews.length === 0) return 0;
  return (calculateCount(reviews, rating) / reviews.length) * 100;
}

function getInitials(name: string = '') {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
