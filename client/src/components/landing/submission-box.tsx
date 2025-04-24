
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Upload, ImagePlus, ArrowRight } from "lucide-react";

export default function SubmissionBox() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("assignment");
  const [question, setQuestion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate("/assignments/create");
  };

  return (
    <Card className="w-full shadow-xl border-0 bg-white rounded-xl">
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="assignment" className="w-1/2">Assignment Help</TabsTrigger>
            <TabsTrigger value="doubt" className="w-1/2">Doubt Solving</TabsTrigger>
          </TabsList>
          <TabsContent value="assignment">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <Textarea 
                  placeholder="Describe your assignment..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[120px] p-4 border text-lg resize-none focus:ring-2 rounded-lg"
                />
                <div className="absolute right-4 top-4 flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Upload className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ImagePlus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  type="submit"
                  className="bg-[#FF7043] hover:bg-[#F4511E] text-white gap-2"
                >
                  {user ? "Get Help" : "Sign in to Get Help"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="doubt">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <Textarea 
                  placeholder="Ask your doubt..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[120px] p-4 border text-lg resize-none focus:ring-2 rounded-lg"
                />
                <div className="absolute right-4 top-4 flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Upload className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ImagePlus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  type="submit"
                  className="bg-[#FF7043] hover:bg-[#F4511E] text-white gap-2"
                >
                  {user ? "Ask Question" : "Sign in to Ask Question"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
