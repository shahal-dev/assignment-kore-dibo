import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Tag, Calendar, Loader2, AlertCircle, Info, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link, useLocation } from 'wouter';

import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';

interface Assignment {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  bidCount?: number;
  photos?: string[];
  createdAt: string;
  isOpen: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const categories = [
  'All Categories',
  'Academic Writing',
  'Programming',
  'Data Analysis',
  'Research',
  'Design',
  'Other'
];

const budgetRanges = [
  { label: 'Any Budget', value: 'any' },
  { label: 'Under $50', value: 'under-50' },
  { label: '$50 - $100', value: '50-100' },
  { label: '$100 - $200', value: '100-200' },
  { label: '$200 - $500', value: '200-500' },
  { label: 'Over $500', value: 'over-500' }
];

const deadlineRanges = [
  { label: 'Any Deadline', value: 'any' },
  { label: 'Within 24 hours', value: '24h' },
  { label: 'Within 3 days', value: '3d' },
  { label: 'Within a week', value: '1w' },
  { label: 'Within 2 weeks', value: '2w' },
  { label: 'Over 2 weeks', value: '>2w' }
];

export default function BrowseAssignments() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [budget, setBudget] = useState('any');
  const [deadline, setDeadline] = useState('any');
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);

  const { data: assignments, isLoading, error } = useQuery<Assignment[]>({
    queryKey: ['assignments'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/assignments`);
      if (!res.ok) throw new Error('Failed to fetch assignments');
      return res.json();
    },
  });

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (!assignments) return;

    let filtered = [...assignments];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(assignment =>
        assignment.title.toLowerCase().includes(query) ||
        assignment.description.toLowerCase().includes(query)
      );
    }

    if (category !== "All Categories") {
      filtered = filtered.filter(assignment => assignment.category === category);
    }

    if (budget !== "any") {
      if (budget === "under-50") filtered = filtered.filter(a => a.budget < 50);
      if (budget === "50-100") filtered = filtered.filter(a => a.budget >= 50 && a.budget <= 100);
      if (budget === "100-200") filtered = filtered.filter(a => a.budget > 100 && a.budget <= 200);
      if (budget === "200-500") filtered = filtered.filter(a => a.budget > 200 && a.budget <= 500);
      if (budget === "over-500") filtered = filtered.filter(a => a.budget > 500);
    }

    if (deadline !== "any") {
      const now = new Date();
      if (deadline === "24h") now.setHours(now.getHours() + 24);
      else if (deadline === "3d") now.setDate(now.getDate() + 3);
      else if (deadline === "1w") now.setDate(now.getDate() + 7);
      else if (deadline === "2w") now.setDate(now.getDate() + 14);
      else if (deadline === ">2w") now.setDate(now.getDate() + 14); // over 2 weeks

      filtered = filtered.filter(a => {
        const deadlineDate = new Date(a.deadline);
        if (deadline === ">2w") return deadlineDate > now;
        return deadlineDate <= now;
      });
    }

    filtered = filtered.filter(a => a.isOpen);
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredAssignments(filtered);
  }, [assignments, searchQuery, category, budget, deadline]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filtering is handled automatically
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategory('All Categories');
    setBudget('any');
    setDeadline('any');
  };

  if (!user) return null;

  return (
    <MainLayout>
      <Helmet>
        <title>Browse Assignments - Assignment Harbor</title>
      </Helmet>

      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Browse Assignments</h1>
          <p className="text-lg text-gray-600">Find assignments that match your expertise and start bidding</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search assignments..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <Button type="submit" className="sm:w-auto w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={budget} onValueChange={setBudget}>
                  <SelectTrigger>
                    <Tag className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetRanges.map(b => (
                      <SelectItem key={b.label} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={deadline} onValueChange={setDeadline}>
                  <SelectTrigger>
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Deadline" />
                  </SelectTrigger>
                  <SelectContent>
                    {deadlineRanges.map(d => (
                      <SelectItem key={d.label} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(searchQuery || category !== 'All Categories' || budget !== 'any' || deadline !== 'any') && (
                <div className="flex justify-end">
                  <Button variant="outline" type="button" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Assignments */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Error loading assignments</h3>
            <p className="mt-2 text-gray-600">Please try again later.</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-16">
            <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No assignments found</h3>
            <p className="mt-2 text-gray-600">Try changing your search criteria.</p>
            <Button className="mt-4" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map(a => (
              <AssignmentCard key={a.id} assignment={a} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

// --------- Assignment Card ------------
interface AssignmentCardProps {
  assignment: Assignment;
}

function AssignmentCard({ assignment }: AssignmentCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-6 flex flex-col flex-1">
        {assignment.photos && assignment.photos.length > 0 && (
          <img
            src={`${API_URL}${assignment.photos[0]}`}
            alt="Assignment"
            className="w-full h-32 object-cover rounded-md mb-4"
          />
        )}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            <Link href={`/assignments/${assignment.id}`}>
              <a className="hover:text-primary-600">{assignment.title}</a>
            </Link>
          </h3>
          <Badge>{assignment.category}</Badge>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">{assignment.description}</p>

        <div className="space-y-2 text-sm text-gray-500 mt-auto">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span>Due {formatDistanceToNow(new Date(assignment.deadline), { addSuffix: true })}</span>
          </div>
          <div className="flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            <span>Budget: ৳{assignment.budget}</span>
          </div>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            <span>{assignment.bidCount || 0} bids</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
