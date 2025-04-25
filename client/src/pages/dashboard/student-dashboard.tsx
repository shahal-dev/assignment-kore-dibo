import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { 
  FileText, 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2
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

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['/api/assignments/student', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/assignments/student/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch assignments');
      return res.json();
    },
    enabled: !!user,
  });
  
  // Filter assignments based on active tab
  const filteredAssignments = assignments ? assignments.filter(assignment => {
    if (activeTab === 'all') return true;
    if (activeTab === 'open') return assignment.status === 'open';
    if (activeTab === 'in-progress') return assignment.status === 'in-progress';
    if (activeTab === 'completed') return assignment.status === 'completed';
    return true;
  }) : [];

  return (
    <>
      <Helmet>
        <title>Student Dashboard - Assignment Kore Dibo</title>
      </Helmet>
      
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex flex-col flex-1">
          <Navbar />
          
          <main className="flex-1 p-6 ml-0 md:ml-64">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
                <p className="text-gray-600">Manage your assignments and track their progress</p>
              </div>
              
              <Link href="/assignments/create">
                <Button className="mt-4 md:mt-0">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Post New Assignment
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-blue-600">Open Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-500 mr-3" />
                    <span className="text-3xl font-bold">
                      {assignments ? assignments.filter(a => a.status === 'open').length : 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-amber-600">In Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-amber-500 mr-3" />
                    <span className="text-3xl font-bold">
                      {assignments ? assignments.filter(a => a.status === 'in-progress').length : 0}
                    </span>
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
                    <span className="text-3xl font-bold">
                      {assignments ? assignments.filter(a => a.status === 'completed').length : 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">My Assignments</h2>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="open">Open</TabsTrigger>
                    <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="all" className="mt-0">
                  {renderAssignmentsList(filteredAssignments, isLoading)}
                </TabsContent>
                
                <TabsContent value="open" className="mt-0">
                  {renderAssignmentsList(filteredAssignments, isLoading)}
                </TabsContent>
                
                <TabsContent value="in-progress" className="mt-0">
                  {renderAssignmentsList(filteredAssignments, isLoading)}
                </TabsContent>
                
                <TabsContent value="completed" className="mt-0">
                  {renderAssignmentsList(filteredAssignments, isLoading)}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

function renderAssignmentsList(assignments, isLoading) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No assignments found</h3>
        <p className="mt-2 text-gray-600">
          You haven't posted any assignments in this category yet.
        </p>
        <Link href="/assignments/create">
          <Button className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" />
            Post New Assignment
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {assignments.map(assignment => (
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
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  <span>{assignment.bidCount || 0} bids</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 flex flex-col justify-center items-center md:w-48">
              <Link href={`/assignments/${assignment.id}`}>
                <Button variant="outline" className="w-full mb-2">View Details</Button>
              </Link>
              
              {assignment.status === 'open' && (
                <Link href={`/assignments/${assignment.id}`}>
                  <Button variant="secondary" className="w-full">View Bids</Button>
                </Link>
              )}
              
              {assignment.status === 'in-progress' && (
                <Link href={`/messages/${assignment.helperId}`}>
                  <Button variant="secondary" className="w-full">Message Helper</Button>
                </Link>
              )}
              
              {assignment.status === 'completed' && !assignment.reviewed && (
                <Link href={`/assignments/${assignment.id}?review=true`}>
                  <Button variant="secondary" className="w-full">Leave Review</Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
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
