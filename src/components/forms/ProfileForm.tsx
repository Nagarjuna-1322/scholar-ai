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

const INDIAN_STATES = [
  "Telangana",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Andhra Pradesh",
  "Kerala",
  "Delhi",
  "Uttar Pradesh",
  "Gujarat",
  "Rajasthan",
  "West Bengal",
  "Madhya Pradesh",
  "Bihar",
  "Odisha",
  "Assam",
  "Punjab",
  "Haryana",
];

export function ProfileForm({ onSave }: { onSave?: () => void }) {
  const { profile, setProfile, isProfileOpen, setProfileOpen } = useProfile();
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile, isProfileOpen]);

  const handleSave = () => {
    setProfile({
      ...localProfile,
      fullName: localProfile.name || localProfile.fullName,
    });
    setProfileOpen(false);
    if (onSave) {
      onSave();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalProfile((prev) => ({
      ...prev,
      [name]:
        name === "income" || name === "marks_percent" || name === "cgpa"
          ? value === ""
            ? null
            : Number(value)
          : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setLocalProfile((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={isProfileOpen} onOpenChange={setProfileOpen}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Student Academic & Domicile Profile</DialogTitle>
          <DialogDescription className="text-xs">
            Your profile powers the deterministic Eligibility Engine across all 22+ verified Central, AICTE, State Portal, and CSR scholarships.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-3 text-xs">
          <div className="space-y-1">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={localProfile.name}
              onChange={handleChange}
              placeholder="Your Full Name"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="state">State / Domicile</Label>
            <Select
              value={localProfile.state || "Telangana"}
              onValueChange={(value) => handleSelectChange("state", value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="education_level">Education Level</Label>
            <Select
              value={localProfile.education_level || "Undergraduate"}
              onValueChange={(value) => handleSelectChange("education_level", value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Class 11-12">Class 11–12</SelectItem>
                <SelectItem value="Diploma">Polytechnic / Diploma</SelectItem>
                <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                <SelectItem value="PhD">PhD / Doctoral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="course">Course / Degree</Label>
            <Select
              value={localProfile.course}
              onValueChange={(value) => handleSelectChange("course", value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="B.Tech">B.Tech / B.E</SelectItem>
                <SelectItem value="MBBS">MBBS / Medical</SelectItem>
                <SelectItem value="B.Sc">B.Sc</SelectItem>
                <SelectItem value="B.Com">B.Com</SelectItem>
                <SelectItem value="B.A">B.A</SelectItem>
                <SelectItem value="BCA">BCA</SelectItem>
                <SelectItem value="LLB">LLB / Law</SelectItem>
                <SelectItem value="B.Pharm">B.Pharm</SelectItem>
                <SelectItem value="Diploma">Diploma</SelectItem>
                <SelectItem value="M.Tech">M.Tech / M.E</SelectItem>
                <SelectItem value="MBA">MBA</SelectItem>
                <SelectItem value="M.Sc">M.Sc</SelectItem>
                <SelectItem value="Bachelors">Bachelors (General)</SelectItem>
                <SelectItem value="Masters">Masters (General)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="specialization">Branch / Specialization</Label>
            <Input
              id="specialization"
              name="specialization"
              value={localProfile.specialization || ""}
              onChange={handleChange}
              placeholder="e.g. Computer Science & Engineering"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="academic_year">Academic Year</Label>
            <Select
              value={localProfile.academic_year || "2nd Year"}
              onValueChange={(value) => handleSelectChange("academic_year", value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1st Year">1st Year</SelectItem>
                <SelectItem value="2nd Year">2nd Year</SelectItem>
                <SelectItem value="3rd Year">3rd Year</SelectItem>
                <SelectItem value="4th Year">4th Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="marks_percent">Latest Marks (%)</Label>
            <Input
              id="marks_percent"
              name="marks_percent"
              type="number"
              min={0}
              max={100}
              value={localProfile.marks_percent ?? ""}
              onChange={handleChange}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cgpa">CGPA (Out of 10)</Label>
            <Input
              id="cgpa"
              name="cgpa"
              type="number"
              step="0.1"
              min={0}
              max={10}
              value={localProfile.cgpa ?? ""}
              onChange={handleChange}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="income">Annual Family Income (₹)</Label>
            <Input
              id="income"
              name="income"
              type="number"
              min={0}
              value={localProfile.income ?? ""}
              onChange={handleChange}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="category">Social Category</Label>
            <Select
              value={localProfile.category}
              onValueChange={(value) => handleSelectChange("category", value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="OBC">OBC / BC</SelectItem>
                <SelectItem value="EWS">EWS</SelectItem>
                <SelectItem value="SC">SC</SelectItem>
                <SelectItem value="ST">ST</SelectItem>
                <SelectItem value="Minority">Minority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={localProfile.gender || "Male"}
              onValueChange={(value) => handleSelectChange("gender", value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="institution">College / Institution</Label>
            <Input
              id="institution"
              name="institution"
              value={localProfile.institution || ""}
              onChange={handleChange}
              placeholder="e.g. JNTU Hyderabad"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(localProfile.is_specially_abled)}
              onChange={(e) =>
                setLocalProfile((prev) => ({ ...prev, is_specially_abled: e.target.checked }))
              }
            />
            <span>PwD / Specially Abled (≥40% disability)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(localProfile.is_armed_forces_ward)}
              onChange={(e) =>
                setLocalProfile((prev) => ({ ...prev, is_armed_forces_ward: e.target.checked }))
              }
            />
            <span>Ward of Armed Forces / CAPF / Police Personnel</span>
          </label>
        </div>

        <DialogFooter className="pt-3">
          <Button variant="outline" size="sm" onClick={() => setProfileOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save & Recalculate Matches
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
