import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilePlus, Calendar, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/pages/dashboard/shared/navbar";
import Sidebar from "@/pages/dashboard/shared/sidebar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Form schema
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(30, "Description must be at least 30 characters."),
  budget: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Budget must be a positive number.",
  }),
  deadline: z.string().refine(val => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date > new Date();
  }, {
    message: "Deadline must be in the future.",
  }),
  category: z.string().min(1, "Please select a category."),
});

const categories = [
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

export default function CreateAssignment() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Redirect if not a student
  if (user && user.userType !== 'student') {
    navigate('/dashboard/helper');
    return null;
  }
  
  // Set up the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: "",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // Default 7 days from now
      category: "",
    },
  });
  
  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      return apiRequest("POST", "/api/assignments", {
        title: values.title,
        description: values.description,
        budget: Number(values.budget),
        deadline: new Date(values.deadline).toISOString(),
        category: values.category,
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      toast({
        title: "Assignment Created",
        description: "Your assignment has been posted successfully.",
      });
      navigate(`/assignments/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to create assignment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createAssignmentMutation.mutate(values);
  };

  return (
    <>
      <Helmet>
        <title>Post a New Assignment - Assignment Kore Dibo</title>
      </Helmet>
      
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex flex-col flex-1">
          <Navbar />
          
          <main className="flex-1 p-6">
            <div className="max-w-3xl mx-auto">
              <div className="mb-8">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard/student')}
                  className="mb-4"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
                
                <h1 className="text-2xl font-bold text-gray-900">Post a New Assignment</h1>
                <p className="text-gray-600 mt-1">Fill in the details to have your assignment completed by qualified helpers.</p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Details</CardTitle>
                  <CardDescription>
                    Provide clear and detailed information to get accurate bids.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assignment Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 10-Page Research Paper on Climate Change" {...field} />
                            </FormControl>
                            <FormDescription>
                              A clear title helps helpers understand your assignment.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose the category that best matches your assignment.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Provide detailed instructions for your assignment..." 
                                rows={8}
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Detailed instructions will help you get more accurate bids.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="budget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget (BDT)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5">৳</span>
                                  <Input type="number" min="0" placeholder="1000" className="pl-8" {...field} />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Set your budget for this assignment.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="deadline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Deadline</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                  <Input type="date" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormDescription>
                                When do you need this completed?
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="pt-4">
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={createAssignmentMutation.isPending}
                        >
                          {createAssignmentMutation.isPending ? (
                            'Creating Assignment...'
                          ) : (
                            <>
                              <FilePlus className="mr-2 h-4 w-4" />
                              Post Assignment
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
