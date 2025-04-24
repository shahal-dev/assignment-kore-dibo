
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function SubmissionBox() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState("assignment");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate(mode === "assignment" ? "/assignments/create" : "/doubts/create");
  };

  return (
    <Card className="w-full max-w-xl mx-auto shadow-lg">
      <CardContent className="p-6">
        <Tabs defaultValue="assignment" className="mb-4" onValueChange={setMode}>
          <TabsList className="w-full">
            <TabsTrigger value="assignment" className="w-1/2">Assignment</TabsTrigger>
            <TabsTrigger value="doubt" className="w-1/2">Quick Doubt</TabsTrigger>
          </TabsList>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="assignment" className="mt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input placeholder="Assignment Title" required />
                  <Textarea placeholder="Describe your assignment requirements..." className="min-h-[100px]" required />
                  <Button type="submit" className="w-full">
                    {user ? "Create Assignment" : "Sign in to Post"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="doubt" className="mt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input placeholder="Quick Question Title" required />
                  <Textarea placeholder="Ask your doubt here..." className="min-h-[100px]" required />
                  <Button type="submit" className="w-full">
                    {user ? "Post Question" : "Sign in to Ask"}
                  </Button>
                </form>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </Card>
  );
}
