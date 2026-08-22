"use client";

import { useProfile, UserProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { profile, setProfile } = useProfile();
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const { toast } = useToast();

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const handleSave = () => {
    setProfile(localProfile);
    toast({
      title: "Profile Saved",
      description: "Your profile has been updated successfully.",
    });
  };
  
  const handleReset = () => {
      setLocalProfile(profile);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalProfile(prev => ({ ...prev, [name]: name === 'income' || name === 'marks_percent' ? Number(value) : value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setLocalProfile(prev => ({...prev, [name]: value}));
  };

  const isChanged = JSON.stringify(profile) !== JSON.stringify(localProfile);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Your Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Profile Details</CardTitle>
           <CardDescription>
            Keep your profile updated for the best scholarship recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={localProfile.name} onChange={handleChange} placeholder="Your Name" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="course">Current/Intended Course</Label>
                <Select value={localProfile.course} onValueChange={(value) => handleSelectChange('course', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Bachelors">Bachelors</SelectItem>
                    <SelectItem value="Masters">Masters</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                    <SelectItem value="Certificate">Certificate</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="income">Annual Family Income (INR)</Label>
                <Input id="income" name="income" type="number" value={localProfile.income} onChange={handleChange} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="marks_percent">Latest Marks (%)</Label>
                <Input id="marks_percent" name="marks_percent" type="number" value={localProfile.marks_percent} onChange={handleChange} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                 <Select value={localProfile.category} onValueChange={(value) => handleSelectChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="ST">ST</SelectItem>
                    <SelectItem value="OBC">OBC</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={handleReset} disabled={!isChanged}>Cancel</Button>
                <Button onClick={handleSave} disabled={!isChanged}>Save Profile</Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
