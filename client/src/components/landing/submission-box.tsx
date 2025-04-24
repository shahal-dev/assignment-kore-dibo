
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload, ImagePlus, ArrowRight } from "lucide-react";

export default function SubmissionBox() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
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
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Textarea 
              placeholder="What would you like help with today?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[120px] p-6 border-0 text-lg resize-none focus:ring-0 rounded-t-xl"
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
          <div className="p-3 bg-gray-50 rounded-b-xl flex justify-end">
            <Button 
              type="submit"
              className="bg-[#FF7043] hover:bg-[#F4511E] text-white gap-2"
            >
              {user ? "Get Help" : "Sign in to Get Help"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
