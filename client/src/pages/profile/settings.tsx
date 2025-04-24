import { useState } from "react";
import { Helmet } from "react-helmet";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form schema
const profileFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  bio: z.string().optional(),
  skills: z.string().optional(),
  profileImage: z.string().url("Please enter a valid URL").optional(),
});

export default function Settings() {
  const { user, updateProfileMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Set up the form
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      bio: user?.bio || "",
      skills: user?.skills ? user.skills.join(", ") : "",
      profileImage: user?.profileImage || "",
    },
  });
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof profileFormSchema>) => {
    // Process skills from comma-separated string to array
    const skills = values.skills
      ? values.skills.split(",").map(skill => skill.trim()).filter(Boolean)
      : undefined;
    
    updateProfileMutation.mutate({
      fullName: values.fullName,
      bio: values.bio,
      skills,
      profileImage: values.profileImage,
    });
  };
  
  return (
    <>
      <Helmet>
        <title>Settings - Assignment Kore Dibo</title>
      </Helmet>
      
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex flex-col flex-1">
          <Navbar />
          
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-gray-600">Manage your account preferences and profile</p>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>
                
                {/* Profile Settings */}
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal information and how others see you
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          <div className="flex flex-col md:flex-row md:items-start gap-6">
                            <div className="flex flex-col items-center">
                              <Avatar className="h-24 w-24">
                                <AvatarImage src={form.watch("profileImage") || user?.profileImage} />
                                <AvatarFallback>{getInitials(user?.fullName)}</AvatarFallback>
                              </Avatar>
                            </div>
                            
                            <div className="flex-1 space-y-6">
                              <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      This is your public display name.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="profileImage"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Profile Image URL</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="https://example.com/image.jpg" />
                                    </FormControl>
                                    <FormDescription>
                                      Enter a URL for your profile picture.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Bio</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        {...field}
                                        placeholder="Tell others about yourself..."
                                        rows={4}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      A brief description of yourself that will be visible on your profile.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              {user?.userType === 'helper' && (
                                <FormField
                                  control={form.control}
                                  name="skills"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Skills</FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          placeholder="Essay Writing, Mathematics, Programming, etc. (comma-separated)" 
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Enter your skills as a comma-separated list.
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                              
                              <div className="pt-4">
                                <Button 
                                  type="submit" 
                                  disabled={updateProfileMutation.isPending}
                                >
                                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Account Settings */}
                <TabsContent value="account">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                      <CardDescription>
                        Manage your account settings and preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Email Address</h3>
                          <p className="mt-1 text-sm text-gray-600">
                            {user?.email}
                          </p>
                          <p className="mt-2 text-sm text-gray-500">
                            Your email is used for login and notifications. Email cannot be changed at this time.
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Account Type</h3>
                          <p className="mt-1 text-sm text-gray-600">
                            {user?.userType === 'student' ? 'Student' : 'Assignment Helper'}
                          </p>
                          <p className="mt-2 text-sm text-gray-500">
                            Your account type determines what you can do on the platform. Account type cannot be changed at this time.
                          </p>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-200">
                          <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
                          <p className="mt-1 text-sm text-gray-600">
                            Permanently delete your account and all data.
                          </p>
                          <Button className="mt-4" variant="destructive">
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Notification Settings */}
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Settings</CardTitle>
                      <CardDescription>
                        Manage how and when you receive notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Email notification settings will be available in a future update.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
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
