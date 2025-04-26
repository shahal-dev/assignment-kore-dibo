import { useState } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type VerifyData = {
  email: string;
  code: string;
};

const verifySchema = z.object({
  code: z.string().min(6, "Verification code must be 6 characters").max(6, "Verification code must be 6 characters"),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function VerifyPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, pendingVerificationEmail, setPendingVerificationEmail } = useAuth();

  // Redirect if no pending verification
  if (!pendingVerificationEmail) {
    navigate('/auth');
    return null;
  }

  const form = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: VerifyData) => {
      const res = await apiRequest("POST", "/api/verify", data);
      return await res.json();
    },
    onSuccess: (user) => {
      setPendingVerificationEmail(null);
      toast({
        title: "Email verified",
        description: "Your account has been verified successfully.",
      });
      if (user.userType === 'student') {
        navigate('/dashboard/student');
      } else {
        navigate('/dashboard/helper');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
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

  const onSubmit = (data: VerifyFormData) => {
    verifyMutation.mutate({
      email: pendingVerificationEmail,
      code: data.code
    });
  };

  return (
    <>
      {/* @ts-ignore */}
      <Helmet>
        <title>Verify Your Email - Assignment Kore Dibo</title>
        <meta name="description" content="Verify your email to complete registration with Assignment Kore Dibo" />
      </Helmet>
      
      <div className="flex min-h-screen bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200">
        <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="w-full max-w-sm mx-auto lg:w-96">
            <Card>
              <CardHeader>
                <CardTitle>Verify Your Email</CardTitle>
                <CardDescription>
                  Please enter the verification code sent to your email address.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="mb-4">
                      <FormLabel>Email</FormLabel>
                      <div className="text-sm text-gray-600">{pendingVerificationEmail}</div>
                    </div>

                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter verification code"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={verifyMutation.isPending}
                    >
                      {verifyMutation.isPending ? "Verifying..." : "Verify Email"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
