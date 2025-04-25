import { useState } from "react";
import { z } from "zod";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, User, Mail, BookOpen, Briefcase } from "lucide-react";
import { useAuth, registerSchema } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      userType: "student",
    },
  });

  // Redirect if already logged in
  if (user) {
    if (user.userType === 'student') {
      navigate('/dashboard/student');
    } else {
      navigate('/dashboard/helper');
    }
    return null;
  }

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: (user) => {
        if (user.userType === 'student') {
          navigate('/dashboard/student');
        } else {
          navigate('/dashboard/helper');
        }
      },
    });
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  // Handle registration success
  if (registerMutation.isSuccess) {
    navigate('/verify');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Sign In or Register - Assignment Kore Dibo</title>
        <meta name="description" content="Sign in to your account or register to get started with Assignment Kore Dibo" />
      </Helmet>
      
      <div className="flex min-h-screen bg-gray-50">
        {/* Left Column: Auth Form */}
        <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="w-full max-w-sm mx-auto lg:w-96">
            <div className="mb-6">
              <a href="/" className="text-primary-600 text-2xl font-bold">
                Assignment Kore Dibo
              </a>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                {activeTab === "login" ? "Sign in to your account" : "Create a new account"}
              </h2>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Card>
                  <CardContent className="pt-6">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                  <Input
                                    placeholder="Enter your username"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <LockKeyhole className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                  <Input
                                    type="password"
                                    placeholder="Enter your password"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Signing in..." : "Sign In"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-2">
                    <div className="text-sm text-center text-gray-500">
                      Don't have an account?{" "}
                      <button
                        onClick={() => setActiveTab("register")}
                        className="font-medium text-primary-600 hover:text-primary-500"
                      >
                        Register
                      </button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="register">
                <Card>
                  <CardContent className="pt-6">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                  <Input
                                    placeholder="Enter your full name"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                  <Input
                                    placeholder="Choose a username"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                  <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="userType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>I want to register as</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select account type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="student">
                                    <div className="flex items-center">
                                      <BookOpen className="w-4 h-4 mr-2" />
                                      <span>Student</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="helper">
                                    <div className="flex items-center">
                                      <Briefcase className="w-4 h-4 mr-2" />
                                      <span>Assignment Helper</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <LockKeyhole className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                  <Input
                                    type="password"
                                    placeholder="Create a password"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <LockKeyhole className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                  <Input
                                    type="password"
                                    placeholder="Confirm your password"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-2">
                    <div className="text-sm text-center text-gray-500">
                      Already have an account?{" "}
                      <button
                        onClick={() => setActiveTab("login")}
                        className="font-medium text-primary-600 hover:text-primary-500"
                      >
                        Sign in
                      </button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Right Column: Hero */}
        <div className="relative flex-1 hidden w-0 lg:block">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600">
            <div className="flex flex-col justify-center h-full p-12 text-white">
              <h2 className="text-4xl font-bold">
                Assignment Kore Dibo
              </h2>
              <p className="mt-2 text-xl">
                Bangladesh's premier platform for assignment help
              </p>
              <div className="mt-8 space-y-6">
                <div className="flex items-center">
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-primary-500">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">For Students</h3>
                    <p className="mt-1 text-base opacity-80">
                      Get quality help with your assignments from verified experts
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-primary-500">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">For Helpers</h3>
                    <p className="mt-1 text-base opacity-80">
                      Use your skills to help students and earn income on your own schedule
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
