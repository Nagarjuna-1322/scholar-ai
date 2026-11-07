import jsPDF from "jspdf";
import type { Scholarship } from "@/lib/data";
import type { UserProfile } from "@/contexts/ProfileContext";

export interface SummaryPdfOptions {
  scholarship: Scholarship;
  profile: UserProfile;
  notes?: string;
  applicationReference?: string;
  submissionStatus?: string;
}

export function generateApplicationSummaryPdf({
  scholarship,
  profile,
  notes,
  applicationReference,
  submissionStatus = "Ready to Apply",
}: SummaryPdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 0;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setFillColor(99, 102, 241);
  doc.rect(0, 27, pageWidth, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("SCHOLARAI • APPLICATION SUMMARY & RECORD", margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text("Personal Scholarship Record Dossier • Official Student Documentation", margin, 18);

  const refCode = applicationReference?.trim()
    ? applicationReference.trim()
    : `SCH-${String(scholarship.id).padStart(4, "0")}-${new Date().getFullYear()}`;
  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`RECORD REF: ${refCode}`, pageWidth - margin, 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Generated: ${todayStr}`, pageWidth - margin, 18, { align: "right" });

  currentY = 35;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 10, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`CATEGORY: ${(scholarship.category || "Government").toUpperCase()} SCHEME`, margin + 4, currentY + 6.5);

  const statusColor = submissionStatus.toLowerCase().includes("submit") || submissionStatus.toLowerCase().includes("award")
    ? [22, 163, 74]
    : [79, 70, 229];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`STATUS: ${submissionStatus.toUpperCase()}`, pageWidth - margin - 4, currentY + 6.5, {
    align: "right",
  });

  currentY += 15;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 48, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("1. SCHOLARSHIP OPPORTUNITY DETAILS", margin + 4, currentY + 7);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 4, currentY + 9, margin + contentWidth - 4, currentY + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(scholarship.title, contentWidth - 8);
  doc.text(titleLines[0] || scholarship.title, margin + 4, currentY + 15);

  doc.setFontSize(8.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Funding Body / Provider:", margin + 4, currentY + 22);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(scholarship.provider, margin + 46, currentY + 22);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Scholarship Benefit:", margin + 4, currentY + 28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  const cleanAmount =
    typeof scholarship.amount === "number"
      ? `Rs. ${scholarship.amount.toLocaleString("en-IN")} / yr`
      : String(scholarship.amount).replace(/₹/g, "Rs. ");
  doc.text(cleanAmount, margin + 46, currentY + 28);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Application Deadline:", margin + 4, currentY + 34);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(225, 29, 72);
  doc.text(scholarship.deadline, margin + 46, currentY + 34);

  const rightColX = margin + 105;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Eligible Stream:", rightColX, currentY + 22);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const eligibleCoursesStr = scholarship.eligible_courses.slice(0, 3).join(", ");
  doc.text(eligibleCoursesStr, rightColX + 28, currentY + 22);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Max Family Income:", rightColX, currentY + 28);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${scholarship.income_limit.toLocaleString("en-IN")}/yr`, rightColX + 28, currentY + 28);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Official Portal:", rightColX, currentY + 34);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(37, 99, 235);
  const portalLink = scholarship.apply_link || scholarship.link;
  let displayUrl = portalLink;
  try {
    displayUrl = new URL(portalLink).hostname;
  } catch {
    displayUrl = portalLink.slice(0, 24);
  }
  doc.text(displayUrl, rightColX + 28, currentY + 34);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const briefDesc = doc.splitTextToSize(scholarship.description, contentWidth - 8);
  doc.text(briefDesc.slice(0, 2), margin + 4, currentY + 41);

  currentY += 53;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("2. APPLICANT PROFILE SNAPSHOT & ELIGIBILITY VERIFICATION", margin + 4, currentY + 7);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 4, currentY + 9, margin + contentWidth - 4, currentY + 9);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Applicant Full Name:", margin + 4, currentY + 16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(profile.fullName || profile.name?.trim() || "Student Applicant", margin + 40, currentY + 16);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Current Enrolled Course:", rightColX, currentY + 16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`${profile.course || "Undergraduate"} (${profile.state || "India"})`, rightColX + 42, currentY + 16);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Candidate Category:", margin + 4, currentY + 23);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(profile.category || "General", margin + 40, currentY + 23);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Academic Marks / Score:", rightColX, currentY + 23);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${profile.marks_percent ?? 75}%`, rightColX + 42, currentY + 23);

  const incomeVal = profile.income ?? 0;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Annual Family Income:", margin + 4, currentY + 30);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${incomeVal.toLocaleString("en-IN")}`, margin + 40, currentY + 30);

  const isIncomeEligible = incomeVal <= scholarship.income_limit;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Income Criteria Match:", rightColX, currentY + 30);
  doc.setFont("helvetica", "bold");
  if (isIncomeEligible) {
    doc.setTextColor(22, 163, 74);
    doc.text("PASS (Within Income Limit)", rightColX + 42, currentY + 30);
  } else {
    doc.setTextColor(220, 38, 38);
    doc.text("EXCEEDS CEILING", rightColX + 42, currentY + 30);
  }

  currentY += 43;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 54, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("3. ESSENTIAL DOCUMENTS & PRE-SUBMISSION CHECKLIST", margin + 4, currentY + 7);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 4, currentY + 9, margin + contentWidth - 4, currentY + 9);

  const checklistItems = [
    { title: "Academic Transcripts", desc: "Previous year marksheet & Class 10/12 passing certificates" },
    { title: "Income Certificate", desc: "Current financial year certificate from Tehsildar / MeeSeva" },
    { title: "Bonafide Student Certificate", desc: "Signed & stamped admission/enrolment proof from institute" },
    { title: "Domicile / Residence Proof", desc: "State domicile certificate for state portal verification" },
    { title: "Bank Account Passbook", desc: "Active student bank A/C linked with NPCI/DBT & IFSC" },
    { title: "Category Proof (If Applicable)", desc: "Valid Caste / EWS / Disability certificate" },
  ];

  doc.setFontSize(8);
  checklistItems.forEach((item, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const itemX = col === 0 ? margin + 4 : rightColX;
    const itemY = currentY + 16 + row * 11;

    doc.setDrawColor(100, 116, 139);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(itemX, itemY - 3.5, 4, 4, 0.5, 0.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(item.title, itemX + 6, itemY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(item.desc, itemX + 6, itemY + 4);
    doc.setFontSize(8);
  });

  currentY += 59;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 42, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("4. APPLICANT SUBMISSION LOG & RECORD NOTES", margin + 4, currentY + 7);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 4, currentY + 9, margin + contentWidth - 4, currentY + 9);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Portal Application / Registration No:", margin + 4, currentY + 16);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin + 60, currentY + 16, rightColX - 5, currentY + 16);

  doc.text("Date Submitted to Portal:", rightColX, currentY + 16);
  doc.line(rightColX + 38, currentY + 16, margin + contentWidth - 4, currentY + 16);

  doc.text("Record Notes:", margin + 4, currentY + 26);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  const noteText = notes?.trim()
    ? notes.trim()
    : "Keep application acknowledgement receipt, token number, and bank verification SMS saved for tracking.";
  const noteLines = doc.splitTextToSize(noteText, contentWidth - 30);
  doc.text(noteLines.slice(0, 2), margin + 28, currentY + 26);

  currentY += 48;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text("Official Online Application Portal:", margin + 4, currentY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(37, 99, 235);
  const linkText = doc.splitTextToSize(portalLink, contentWidth - 55);
  doc.text(linkText[0] || portalLink, margin + 50, currentY + 5.5);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Disclaimer: Genuine scholarships never charge application fees. Submit applications directly via the official portal.",
    margin + 4,
    currentY + 10.5
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("ScholarAI • Verified Indian Scholarship Assistant", margin, pageHeight - 6);
  doc.text("Page 1 of 1", pageWidth - margin, pageHeight - 6, { align: "right" });

  return doc;
}

export function downloadApplicationSummaryPdf(options: SummaryPdfOptions): void {
  const doc = generateApplicationSummaryPdf(options);
  const safeName = (options.scholarship.title || "Scholarship")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 28);
  const applicantName = (options.profile.name || "Student")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 15);
  const fileName = `Scholarship_Summary_${safeName}_${applicantName}.pdf`;
  doc.save(fileName);
}

export function generateScholarshipSummaryPdf(scholarship: Scholarship, profile?: Partial<UserProfile>): void {
  downloadApplicationSummaryPdf({
    scholarship,
    profile: {
      name: profile?.name || "Student Applicant",
      fullName: profile?.fullName || profile?.name || "Student Applicant",
      email: profile?.email || "",
      category: profile?.category || "General",
      course: profile?.course || "B.Tech",
      specialization: profile?.specialization || "",
      education_level: profile?.education_level || "Undergraduate",
      academic_year: profile?.academic_year || "2nd Year",
      institution: profile?.institution || "",
      income: profile?.income ?? 250000,
      marks_percent: profile?.marks_percent ?? 82,
      cgpa: profile?.cgpa ?? 8.2,
      state: profile?.state || "Telangana",
      gender: profile?.gender || "Any",
      is_specially_abled: profile?.is_specially_abled ?? false,
      is_armed_forces_ward: profile?.is_armed_forces_ward ?? false,
      career_interests: profile?.career_interests || "",
      completed_documents: profile?.completed_documents || [],
      preferred_language: profile?.preferred_language || "en",
    },
  });
}
