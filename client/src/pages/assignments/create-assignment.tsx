import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilePlus, Calendar, ArrowLeft, Upload } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { z } from "zod";
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
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("assignment");
  const [question, setQuestion] = useState("");

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
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/assignments", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to create assignment");
      return res;
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
  
  // Create doubt mutation
  const createDoubtMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/doubts', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Failed to post doubt');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Doubt posted!' });
      navigate('/dashboard/student');
    },
    onError: (err: any) => {
      toast({ title: 'Error posting doubt', description: err.message, variant: 'destructive' });
    }
  });

  // Form submission handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, val]) => formData.append(key, String(val)));
    photos.forEach(photo => formData.append('photos', photo));
    createAssignmentMutation.mutate(formData);
  };

  const onDoubtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('question', question);
    photos.forEach(f => fd.append('photos', f));
    createDoubtMutation.mutate(fd);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos(files);
    setPreviews(files.map(x=>URL.createObjectURL(x)));
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
          
          <main className="flex-1 p-6 ml-0 md:ml-64">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="assignment">Post Assignment</TabsTrigger>
                <TabsTrigger value="doubt">Ask Doubt</TabsTrigger>
              </TabsList>
              <TabsContent value="assignment" className="mt-4">
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
                                <FormControl>
                                  <Select onValueChange={field.onChange} value={field.value}>
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
                                </FormControl>
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
                          
                          <div className="mt-6">
                            {/* hidden file input & icon trigger */}
                            <input type="file" ref={fileInputRef} multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                            <div className="flex items-center gap-2">
                              <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="h-5 w-5" />
                              </Button>
                              <span>Attach Photos</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              {previews.map((src,i) => (
                                <img key={i} src={src} className="h-20 w-20 object-cover rounded" />
                              ))}
                            </div>
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
              </TabsContent>
              <TabsContent value="doubt" className="mt-4">
                <Card>
                  <CardHeader><CardTitle>Ask a Doubt</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={onDoubtSubmit} className="space-y-4">
                      <Textarea placeholder="Type your doubt..." value={question} onChange={e=>setQuestion(e.target.value)} required className="w-full p-4 border rounded" />
                      <input type="file" ref={fileInputRef} style={{display:'none'}} multiple accept="image/*" onChange={handleFileChange} />
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" size="icon" onClick={()=>fileInputRef.current?.click()}><Upload className="h-5 w-5"/></Button>
                        <span>Attach Photos</span>
                      </div>
                      <div className="flex gap-2 mt-2">{previews.map((src,i)=><img key={i} src={src} className="h-20 w-20 object-cover rounded" />)}</div>
                      <Button type="submit" className="bg-blue-500 text-white">{createDoubtMutation.isPending ? 'Posting...' : 'Post Doubt'}</Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </>
  );
}
