"use client";

import { useState, useEffect } from "react";
import { useProfile, UserProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";

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

export default function ProfilePage() {
  const { profile, setProfile, completionPercentage, missingFields } = useProfile();
  const { user, deleteAccount } = useAuth();
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const handleSave = () => {
    setProfile({
      ...localProfile,
      fullName: localProfile.name || localProfile.fullName,
    });
    toast({
      title: "Student Profile Saved",
      description: "Your academic, financial, and domicile details have been synced.",
    });
  };

  const handleReset = () => {
    setLocalProfile(profile);
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

  const handleDeleteAccount = async () => {
    await deleteAccount();
    setConfirmDelete(false);
    toast({
      title: "Account & Personal Data Deleted",
      description: "Your server profile, tracked applications, and local storage have been permanently cleared.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline">Student Profile & Account</h1>
          <p className="text-sm text-muted-foreground">
            Manage your academic credentials, domicile, and privacy settings. No Aadhaar number is ever required.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs py-1 px-2.5">
            Profile Readiness: {completionPercentage}%
          </Badge>
        </div>
      </div>

      {/* Profile Readiness Bar */}
      <Card>
        <CardContent className="pt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Profile Completion & Eligibility Readiness
            </span>
            <span className="font-mono font-bold">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          {missingFields.length > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400 pt-1">
              Missing fields for 100% deterministic matching: <strong>{missingFields.join(", ")}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Main Profile Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">Academic, Domicile & Financial Details</CardTitle>
          <CardDescription className="text-xs">
            Used by the Deterministic Eligibility Engine to calculate your Profile Compatibility Score across NSP, AICTE, State Portals, and CSR scholarships.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={localProfile.name}
                onChange={handleChange}
                placeholder="Your Full Name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={localProfile.email || ""}
                onChange={handleChange}
                placeholder="student@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="state">Domicile State</Label>
              <Select
                value={localProfile.state || "Telangana"}
                onValueChange={(value) => handleSelectChange("state", value)}
              >
                <SelectTrigger>
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

            <div className="space-y-1.5">
              <Label htmlFor="education_level">Education Level</Label>
              <Select
                value={localProfile.education_level || "Undergraduate"}
                onValueChange={(value) => handleSelectChange("education_level", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select education level" />
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

            <div className="space-y-1.5">
              <Label htmlFor="course">Degree / Course</Label>
              <Select
                value={localProfile.course}
                onValueChange={(value) => handleSelectChange("course", value)}
              >
                <SelectTrigger>
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

            <div className="space-y-1.5">
              <Label htmlFor="specialization">Specialization / Branch</Label>
              <Input
                id="specialization"
                name="specialization"
                value={localProfile.specialization || ""}
                onChange={handleChange}
                placeholder="e.g. Computer Science & Engineering"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="academic_year">Current Academic Year</Label>
              <Select
                value={localProfile.academic_year || "2nd Year"}
                onValueChange={(value) => handleSelectChange("academic_year", value)}
              >
                <SelectTrigger>
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

            <div className="space-y-1.5">
              <Label htmlFor="institution">Institution / University Name</Label>
              <Input
                id="institution"
                name="institution"
                value={localProfile.institution || ""}
                onChange={handleChange}
                placeholder="e.g. JNTU Hyderabad"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="marks_percent">Latest Qualifying Marks (%)</Label>
              <Input
                id="marks_percent"
                name="marks_percent"
                type="number"
                min={0}
                max={100}
                value={localProfile.marks_percent ?? ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cgpa">Current CGPA (Out of 10)</Label>
              <Input
                id="cgpa"
                name="cgpa"
                type="number"
                step="0.1"
                min={0}
                max={10}
                value={localProfile.cgpa ?? ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="income">Annual Family Income (₹)</Label>
              <Input
                id="income"
                name="income"
                type="number"
                min={0}
                value={localProfile.income ?? ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Social Category</Label>
              <Select
                value={localProfile.category}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger>
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

            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={localProfile.gender || "Male"}
                onValueChange={(value) => handleSelectChange("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="career_interests">Academic & Career Interests (Used for truthful SOP drafts)</Label>
              <Input
                id="career_interests"
                name="career_interests"
                value={localProfile.career_interests || ""}
                onChange={handleChange}
                placeholder="e.g. Artificial Intelligence, Sustainable Engineering, Public Health"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(localProfile.is_specially_abled)}
                onChange={(e) =>
                  setLocalProfile((prev) => ({ ...prev, is_specially_abled: e.target.checked }))
                }
              />
              <span>Specially Abled / PwD Candidate (Unlock AICTE Saksham & NHFDC schemes)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(localProfile.is_armed_forces_ward)}
                onChange={(e) =>
                  setLocalProfile((prev) => ({ ...prev, is_armed_forces_ward: e.target.checked }))
                }
              />
              <span>Ward of Armed Forces / CAPF / Police Personnel (Unlock PMSS scheme)</span>
            </label>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset Changes
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save Profile
          </Button>
        </CardFooter>
      </Card>

      {/* Account & Privacy Controls Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Account & Privacy Controls
          </CardTitle>
          <CardDescription className="text-xs">
            Manage your student account and saved data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="p-3.5 rounded-lg border bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                Active Account: {user ? `${user.name} (${user.email})` : "Guest Student Session"}
              </p>
              <p className="text-muted-foreground">
                Your profile and scholarship applications are saved to your account.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                Delete Account & Personal Data
              </p>
              <p className="text-muted-foreground mt-0.5">
                Permanently deletes your profile, tracked applications, and reminders from both `/api/user-data` and browser storage.
              </p>
            </div>
            {!confirmDelete ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="shrink-0 gap-1.5 h-8 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Account
              </Button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="destructive" size="sm" onClick={handleDeleteAccount} className="h-8 text-xs">
                  Confirm Permanent Delete
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)} className="h-8 text-xs">
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
