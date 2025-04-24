import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { 
  FileText, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  DollarSign,
  Star
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/pages/dashboard/shared/navbar";
import Sidebar from "@/pages/dashboard/shared/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { StarRating } from "@/components/ui/star-rating";
import { formatDistanceToNow } from "date-fns";

export default function HelperDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  
  const { data: activeBids, isLoading: isLoadingBids } = useQuery({
    queryKey: ['/api/bids/helper', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/bids/helper/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch bids');
      return res.json();
    },
    enabled: !!user,
  });
  
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['/api/assignments/helper', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/assignments/helper/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch assignments');
      return res.json();
    },
    enabled: !!user,
  });
  
  // Calculate stats
  const completedAssignments = assignments?.filter(a => a.status === 'completed') || [];
  const activeAssignments = assignments?.filter(a => a.status === 'in-progress') || [];
  const pendingBids = activeBids?.filter(b => b.status === 'pending') || [];
  
  const totalEarnings = completedAssignments.reduce((total, assignment) => {
    // Find the accepted bid for this assignment
    const acceptedBid = activeBids?.find(bid => 
      bid.assignmentId === assignment.id && bid.status === 'accepted'
    );
    return total + (acceptedBid ? acceptedBid.amount : 0);
  }, 0);
  
  return (
    <>
      <Helmet>
        <title>Helper Dashboard - Assignment Kore Dibo</title>
      </Helmet>
      
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex flex-col flex-1">
          <Navbar />
          
          <main className="flex-1 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Helper Dashboard</h1>
                <p className="text-gray-600">Manage your assignments and track your earnings</p>
              </div>
              
              <Link href="/assignments">
                <Button className="mt-4 md:mt-0">
                  <Search className="mr-2 h-4 w-4" />
                  Find Assignments
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-blue-600">Active Bids</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-500 mr-3" />
                    <span className="text-3xl font-bold">{pendingBids.length}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-amber-600">Active Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-amber-500 mr-3" />
                    <span className="text-3xl font-bold">{activeAssignments.length}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-green-600">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                    <span className="text-3xl font-bold">{completedAssignments.length}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-violet-600">Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-violet-500 mr-3" />
                    <span className="text-3xl font-bold">৳{totalEarnings}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">My Assignments & Bids</h2>
                  <TabsList>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="bids">My Bids</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="active" className="mt-0">
                  {isLoadingAssignments ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : activeAssignments.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No active assignments</h3>
                      <p className="mt-2 text-gray-600">
                        You don't have any assignments in progress at the moment.
                      </p>
                      <Link href="/assignments">
                        <Button className="mt-4">
                          <Search className="mr-2 h-4 w-4" />
                          Find Assignments
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {activeAssignments.map(assignment => (
                        <Card key={assignment.id} className="overflow-hidden">
                          <div className="flex flex-col md:flex-row">
                            <div className="flex-1 p-6">
                              <div className="flex justify-between items-start">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  <Link href={`/assignments/${assignment.id}`}>
                                    {assignment.title}
                                  </Link>
                                </h3>
                                <StatusBadge status={assignment.status} />
                              </div>
                              
                              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
                              
                              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>Due {formatDistanceToNow(new Date(assignment.deadline), { addSuffix: true })}</span>
                                </div>
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 mr-1" />
                                  <span>Budget: ৳{assignment.budget}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-6 flex flex-col justify-center items-center md:w-48">
                              <Link href={`/assignments/${assignment.id}`}>
                                <Button variant="outline" className="w-full mb-2">View Details</Button>
                              </Link>
                              
                              <Link href={`/messages/${assignment.studentId}`}>
                                <Button variant="secondary" className="w-full">Message Student</Button>
                              </Link>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="bids" className="mt-0">
                  {isLoadingBids ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : pendingBids.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No active bids</h3>
                      <p className="mt-2 text-gray-600">
                        You haven't placed any bids on assignments yet.
                      </p>
                      <Link href="/assignments">
                        <Button className="mt-4">
                          <Search className="mr-2 h-4 w-4" />
                          Find Assignments
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {pendingBids.map(bid => (
                        <Card key={bid.id} className="overflow-hidden">
                          <div className="flex flex-col md:flex-row">
                            <div className="flex-1 p-6">
                              <div className="flex justify-between items-start">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  <Link href={`/assignments/${bid.assignment.id}`}>
                                    {bid.assignment.title}
                                  </Link>
                                </h3>
                                <BidStatusBadge status={bid.status} />
                              </div>
                              
                              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{bid.assignment.description}</p>
                              
                              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>Due {formatDistanceToNow(new Date(bid.assignment.deadline), { addSuffix: true })}</span>
                                </div>
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 mr-1" />
                                  <span>Budget: ৳{bid.assignment.budget}</span>
                                </div>
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  <span>Your Bid: ৳{bid.amount}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-6 flex flex-col justify-center items-center md:w-48">
                              <Link href={`/assignments/${bid.assignment.id}`}>
                                <Button variant="outline" className="w-full">View Assignment</Button>
                              </Link>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="mt-0">
                  {isLoadingAssignments ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : completedAssignments.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No completed assignments</h3>
                      <p className="mt-2 text-gray-600">
                        You haven't completed any assignments yet.
                      </p>
                      <Link href="/assignments">
                        <Button className="mt-4">
                          <Search className="mr-2 h-4 w-4" />
                          Find Assignments
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {completedAssignments.map(assignment => {
                        const acceptedBid = activeBids?.find(bid => 
                          bid.assignmentId === assignment.id && bid.status === 'accepted'
                        );
                        
                        return (
                          <Card key={assignment.id} className="overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                              <div className="flex-1 p-6">
                                <div className="flex justify-between items-start">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    <Link href={`/assignments/${assignment.id}`}>
                                      {assignment.title}
                                    </Link>
                                  </h3>
                                  <StatusBadge status={assignment.status} />
                                </div>
                                
                                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
                                
                                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>Completed {assignment.completedAt 
                                      ? formatDistanceToNow(new Date(assignment.completedAt), { addSuffix: true })
                                      : formatDistanceToNow(new Date(assignment.deadline), { addSuffix: true })
                                    }</span>
                                  </div>
                                  <div className="flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    <span>Earned: ৳{acceptedBid ? acceptedBid.amount : 'N/A'}</span>
                                  </div>
                                  {assignment.rating && (
                                    <div className="flex items-center">
                                      <Star className="h-4 w-4 mr-1 text-yellow-400" />
                                      <span>Rating: {assignment.rating}/5</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="bg-gray-50 p-6 flex flex-col justify-center items-center md:w-48">
                                <Link href={`/assignments/${assignment.id}`}>
                                  <Button variant="outline" className="w-full">View Details</Button>
                                </Link>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-6">
                <Star className="h-6 w-6 text-yellow-400 mr-2" />
                <h2 className="text-xl font-semibold">My Rating</h2>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-4xl font-bold text-gray-900">{user?.rating || 0}</span>
                  <div className="mt-2">
                    <StarRating rating={user?.rating || 0} size="lg" />
                  </div>
                  <span className="mt-2 text-sm text-gray-500">{user?.reviewCount || 0} reviews</span>
                </div>
                
                <div className="flex-1">
                  <p className="text-gray-600">
                    Your rating is displayed to potential clients when they view your profile or your bids on assignments. 
                    A higher rating increases your chances of getting your bids accepted.
                  </p>
                  
                  <div className="mt-4">
                    <Link href="/reviews">
                      <Button variant="outline">
                        View All Reviews
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status }) {
  let color = "";
  let text = "";
  
  switch (status) {
    case "open":
      color = "bg-blue-100 text-blue-800";
      text = "Open";
      break;
    case "in-progress":
      color = "bg-amber-100 text-amber-800";
      text = "In Progress";
      break;
    case "completed":
      color = "bg-green-100 text-green-800";
      text = "Completed";
      break;
    default:
      color = "bg-gray-100 text-gray-800";
      text = status;
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {text}
    </span>
  );
}

function BidStatusBadge({ status }) {
  let color = "";
  let text = "";
  
  switch (status) {
    case "pending":
      color = "bg-blue-100 text-blue-800";
      text = "Pending";
      break;
    case "accepted":
      color = "bg-green-100 text-green-800";
      text = "Accepted";
      break;
    case "rejected":
      color = "bg-red-100 text-red-800";
      text = "Rejected";
      break;
    default:
      color = "bg-gray-100 text-gray-800";
      text = status;
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {text}
    </span>
  );
}
