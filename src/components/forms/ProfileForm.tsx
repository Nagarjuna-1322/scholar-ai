"use client";

import { useProfile, UserProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function ProfileForm({ onSave }: { onSave?: () => void }) {
  const { profile, setProfile, isProfileOpen, setProfileOpen } = useProfile();
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const router = useRouter();

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile, isProfileOpen]);

  const handleSave = () => {
    setProfile(localProfile);
    setProfileOpen(false);
    if (onSave) {
      onSave();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalProfile(prev => ({ ...prev, [name]: name === 'income' || name === 'marks_percent' ? Number(value) : value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setLocalProfile(prev => ({...prev, [name]: value}));
  };

  return (
    <Dialog open={isProfileOpen} onOpenChange={setProfileOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile to get personalized scholarship recommendations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" name="name" value={localProfile.name} onChange={handleChange} className="col-span-3" placeholder="Your Name" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="course" className="text-right">Course</Label>
            <Select value={localProfile.course} onValueChange={(value) => handleSelectChange('course', value)}>
              <SelectTrigger className="col-span-3">
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="income" className="text-right">Income (Annual)</Label>
            <Input id="income" name="income" type="number" value={localProfile.income} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="marks_percent" className="text-right">Marks (%)</Label>
            <Input id="marks_percent" name="marks_percent" type="number" value={localProfile.marks_percent} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
             <Select value={localProfile.category} onValueChange={(value) => handleSelectChange('category', value)}>
              <SelectTrigger className="col-span-3">
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
        <DialogFooter>
          <Button variant="outline" onClick={() => setProfileOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Profile</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
