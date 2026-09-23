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

/**
 * Generates a clean, simplified 'Scholarship Application Summary' PDF
 * for the user's records based on their profile and selected scholarship details.
 */
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
  const contentWidth = pageWidth - margin * 2; // 182 mm
  let currentY = 0;

  // 1. HEADER BANNER (Deep Indigo / Navy)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, "F");

  // Accent Line under header
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 27, pageWidth, 1.5, "F");

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("SCHOLARAI • APPLICATION SUMMARY & RECORD", margin, 12);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text("Personal Scholarship Record Dossier • Official Student Documentation", margin, 18);

  // Ref ID & Timestamp (Right aligned)
  const refCode = applicationReference?.trim()
    ? applicationReference.trim()
    : `SCH-${scholarship.id.toUpperCase()}-${new Date().getFullYear()}`;
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

  // 2. STATUS & CATEGORY STRIP
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, currentY, contentWidth, 10, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`CATEGORY: ${scholarship.category.toUpperCase()} SCHEME`, margin + 4, currentY + 6.5);

  const statusColor = submissionStatus.toLowerCase().includes("applied")
    ? [22, 163, 74] // emerald-600
    : [79, 70, 229]; // indigo-600
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`STATUS: ${submissionStatus.toUpperCase()}`, pageWidth - margin - 4, currentY + 6.5, {
    align: "right",
  });

  currentY += 15;

  // 3. TARGET SCHOLARSHIP DETAILS SECTION
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, contentWidth, 48, 2, 2, "FD");

  // Section Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("1. SCHOLARSHIP OPPORTUNITY DETAILS", margin + 4, currentY + 7);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 4, currentY + 9, margin + contentWidth - 4, currentY + 9);

  // Scheme Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(scholarship.title, contentWidth - 8);
  doc.text(titleLines[0] || scholarship.title, margin + 4, currentY + 15);

  // Details Grid
  doc.setFontSize(8.5);

  // Left Column
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
  doc.setTextColor(16, 185, 129); // emerald-600
  const cleanAmount = scholarship.amount.replace(/₹/g, "Rs. ");
  doc.text(cleanAmount, margin + 46, currentY + 28);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Application Deadline:", margin + 4, currentY + 34);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(scholarship.deadline, margin + 46, currentY + 34);

  // Right Column
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
  doc.setTextColor(37, 99, 235); // blue-600
  let displayUrl = scholarship.apply_link;
  try {
    displayUrl = new URL(scholarship.apply_link).hostname;
  } catch {
    displayUrl = scholarship.apply_link.slice(0, 24);
  }
  doc.text(displayUrl, rightColX + 28, currentY + 34);

  // One line brief description
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const briefDesc = doc.splitTextToSize(scholarship.description, contentWidth - 8);
  doc.text(briefDesc.slice(0, 2), margin + 4, currentY + 41);

  currentY += 53;

  // 4. APPLICANT PROFILE SNAPSHOT SECTION
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("2. APPLICANT PROFILE SNAPSHOT & ELIGIBILITY VERIFICATION", margin + 4, currentY + 7);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 4, currentY + 9, margin + contentWidth - 4, currentY + 9);

  // Row 1
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Applicant Full Name:", margin + 4, currentY + 16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(profile.name?.trim() || "Student Applicant", margin + 40, currentY + 16);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Current Enrolled Course:", rightColX, currentY + 16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(profile.course || "Bachelors Degree", rightColX + 42, currentY + 16);

  // Row 2
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Registered Email:", margin + 4, currentY + 23);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(profile.email || "Not specified", margin + 40, currentY + 23);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Academic Marks / Score:", rightColX, currentY + 23);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${profile.marks_percent}%`, rightColX + 42, currentY + 23);

  // Row 3
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Annual Family Income:", margin + 4, currentY + 30);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${profile.income.toLocaleString("en-IN")}`, margin + 40, currentY + 30);

  const isIncomeEligible = profile.income <= scholarship.income_limit;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Income Criteria Match:", rightColX, currentY + 30);
  doc.setFont("helvetica", "bold");
  if (isIncomeEligible) {
    doc.setTextColor(22, 163, 74);
    doc.text("PASS (Within Income Limit)", rightColX + 42, currentY + 30);
  } else {
    doc.setTextColor(220, 38, 38);
    doc.text("REVIEW (Exceeds Standard Ceiling)", rightColX + 42, currentY + 30);
  }

  currentY += 43;

  // 5. APPLICATION CHECKLIST & MANDATORY DOCUMENTS
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
    { title: "Academic Transcripts", desc: "Previous year marksheet & 10th/12th passing certificates" },
    { title: "Income Certificate", desc: "Current financial year certificate from Tehsildar / Competent Authority" },
    { title: "Bonafide Student Certificate", desc: "Signed & stamped bonafide/enrolment proof from institute" },
    { title: "Proof of Identity", desc: "Valid Aadhaar Card / Voter ID / Passport with matching name" },
    { title: "Bank Account Passbook", desc: "Active Savings A/C in applicant name with IFSC & branch stamp" },
    { title: "Domicile / Category Proof", desc: "Caste / Minority / State Domicile Certificate (if applicable)" },
  ];

  doc.setFontSize(8);
  checklistItems.forEach((item, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const itemX = col === 0 ? margin + 4 : rightColX;
    const itemY = currentY + 16 + row * 11;

    // Checkbox square
    doc.setDrawColor(100, 116, 139);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(itemX, itemY - 3.5, 4, 4, 0.5, 0.5, "FD");

    // Item text
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

  // 6. APPLICANT LOG & NOTES SECTION
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 42, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("4. APPLICANT SUBMISSION LOG & RECORD NOTES", margin + 4, currentY + 7);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 4, currentY + 9, margin + contentWidth - 4, currentY + 9);

  // Fillable Log Fields
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Portal Application / Registration No:", margin + 4, currentY + 16);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin + 60, currentY + 16, rightColX - 5, currentY + 16);

  doc.text("Date Submitted to Portal:", rightColX, currentY + 16);
  doc.line(rightColX + 38, currentY + 16, margin + contentWidth - 4, currentY + 16);

  doc.text("Portal Username / Application ID:", margin + 4, currentY + 23);
  doc.line(margin + 60, currentY + 23, rightColX - 5, currentY + 23);

  doc.text("Institute Verification Date:", rightColX, currentY + 23);
  doc.line(rightColX + 38, currentY + 23, margin + contentWidth - 4, currentY + 23);

  // User Notes if provided
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Record Notes:", margin + 4, currentY + 30);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  const noteText = notes?.trim()
    ? notes.trim()
    : "Keep application acknowledgement receipt, token number, and bank verification SMS saved for tracking.";
  const noteLines = doc.splitTextToSize(noteText, contentWidth - 30);
  doc.text(noteLines.slice(0, 2), margin + 28, currentY + 30);

  currentY += 48;

  // 7. OFFICIAL LINK & DISCLAIMER FOOTER
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text("Official Online Application Portal:", margin + 4, currentY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(37, 99, 235);
  const linkText = doc.splitTextToSize(scholarship.apply_link, contentWidth - 55);
  doc.text(linkText[0] || scholarship.apply_link, margin + 50, currentY + 5.5);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Disclaimer: This summary is generated for personal reference and audit. Submit applications directly via the official portal.",
    margin + 4,
    currentY + 10.5
  );

  // Page Bottom Watermark / Copyright
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("ScholarAI Platform • National Scholarship Assistant", margin, pageHeight - 6);
  doc.text("Page 1 of 1", pageWidth - margin, pageHeight - 6, { align: "right" });

  return doc;
}

/**
 * Convenience helper to download the PDF directly in the browser
 */
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

/**
 * Convenience helper accepting (scholarship, profile) for direct calls
 */
export function generateScholarshipSummaryPdf(scholarship: Scholarship, profile?: Partial<UserProfile>): void {
  downloadApplicationSummaryPdf({
    scholarship,
    profile: {
      name: profile?.name || "Student Applicant",
      category: profile?.category || "General",
      gender: profile?.gender || "All",
      course: profile?.course || "Undergraduate",
      income: profile?.income ?? 500000,
      state: profile?.state || "India",
      tenthPercentage: profile?.tenthPercentage ?? 85,
      twelfthPercentage: profile?.twelfthPercentage ?? 85,
    },
  });
}

