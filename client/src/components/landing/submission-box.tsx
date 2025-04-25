import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Upload, ImagePlus, ArrowRight } from "lucide-react";

export default function SubmissionBox() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("assignment");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("Other");
  const [question, setQuestion] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth");
      return;
    }
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('budget', budget);
    formData.append('deadline', deadline);
    formData.append('category', category);
    formData.append('question', question);
    photos.forEach(file => formData.append('photos', file));
    const res = await fetch('/api/assignments', {
      method: 'POST', credentials: 'include', body: formData
    });
    if (!res.ok) {
      alert('Submission failed'); return;
    }
    const assignment = await res.json();
    navigate(`/assignments/${assignment.id}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} required />
              </div>
              <div className="grid gap-2 md:grid-cols-3 md:gap-4">
                <div className="flex flex-col">
                  <Label htmlFor="budget">Budget (BDT)</Label>
                  <Input id="budget" type="number" value={budget} onChange={e => setBudget(e.target.value)} required />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input id="deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Essay Writing","Mathematics","Programming","Science","Research Paper","Business Studies","Engineering","Literature Review","Case Study","Other"].map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* hidden file input & trigger button */}
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-5 w-5" />
                </Button>
                <span>Attach Photos</span>
              </div>
              <div className="flex gap-2 mt-2">
                {previews.map((src, i) => (
                  <img key={i} src={src} className="h-20 w-20 object-cover rounded" />
                ))}
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="question">Your Doubt</Label>
                <Textarea
                  id="question"
                  placeholder="Ask your doubt..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  rows={4}
                  className="p-4 border text-lg resize-none focus:ring-2 rounded-lg"
                  required
                />
              </div>
              {/* hidden file input & trigger button */}
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
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
