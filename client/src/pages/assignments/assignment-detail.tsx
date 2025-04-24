import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useParams, useLocation, Link } from "wouter";
import { 
  Clock, 
  FileText, 
  Tag, 
  User, 
  MessageSquare,
  CheckCircle, 
  XCircle,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/landing/navbar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";

export default function AssignmentDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bidAmount, setBidAmount] = useState("");
  const [bidDescription, setBidDescription] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch assignment details
  const { 
    data: assignment, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/assignments', id],
    queryFn: async () => {
      const res = await fetch(`/api/assignments/${id}`);
      if (!res.ok) throw new Error('Failed to fetch assignment');
      return res.json();
    },
    enabled: !!id,
  });

  // Fetch bids if user is authorized
  const { 
    data: bids,
    isLoading: isLoadingBids
  } = useQuery({
    queryKey: ['/api/bids/assignment', id],
    queryFn: async () => {
      const res = await fetch(`/api/bids/assignment/${id}`);
      if (!res.ok) throw new Error('Failed to fetch bids');
      return res.json();
    },
    enabled: !!id && !!user && (user.userType === 'student' || user.userType === 'helper'),
  });

  // Place bid mutation
  const placeBidMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/bids", {
        assignmentId: Number(id),
        amount: Number(bidAmount),
        description: bidDescription
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bids/assignment', id] });
      setIsPlacingBid(false);
      setBidAmount("");
      setBidDescription("");
      toast({
        title: "Bid placed successfully",
        description: "Your bid has been submitted to the student.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to place bid",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Accept bid mutation
  const acceptBidMutation = useMutation({
    mutationFn: async (bidId: number) => {
      return apiRequest("PATCH", `/api/bids/${bidId}`, {
        status: "accepted"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bids/assignment', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments', id] });
      toast({
        title: "Bid accepted",
        description: "The helper has been assigned to this assignment.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to accept bid",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/reviews", {
        assignmentId: Number(id),
        helperId: assignment.helper.id,
        rating,
        comment: reviewComment
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments', id] });
      setIsSubmittingReview(false);
      setRating(5);
      setReviewComment("");
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit review",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const handlePlaceBid = (e) => {
    e.preventDefault();
    placeBidMutation.mutate();
  };

  const handleAcceptBid = (bidId) => {
    acceptBidMutation.mutate(bidId);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    submitReviewMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <XCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Assignment Not Found</h1>
        <p className="text-gray-600 mb-6">The assignment you're looking for doesn't exist or has been removed.</p>
        <Link href="/assignments">
          <Button>Browse Assignments</Button>
        </Link>
      </div>
    );
  }

  // Check if current user can bid
  const canBid = user && user.userType === 'helper' && assignment.isOpen && 
                 assignment.studentId !== user.id &&
                 (!bids || !bids.some(bid => bid.helper.id === user.id));

  // Check if current user is the assignment owner
  const isOwner = user && user.userType === 'student' && assignment.studentId === user.id;

  // Check if current user is the assigned helper
  const isAssignedHelper = user && user.userType === 'helper' && 
                          assignment.helperId === user.id;

  // Check if the assignment is completed and needs a review
  const needsReview = isOwner && assignment.status === 'completed' && 
                     !assignment.reviewed;

  return (
    <>
      <Helmet>
        <title>{assignment.title} - Assignment Kore Dibo</title>
      </Helmet>
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Assignment header */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
                <div className="flex items-center mt-2">
                  <Badge variant={
                    assignment.status === 'open' ? "default" : 
                    assignment.status === 'in-progress' ? "secondary" : 
                    "success"
                  }>
                    {assignment.status === 'open' ? 'Open' : 
                     assignment.status === 'in-progress' ? 'In Progress' : 
                     'Completed'}
                  </Badge>
                  <span className="text-sm text-gray-500 ml-4">
                    Posted {formatDistanceToNow(new Date(assignment.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {canBid && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Place a Bid</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Place Your Bid</DialogTitle>
                        <DialogDescription>
                          Provide your price and how you'll approach this assignment.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={handlePlaceBid}>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="bid-amount">Your Bid (BDT)</Label>
                            <Input
                              id="bid-amount"
                              type="number"
                              placeholder="e.g. 1000"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="bid-description">How will you approach this task?</Label>
                            <Textarea
                              id="bid-description"
                              placeholder="Describe how you'll complete this assignment, your expertise, and why the student should choose you..."
                              rows={5}
                              value={bidDescription}
                              onChange={(e) => setBidDescription(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button 
                            type="submit" 
                            disabled={placeBidMutation.isPending}
                          >
                            {placeBidMutation.isPending ? 'Submitting...' : 'Submit Bid'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
                
                {isOwner && assignment.status === 'in-progress' && (
                  <Button variant="outline" onClick={() => navigate(`/messages/${assignment.helperId}`)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message Helper
                  </Button>
                )}
                
                {isAssignedHelper && (
                  <Button variant="outline" onClick={() => navigate(`/messages/${assignment.studentId}`)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message Student
                  </Button>
                )}
                
                {needsReview && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary">Leave a Review</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rate the Helper</DialogTitle>
                        <DialogDescription>
                          Please rate your experience with the helper for this assignment.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={handleSubmitReview}>
                        <div className="grid gap-4 py-4">
                          <div className="flex flex-col items-center">
                            <Label className="mb-2">Rating</Label>
                            <StarRating
                              rating={rating}
                              size="lg"
                              readOnly={false}
                              onRatingChange={setRating}
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="review-comment">Comments (Optional)</Label>
                            <Textarea
                              id="review-comment"
                              placeholder="Share your experience with this helper..."
                              rows={4}
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button 
                            type="submit" 
                            disabled={submitReviewMutation.isPending}
                          >
                            {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium">{format(new Date(assignment.deadline), 'PPP')}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Tag className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="font-medium">৳{assignment.budget}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{assignment.category}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Assignment details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p>{assignment.description}</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Bids section - only show to assignment owner or if user has placed a bid */}
              {(isOwner || user?.userType === 'helper') && assignment.status === 'open' && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Bids ({assignment.bidCount || 0})</CardTitle>
                    {!isOwner && (
                      <CardDescription>
                        These are all the helpers who have placed bids on this assignment.
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isLoadingBids ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : bids && bids.length > 0 ? (
                      <div className="space-y-6">
                        {bids.map((bid) => (
                          <div key={bid.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarImage src={bid.helper.profileImage} alt={bid.helper.fullName} />
                                  <AvatarFallback>{getInitials(bid.helper.fullName)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <Link href={`/helpers/${bid.helper.id}`}>
                                    <h3 className="font-medium text-gray-900 hover:text-primary-600">
                                      {bid.helper.fullName}
                                    </h3>
                                  </Link>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <StarRating rating={bid.helper.rating || 0} size="sm" />
                                    <span className="ml-1">({bid.helper.reviewCount || 0} reviews)</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-lg">৳{bid.amount}</p>
                                <p className="text-sm text-gray-500">
                                  {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <p className="text-gray-700">{bid.description}</p>
                            </div>
                            
                            {isOwner && (
                              <div className="mt-4 flex justify-end">
                                <Button
                                  onClick={() => handleAcceptBid(bid.id)}
                                  disabled={acceptBidMutation.isPending}
                                >
                                  {acceptBidMutation.isPending ? 'Accepting...' : 'Accept Bid'}
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No bids yet.</p>
                        {canBid && (
                          <Button onClick={() => setIsPlacingBid(true)} className="mt-4">
                            Be the first to bid
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Sidebar */}
            <div>
              {/* Student info */}
              <Card>
                <CardHeader>
                  <CardTitle>About the Student</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarImage src={assignment.student?.profileImage} alt={assignment.student?.fullName} />
                      <AvatarFallback>{getInitials(assignment.student?.fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {assignment.student?.fullName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Student
                      </p>
                    </div>
                  </div>
                  
                  {!isOwner && user && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => navigate(`/messages/${assignment.student.id}`)}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message Student
                    </Button>
                  )}
                </CardContent>
              </Card>
              
              {/* Assigned helper info (if assigned) */}
              {assignment.helper && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Assigned Helper</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={assignment.helper?.profileImage} alt={assignment.helper?.fullName} />
                        <AvatarFallback>{getInitials(assignment.helper?.fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {assignment.helper?.fullName}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <StarRating rating={assignment.helper?.rating || 0} size="sm" />
                          <span className="ml-1">({assignment.helper?.reviewCount || 0} reviews)</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => navigate(`/helpers/${assignment.helper.id}`)}
                    >
                      View Profile
                    </Button>
                    
                    {isOwner && (
                      <Button 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => navigate(`/messages/${assignment.helper.id}`)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message Helper
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
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
