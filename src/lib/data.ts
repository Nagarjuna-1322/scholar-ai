export type VerificationStatus =
  | "Verified Source"
  | "Awaiting Verification"
  | "Information Outdated";

export type ScholarshipApplicationWindowStatus =
  | "Open"
  | "Closed"
  | "Upcoming"
  | "Unverified";

export type Scholarship = {
  id: number;
  title: string;
  provider: string;
  category: "Government" | "Private" | string;
  provider_type?:
    | "Central Government"
    | "State Government"
    | "AICTE / Statutory"
    | "UGC / Research"
    | "PSU / Corporate CSR"
    | "Private Foundation"
    | string;
  eligible_courses: string[];
  education_level?: string;
  level?: string;
  field_of_study?: string;
  academic_years?: string[];
  eligible_states?: string[];
  region: string;
  eligible_categories: string[];
  gender_requirement?: "All" | "Female" | string;
  min_marks_percent?: number;
  income_limit: number;
  disability_required?: boolean;
  armed_forces_ward_only?: boolean;
  deadline: string;
  description: string;
  apply_link: string;
  link: string;
  official_source_url?: string;
  source_portal?: string;
  tags: string[];
  amount: number;
  amount_label?: string;
  annual_amount_numeric?: number;
  required_documents?: string[];
  application_steps?: string[];
  selection_process?: string;
  fee_warning?: string;
  featured?: boolean;
  eligibility: {
    description: string;
    minMarks?: number;
    maxIncome?: number;
  };
  combinable_rules?: string;
  verification_status?: VerificationStatus;
  last_verified_at?: string;
  application_status?: ScholarshipApplicationWindowStatus;
  isNew?: boolean;
  publishedAt?: string;
  replacesId?: number;
  replacesTitle?: string;
  isExpired?: boolean;
};

export type RawScholarshipInput = Omit<
  Scholarship,
  "amount" | "region" | "link" | "eligible_categories" | "eligibility"
> & {
  amount: number | string;
  region?: string;
  link?: string;
  eligible_categories?: string[];
  eligibility?: {
    description: string;
    minMarks?: number;
    maxIncome?: number;
  };
};

export type ExpiredScholarshipRecord = {
  expiredId: number;
  expiredTitle: string;
  provider: string;
  originalDeadline: string;
  category: "Government" | "Private" | string;
  replacementId?: number;
  replacementTitle?: string;
  retiredOn: string;
  reason: string;
};

export type SuspiciousReportRecord = {
  id: string;
  scholarshipId: number | string;
  scholarshipTitle: string;
  reportedBy?: string;
  reporterEmail?: string;
  reason:
    | "Outdated Deadline"
    | "Broken Official Link"
    | "Suspicious Fee Request"
    | "Incorrect Eligibility Criteria"
    | "Incorrect Deadline"
    | "Broken Link"
    | "Suspicious / Fee Request"
    | "Outdated Criteria"
    | "Other"
    | string;
  details: string;
  createdAt: string;
  status: "Pending Review" | "Open" | "Resolved" | "Dismissed";
  adminNotes?: string;
};

export type AdminAuditLogEntry = {
  id: string;
  timestamp: string;
  actorEmail: string;
  action: string;
  targetTitle: string;
  details: string;
};

const TRUSTED_OFFICIAL_DOMAINS = [
  "scholarships.gov.in",
  "aicte-india.org",
  "online-inspire.gov.in",
  "licindia.in",
  "reliancefoundation.org",
  "buildyourfuture.withgoogle.com",
  "buddy4study.com",
  "infosys.com",
  "amazonfutureengineer.in",
  "adobe.com",
  "siemens.com",
  "loreal.com",
  "ongcscholar.org",
  "sitaramjindalfoundation.org",
  "kcmet.org",
  "sbifoundation.in",
  "federalbank.co.in",
  "telanganaepass.cgg.gov.in",
  "mahadbt.maharashtra.gov.in",
  "ssp.postmatric.karnataka.gov.in",
  "ugc.gov.in",
];

/**
 * Validates whether a scholarship URL belongs to an HTTPS official domain
 * and checks for suspicious indicators.
 */
export function verifyScholarshipSourceDomain(urlStr: string): {
  isHttps: boolean;
  isTrustedDomain: boolean;
  isTrustedGovOrCSR: boolean;
  hostname: string;
  warningMessage: string | null;
} {
  try {
    const parsed = new URL(urlStr);
    const isHttps = parsed.protocol === "https:";
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const isTrustedDomain =
      TRUSTED_OFFICIAL_DOMAINS.some(
        (d) => hostname === d || hostname.endsWith(`.${d}`)
      ) ||
      hostname.endsWith(".gov.in") ||
      hostname.endsWith(".nic.in") ||
      hostname.endsWith(".ac.in") ||
      hostname.endsWith(".edu.in");

    let warningMessage: string | null = null;
    if (!isHttps) {
      warningMessage =
        "This link does not use secure HTTPS encryption. Proceed with caution and never submit sensitive documents over unencrypted links.";
    } else if (!isTrustedDomain) {
      warningMessage =
        "This domain is not yet on the pre-verified national/CSR allowlist. Confirm the provider authenticity before uploading documents, and never pay any application fee.";
    }

    return {
      isHttps,
      isTrustedDomain,
      isTrustedGovOrCSR: isTrustedDomain,
      hostname,
      warningMessage,
    };
  } catch {
    return {
      isHttps: false,
      isTrustedDomain: false,
      isTrustedGovOrCSR: false,
      hostname: "invalid-url",
      warningMessage: "Malformed application link detected.",
    };
  }
}

/**
 * Detects duplicate scholarship listings by normalizing title + provider.
 */
export function detectDuplicateScholarship(
  candidate: { title: string; provider: string },
  existingList: Scholarship[]
): Scholarship | undefined {
  const normTitle = candidate.title.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normProvider = candidate.provider.toLowerCase().replace(/[^a-z0-9]/g, "");

  return existingList.find((item) => {
    const itemTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    const itemProv = item.provider.toLowerCase().replace(/[^a-z0-9]/g, "");
    return (
      itemTitle === normTitle ||
      (itemTitle.includes(normTitle) && itemProv === normProvider && normTitle.length > 12)
    );
  });
}

const rawScholarshipInputs: RawScholarshipInput[] = [
  // --- GOVERNMENT SCHOLARSHIPS (CENTRAL & STATE) ---
  {
    id: 1,
    title: "Central Sector Scheme of Scholarship for College & University Students",
    provider: "Ministry of Education (Govt of India)",
    category: "Government",
    provider_type: "Central Government",
    eligible_courses: ["Bachelors", "Masters", "Engineering", "Medical", "Science", "Commerce", "Arts"],
    education_level: "Undergraduate & Postgraduate",
    academic_years: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS", "Minority"],
    gender_requirement: "All",
    min_marks_percent: 80,
    income_limit: 450000,
    deadline: "2026-11-30",
    description:
      "Central government scheme implemented through the National Scholarship Portal (NSP) supporting meritorious students above the 80th percentile in Class 12 pursuing regular higher education degrees.",
    apply_link: "https://scholarships.gov.in/",
    official_source_url: "https://scholarships.gov.in/",
    tags: ["government", "merit", "central", "nsp"],
    amount: "₹20,000 / year",
    annual_amount_numeric: 20000,
    source_portal: "National Scholarship Portal (scholarships.gov.in)",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-01",
    application_status: "Open",
    required_documents: [
      "Class 12 Mark Sheet (minimum 80th percentile)",
      "Family Income Certificate (≤ ₹4.5 Lakh/year)",
      "Bonafide Student Certificate from Institution",
      "Aadhaar-seeded Bank Account Passbook",
      "Category Certificate (if applicable)",
    ],
    application_steps: [
      "Complete One-Time Registration (OTR) on the National Scholarship Portal (scholarships.gov.in).",
      "Log in with your NSP OTR ID and select 'Central Sector Scheme of Scholarships for College and University Students'.",
      "Enter academic details from Class 12 board examination and current college AISHE code.",
      "Upload income certificate and bonafide certificate, then submit for Institute Nodal Officer (INO) verification.",
    ],
    combinable_rules:
      "Students receiving this scholarship cannot hold any other Central or State Government scholarship simultaneously, though fee waivers from institutions are permitted.",
  },
  {
    id: 2,
    title: "AICTE Pragati Scholarship Scheme for Girl Students (Technical Degree & Diploma)",
    provider: "All India Council for Technical Education (AICTE)",
    category: "Government",
    provider_type: "AICTE / Statutory",
    eligible_courses: ["Bachelors", "Diploma", "Engineering", "Technology"],
    education_level: "Technical Degree / Diploma",
    academic_years: ["1st Year", "2nd Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "Female",
    min_marks_percent: 60,
    income_limit: 800000,
    deadline: "2026-12-15",
    description:
      "AICTE flagship scheme providing ₹50,000 per annum to female students admitted to 1st year or 2nd year (lateral entry) of AICTE-approved technical degree or diploma institutions (up to two girls per family).",
    apply_link: "https://www.aicte-india.org/schemes/students-development-schemes/Pragati",
    official_source_url: "https://scholarships.gov.in/",
    tags: ["government", "women", "stem", "aicte", "technical"],
    amount: "₹50,000 / year",
    annual_amount_numeric: 50000,
    source_portal: "AICTE & National Scholarship Portal (scholarships.gov.in)",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-02",
    application_status: "Open",
    isNew: true,
    publishedAt: "2026-10-15",
    required_documents: [
      "Class 10 & Class 12 / Diploma Mark Sheets",
      "AICTE College Admission Allotment Letter",
      "Annual Family Income Certificate (≤ ₹8.0 Lakh/year issued by Tehsildar or above)",
      "Tuition Fee Receipt & Bonafide Certificate",
      "Parent Declaration (confirming maximum 2 female beneficiaries in family)",
      "Bank Passbook Copy (Aadhaar-linked)",
    ],
    application_steps: [
      "Register on the National Scholarship Portal (scholarships.gov.in) under AICTE schemes.",
      "Select 'AICTE Pragati Scholarship for Girl Students' and verify your AICTE institution code.",
      "Upload scanned copies of admission letter, income certificate, and parent declaration.",
      "Submit the online form and provide hard copies to your college AICTE nodal officer for Level-1 verification.",
    ],
    combinable_rules:
      "Cannot be combined with other NSP central scholarships. Can be used alongside institutional merit tuition waivers.",
  },
  {
    id: 3,
    title: "AICTE Saksham Scholarship for Specially Abled Students",
    provider: "All India Council for Technical Education (AICTE)",
    category: "Government",
    provider_type: "AICTE / Statutory",
    eligible_courses: ["Bachelors", "Diploma", "Engineering", "Technology"],
    education_level: "Technical Degree / Diploma",
    academic_years: ["1st Year", "2nd Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "All",
    min_marks_percent: 50,
    income_limit: 800000,
    disability_required: true,
    deadline: "2026-12-15",
    description:
      "Government scheme supporting specially-abled students having not less than 40% disability who are admitted to first year or lateral entry second year of technical degree/diploma courses in AICTE-approved institutions.",
    apply_link: "https://www.aicte-india.org/schemes/students-development-schemes/Saksham",
    official_source_url: "https://scholarships.gov.in/",
    tags: ["government", "welfare", "stem", "disability", "aicte"],
    amount: "₹50,000 / year",
    annual_amount_numeric: 50000,
    source_portal: "National Scholarship Portal & AICTE",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-02",
    application_status: "Open",
    required_documents: [
      "UDID / Disability Certificate (≥ 40% disability issued by competent medical authority)",
      "Family Income Certificate (≤ ₹8.0 Lakh/year)",
      "AICTE Institution Admission Letter & Bonafide Certificate",
      "Class 10 / 12 Mark Sheets",
      "Aadhaar-linked Bank Account Passbook",
    ],
    application_steps: [
      "Log in to the National Scholarship Portal (NSP) and complete OTR verification.",
      "Choose AICTE Saksham Scholarship Scheme and enter UDID / Disability certificate details.",
      "Upload required academic, disability, and income certificates.",
      "Submit and track Institute Nodal Officer verification on NSP.",
    ],
    combinable_rules:
      "Cannot be combined with other central NSP schemes.",
  },
  {
    id: 4,
    title: "Telangana ePASS Post-Matric Scholarship (RTF & MTF)",
    provider: "Government of Telangana (Scheduled Castes, ST, BC, EBC & Minority Welfare)",
    category: "Government",
    provider_type: "State Government",
    eligible_courses: ["Bachelors", "Masters", "PhD", "Diploma", "Engineering", "Medical", "MBA", "Pharmacy"],
    education_level: "Post-Matric (Intermediate, Diploma, UG, PG, Professional)",
    academic_years: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    eligible_states: ["Telangana"],
    eligible_categories: ["SC", "ST", "OBC", "EWS", "Minority"],
    gender_requirement: "All",
    min_marks_percent: 50,
    income_limit: 200000,
    deadline: "2027-01-31",
    description:
      "Official Telangana State ePASS Post-Matric Scholarship providing Reimbursement of Tuition Fee (RTF) and Maintenance Charges (MTF) for eligible SC, ST, BC, EBC, Minority, and Disabled students domiciled in Telangana.",
    apply_link: "https://telanganaepass.cgg.gov.in/",
    official_source_url: "https://telanganaepass.cgg.gov.in/",
    tags: ["government", "state", "telangana", "welfare", "post-matric"],
    amount: "100% Tuition Reimbursement + Monthly Maintenance",
    annual_amount_numeric: 45000,
    source_portal: "Telangana ePASS Official Portal (telanganaepass.cgg.gov.in)",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-05",
    application_status: "Open",
    isNew: true,
    publishedAt: "2026-10-20",
    required_documents: [
      "MeeSeva Caste Certificate (SC / ST / BC / EBC / Minority)",
      "MeeSeva Income Certificate (≤ ₹2.0 Lakh Rural/Urban as per category norms)",
      "SSC (Class 10) Hall Ticket & Pass Memo",
      "Bonafide Certificates for last 7 consecutive years of study (Residence proof)",
      "CET Allotment Order (TG EAPCET / TG ICET / TG PGECET) for professional courses",
      "College Bonafide & Tuition Fee Structure Certificate",
    ],
    application_steps: [
      "Visit telanganaepass.cgg.gov.in and select 'Post Matric Scholarships Services'.",
      "Click 'Fresh Registration (2026-27)' or 'Renewal Registration' and verify SSC details.",
      "Enter MeeSeva Caste and Income Certificate transaction numbers for online validation.",
      "Upload scanned copies of allotment order and bonafide certificate, then complete biometric authentication at MeeSeva/College.",
    ],
    combinable_rules:
      "Students claiming Telangana ePASS RTF/MTF cannot simultaneously draw Central Sector NSP maintenance allowances, though private CSR merit grants may be held subject to foundation rules.",
  },
  {
    id: 5,
    title: "INSPIRE Scholarship for Higher Education (SHE)",
    provider: "Department of Science and Technology (DST, Govt of India)",
    category: "Government",
    provider_type: "UGC / Research",
    eligible_courses: ["Bachelors", "Masters", "Science", "Research"],
    education_level: "B.Sc. / B.S. / Integrated M.Sc. / M.S.",
    academic_years: ["1st Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "All",
    min_marks_percent: 88,
    income_limit: 1500000,
    deadline: "2026-12-31",
    description:
      "Premier DST fellowship for students within the top 1% of their Class 12 Board examination (or JEE/NEET top 10,000 rankers) pursuing Basic and Natural Sciences at B.Sc., B.S., or Integrated M.Sc. levels.",
    apply_link: "https://online-inspire.gov.in/",
    official_source_url: "https://online-inspire.gov.in/",
    tags: ["government", "merit", "stem", "research", "science"],
    amount: "₹80,000 / year (₹60,000 Cash + ₹20,000 Research Mentorship)",
    annual_amount_numeric: 80000,
    source_portal: "DST INSPIRE Portal (online-inspire.gov.in)",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-01",
    application_status: "Open",
    required_documents: [
      "Class 12 Mark Sheet & State/Central Board Top 1% Eligibility Advisory Note",
      "Class 10 Mark Sheet / Date of Birth Proof",
      "Endorsement Certificate signed by Principal/Registrar of College/University",
      "SBI Bank Account Details (as required by DST INSPIRE portal)",
    ],
    application_steps: [
      "Register on the DST INSPIRE web portal (online-inspire.gov.in).",
      "Select the Scholarship for Higher Education (SHE) component and fill in Class 12 board details.",
      "Upload the Principal Endorsement Form confirming enrollment in eligible Natural/Basic Science subjects.",
      "Submit online before the deadline and retain the application reference number.",
    ],
    combinable_rules:
      "Cannot be held concurrently with KVPY, CSSTE, or other Government of India fellowships.",
  },
  {
    id: 6,
    title: "UGC Ishan Uday Special Scholarship for North Eastern Region",
    provider: "University Grants Commission (UGC)",
    category: "Government",
    provider_type: "UGC / Research",
    eligible_courses: ["Bachelors", "Engineering", "Medical", "Science", "Arts", "Commerce"],
    education_level: "First-Year Undergraduate Degree",
    academic_years: ["1st Year"],
    eligible_states: [
      "Assam",
      "Arunachal Pradesh",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Sikkim",
      "Tripura",
    ],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "All",
    min_marks_percent: 60,
    income_limit: 450000,
    deadline: "2026-11-30",
    description:
      "Special UGC scheme awarding 10,000 fresh scholarships annually to students holding domicile of North Eastern states enrolled in general, technical, medical, or paramedical degree courses.",
    apply_link: "https://scholarships.gov.in/",
    official_source_url: "https://scholarships.gov.in/",
    tags: ["government", "regional", "welfare", "ugc", "nsp"],
    amount: "₹8,000 / month (₹96,000 / year)",
    annual_amount_numeric: 96000,
    source_portal: "National Scholarship Portal (scholarships.gov.in)",
    verification_status: "Verified Source",
    last_verified_at: "2026-10-28",
    application_status: "Open",
    required_documents: [
      "Domicile Certificate of a North Eastern State (Assam, Meghalaya, Manipur, Mizoram, Tripura, Nagaland, Arunachal, Sikkim)",
      "Annual Family Income Certificate (≤ ₹4.5 Lakh/year)",
      "Class 12 Mark Sheet",
      "First-Year UG Admission Proof & Bonafide Certificate",
    ],
    application_steps: [
      "Log in to the National Scholarship Portal (scholarships.gov.in) using OTR credentials.",
      "Select UGC -> Ishan Uday Special Scholarship Scheme for North Eastern Region.",
      "Upload NER Domicile Certificate, Income Certificate, and College Verification Form.",
    ],
    combinable_rules:
      "Cannot be combined with any other central or state government scholarship on NSP.",
  },
  {
    id: 7,
    title: "MahaDBT Post-Matric Scholarship & Tuition Fee Waiver (Maharashtra)",
    provider: "Government of Maharashtra",
    category: "Government",
    provider_type: "State Government",
    eligible_courses: ["Bachelors", "Masters", "Diploma", "Engineering", "Medical", "MBA"],
    education_level: "Post-Matric (Diploma, UG, PG)",
    academic_years: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    eligible_states: ["Maharashtra"],
    eligible_categories: ["SC", "ST", "OBC", "EWS", "General", "Minority"],
    gender_requirement: "All",
    min_marks_percent: 50,
    income_limit: 800000,
    deadline: "2027-01-31",
    description:
      "Unified Maharashtra Direct Benefit Transfer (MahaDBT) scholarship covering Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti (EBC/SEBC/EWS) and Social Justice Post-Matric schemes.",
    apply_link: "https://mahadbt.maharashtra.gov.in/",
    official_source_url: "https://mahadbt.maharashtra.gov.in/",
    tags: ["government", "state", "maharashtra", "welfare"],
    amount: "50% to 100% Tuition & Exam Fee Waiver",
    annual_amount_numeric: 55000,
    source_portal: "MahaDBT Official Portal (mahadbt.maharashtra.gov.in)",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-04",
    application_status: "Open",
    required_documents: [
      "Maharashtra Domicile Certificate",
      "Tahsildar Income Certificate (≤ ₹8.0 Lakh/year)",
      "CAP Allotment Letter (for Engineering/Professional courses)",
      "Caste Certificate & Validity (if applying under reserved category)",
      "Previous Year Mark Sheet & Current Fee Receipt",
    ],
    application_steps: [
      "Create an Aadhaar-authenticated applicant profile on mahadbt.maharashtra.gov.in.",
      "Complete profile 100% including address, course, and past qualification details.",
      "Under 'All Schemes', select your department scheme and submit with CAP letter and income proof.",
    ],
    combinable_rules:
      "Only one government scholarship scheme may be redeemed per academic year on MahaDBT.",
  },
  {
    id: 8,
    title: "Prime Minister's Scholarship Scheme (PMSS) for CAPF & Assam Rifles",
    provider: "Welfare and Rehabilitation Board (MHA, Govt of India)",
    category: "Government",
    provider_type: "Central Government",
    eligible_courses: ["Bachelors", "Engineering", "Medical", "Dental", "MBA", "B.Ed"],
    education_level: "Professional Degree (B.Tech, MBBS, MBA, B.Ed)",
    academic_years: ["1st Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "All",
    min_marks_percent: 60,
    income_limit: 1200000,
    armed_forces_ward_only: true,
    deadline: "2026-12-20",
    description:
      "Encourages technical and professional education for dependent wards and widows of Central Armed Police Forces (CAPF), Assam Rifles, and State Police personnel.",
    apply_link: "https://scholarships.gov.in/",
    official_source_url: "https://scholarships.gov.in/",
    tags: ["government", "defence", "merit", "nsp"],
    amount: "₹36,000 / year (Girls) | ₹30,000 / year (Boys)",
    annual_amount_numeric: 36000,
    source_portal: "National Scholarship Portal (scholarships.gov.in)",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-01",
    application_status: "Open",
    required_documents: [
      "Service Certificate / Ex-Serviceman Discharge Book of CAPF/Assam Rifles Personnel",
      "Minimum 60% Marks in Minimum Entry Qualification (Class 12 / Graduation)",
      "Bonafide Certificate from Professional College",
      "Aadhaar-linked Bank Account Passbook",
    ],
    application_steps: [
      "Apply online via the National Scholarship Portal (scholarships.gov.in) under WARB, Ministry of Home Affairs.",
      "Upload Service/Force certificate and Class 12 mark sheet.",
      "Verify online through your institution and force welfare board.",
    ],
    combinable_rules:
      "Cannot be combined with other NSP central scholarships.",
  },
  {
    id: 9,
    title: "LIC Golden Jubilee Scholarship Scheme",
    provider: "Life Insurance Corporation of India (LIC)",
    category: "Government",
    provider_type: "PSU / Corporate CSR",
    eligible_courses: ["Bachelors", "Diploma", "Engineering", "Medical"],
    education_level: "UG, Diploma, Vocational Courses",
    academic_years: ["1st Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "All",
    min_marks_percent: 60,
    income_limit: 250000,
    deadline: "2026-12-25",
    description:
      "Awarded to economically weaker students who passed Class 10 or Class 12 with at least 60% marks and are pursuing higher education in Medicine, Engineering, Graduation, or Diploma courses.",
    apply_link: "https://licindia.in/golden-jubilee-scholarship-scheme",
    official_source_url: "https://licindia.in/golden-jubilee-scholarship-scheme",
    tags: ["government", "merit", "welfare", "lic"],
    amount: "₹20,000 to ₹40,000 / year",
    annual_amount_numeric: 30000,
    source_portal: "LIC India Official Portal (licindia.in)",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-03",
    application_status: "Open",
    required_documents: [
      "Class 10 / Class 12 Mark Sheet (minimum 60% marks)",
      "Family Income Certificate (≤ ₹2.5 Lakh/year)",
      "Current Year College Admission & Fee Receipt",
      "Bank Passbook / Cancelled Cheque with IFSC Code",
    ],
    application_steps: [
      "Open the official LIC India portal (licindia.in) and navigate to the Golden Jubilee Scholarship link.",
      "Complete the online application form and select your nearest LIC Divisional Office.",
      "Receive acknowledgment email and submit document copies when shortlisted by the LIC Divisional Office.",
    ],
    combinable_rules:
      "Should not be held alongside another full-tuition scholarship; check LIC Divisional Office undertaking.",
  },

  // --- PRIVATE & CORPORATE CSR SCHOLARSHIPS ---
  {
    id: 10,
    title: "Reliance Foundation Undergraduate & Postgraduate Scholarships",
    provider: "Reliance Foundation",
    category: "Private",
    provider_type: "Private Foundation",
    eligible_courses: ["Bachelors", "Masters", "Engineering", "Computer Science", "Science", "Commerce", "Arts"],
    education_level: "First-Year Undergraduate & Masters",
    academic_years: ["1st Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "All",
    min_marks_percent: 60,
    income_limit: 1500000,
    deadline: "2026-10-06",
    description:
      "Selects 5,000 undergraduate scholars (any stream, income ≤ ₹15L, preference < ₹2.5L) and 100 postgraduate scholars in STEM/AI/Computer Science based on an online aptitude test and academic merit.",
    apply_link: "https://www.reliancefoundation.org/scholarships",
    official_source_url: "https://www.reliancefoundation.org/scholarships",
    tags: ["private", "merit", "reliance", "stem"],
    amount: "Up to ₹2,00,000 (UG) / ₹6,00,000 (PG)",
    annual_amount_numeric: 50000,
    source_portal: "Reliance Foundation Official Portal",
    verification_status: "Verified Source",
    last_verified_at: "2026-10-10",
    application_status: "Closed",
    isExpired: true,
    required_documents: [
      "Class 12 Mark Sheet",
      "Bonafide Student Certificate (1st Year UG/PG)",
      "Family Income Proof",
      "Online Aptitude Test Completion",
    ],
    application_steps: [
      "Complete the eligibility questionnaire on scholarships.reliancefoundation.org.",
      "Fill in academic and personal details and upload supporting documents.",
      "Appear for the mandatory 60-minute online aptitude test.",
    ],
    combinable_rules:
      "Can be combined with other partial scholarships provided total aid does not exceed total cost of education.",
  },
  {
    id: 11,
    title: "Generation Google Scholarship (APAC / India)",
    provider: "Google",
    category: "Private",
    provider_type: "PSU / Corporate CSR",
    eligible_courses: ["Bachelors", "Masters", "Engineering", "Computer Science"],
    education_level: "Undergraduate / Masters in Computer Science",
    academic_years: ["2nd Year", "3rd Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "Female",
    min_marks_percent: 75,
    income_limit: 1500000,
    deadline: "2027-04-15",
    description:
      "Helps aspiring women in computer science excel in technology and become leaders in the field. Selected students receive $2,500 USD for the academic year based on diversity commitment, leadership, and academic record.",
    apply_link: "https://buildyourfuture.withgoogle.com/scholarships/generation-google-scholarship-apac",
    official_source_url: "https://buildyourfuture.withgoogle.com/scholarships/generation-google-scholarship-apac",
    tags: ["private", "women", "stem", "google", "computer-science"],
    amount: "$2,500 USD (~₹2,10,000)",
    annual_amount_numeric: 210000,
    source_portal: "Google Build Your Future Portal",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-01",
    application_status: "Upcoming",
    required_documents: [
      "Updated Resume / CV (highlighting technical projects, leadership, and community impact)",
      "Academic Transcripts from Current & Prior Institutions (PDF)",
      "Two Short-Answer Essays (400 words each on leadership & overcoming technical challenges)",
    ],
    application_steps: [
      "Monitor the Google Build Your Future portal for the APAC application window opening.",
      "Submit your resume, academic transcripts, and responses to the two essay prompts.",
      "Complete the Google online coding/technical challenge if invited.",
    ],
    combinable_rules:
      "Awarded directly to the student for tuition, fees, books, supplies, and equipment; generally combinable with institutional aid.",
  },
  {
    id: 12,
    title: "Tata Capital Pankh Scholarship Program 2026-27",
    provider: "Tata Capital Limited",
    category: "Private",
    provider_type: "PSU / Corporate CSR",
    eligible_courses: ["Bachelors", "Diploma", "Engineering", "Medical", "Commerce", "Arts", "Science"],
    education_level: "Class 11-12, Diploma, General & Professional UG",
    academic_years: ["1st Year", "2nd Year", "3rd Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "All",
    min_marks_percent: 60,
    income_limit: 250000,
    deadline: "2026-12-20",
    description:
      "CSR initiative of Tata Capital supporting economically weaker students who scored at least 60% in their preceding exam, covering up to 80% of tuition fees (from ₹10,000 to ₹1,00,000 depending on degree stream).",
    apply_link: "https://www.buddy4study.com/page/tata-capital-pankh-scholarship-programme",
    official_source_url: "https://www.buddy4study.com/page/tata-capital-pankh-scholarship-programme",
    tags: ["private", "tata", "welfare", "need-based", "new"],
    amount: "Up to 80% of Tuition Fees (₹10,000 to ₹1,00,000)",
    annual_amount_numeric: 50000,
    source_portal: "Tata Capital & Buddy4Study",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-04",
    application_status: "Open",
    isNew: true,
    publishedAt: "2026-10-12",
    required_documents: [
      "Previous Academic Year Mark Sheet (minimum 60% marks)",
      "Government-issued Income Certificate (≤ ₹2.5 Lakh/year)",
      "Current Year Admission Proof & College Fee Receipt",
      "Student Bank Account Passbook & Photograph",
    ],
    application_steps: [
      "Visit the official Tata Capital Pankh Scholarship page on Buddy4Study.",
      "Select your category (General Graduation / Professional Engineering & Medical / Diploma).",
      "Fill in the online form, upload mark sheets and fee receipts, and complete the telephonic interview if shortlisted.",
    ],
    combinable_rules:
      "Can be used alongside partial state fee concessions provided total reimbursement does not exceed 100% of annual tuition fees.",
  },
  {
    id: 13,
    title: "Infosys Foundation STEM Stars Scholarship",
    provider: "Infosys Foundation",
    category: "Private",
    provider_type: "Private Foundation",
    eligible_courses: ["Bachelors", "Engineering", "Medical", "Science"],
    education_level: "First-Year B.Tech / MBBS / Integrated M.Sc (NIRF Top Institutions)",
    academic_years: ["1st Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "Female",
    min_marks_percent: 75,
    income_limit: 800000,
    deadline: "2026-10-25",
    description:
      "Four-year comprehensive scholarship covering tuition, living expenses, and study materials up to ₹1,00,000 per annum for first-year female students enrolled in NIRF-accredited STEM colleges.",
    apply_link: "https://www.infosys.com/infosys-foundation/initiatives/education/stem-stars.html",
    official_source_url: "https://www.infosys.com/infosys-foundation/initiatives/education/stem-stars.html",
    tags: ["private", "women", "stem", "infosys"],
    amount: "Up to ₹1,00,000 / year for 4 years",
    annual_amount_numeric: 100000,
    source_portal: "Infosys Foundation Official Portal",
    verification_status: "Verified Source",
    last_verified_at: "2026-10-26",
    application_status: "Closed",
    isExpired: true,
    required_documents: [
      "Class 12 Mark Sheet & JEE / NEET / CET Rank Card",
      "NIRF-ranked College Admission Letter & Fee Structure",
      "Family Income Certificate (≤ ₹8.0 Lakh/year)",
      "Bank Account Passbook & Identity Proof",
    ],
    application_steps: [
      "Verify that your admitted institution is on the Infosys STEM Stars NIRF list.",
      "Submit your academic transcripts, JEE/NEET rank card, and fee receipts on the Infosys Foundation portal.",
    ],
    combinable_rules:
      "Reimburses actual receipts for tuition, hostel, and books up to ₹1 Lakh/year.",
  },
  {
    id: 14,
    title: "HDFC Bank Parivartan's ECSS Programme 2026-27",
    provider: "HDFC Bank CSR",
    category: "Private",
    provider_type: "PSU / Corporate CSR",
    eligible_courses: ["Bachelors", "Masters", "Diploma", "Engineering", "Medical", "MBA"],
    education_level: "Undergraduate & Postgraduate (General & Professional)",
    academic_years: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "All",
    min_marks_percent: 55,
    income_limit: 250000,
    deadline: "2026-12-30",
    description:
      "Educational Crisis Support Scholarship (ECSS) by HDFC Bank supporting meritorious and needy students (≥ 55% marks, income ≤ ₹2.5L) or families facing personal/economic crises to prevent dropouts.",
    apply_link: "https://www.buddy4study.com/page/hdfc-bank-parivartan-ecss-programme",
    official_source_url: "https://www.buddy4study.com/page/hdfc-bank-parivartan-ecss-programme",
    tags: ["private", "hdfc", "merit", "welfare", "need-based"],
    amount: "Up to ₹75,000 / year",
    annual_amount_numeric: 75000,
    source_portal: "HDFC Bank Parivartan & Buddy4Study",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-05",
    application_status: "Open",
    required_documents: [
      "Previous Year Mark Sheet (minimum 55% marks)",
      "Income Proof (≤ ₹2.5 Lakh/year) & Crisis Proof (if applicable)",
      "Current Academic Year Fee Receipt / Admission Letter",
      "Bank Passbook & Passport Photograph",
    ],
    application_steps: [
      "Select the appropriate ECSS track (UG General, UG Professional, or PG) on the portal.",
      "Upload previous year mark sheet, income proof, and current year fee demand letter.",
      "Attend the telephonic verification round conducted by the selection panel.",
    ],
    combinable_rules:
      "Can be combined with partial aid if total financial support does not exceed annual college fee liability.",
  },
  {
    id: 15,
    title: "Amazon Future Engineer Scholarship India",
    provider: "Amazon India (with Foundation for Excellence)",
    category: "Private",
    provider_type: "PSU / Corporate CSR",
    eligible_courses: ["Bachelors", "Engineering", "Computer Science"],
    education_level: "First-Year B.Tech / B.E. in CS, IT, AI, or Allied Branches",
    academic_years: ["1st Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "Female",
    min_marks_percent: 70,
    income_limit: 300000,
    deadline: "2026-12-31",
    description:
      "Provides female first-year Computer Science/IT engineering students ₹50,000/year for 4 years, a laptop in the first year, technical bootcamps, Amazon engineer mentorship, and internship interview opportunities.",
    apply_link: "https://www.amazonfutureengineer.in/scholarship",
    official_source_url: "https://www.amazonfutureengineer.in/scholarship",
    tags: ["private", "amazon", "women", "stem", "computer-science"],
    amount: "₹50,000 / year + Laptop + Amazon Mentorship",
    annual_amount_numeric: 50000,
    source_portal: "Amazon Future Engineer India & FFE Portal",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-05",
    application_status: "Open",
    required_documents: [
      "Class 12 Mark Sheet & State/JEE Engineering Entrance Rank Certificate",
      "First-Year B.Tech/B.E. (CS/IT) Admission Allotment Letter",
      "Family Income Certificate (≤ ₹3.0 Lakh/year)",
      "College Bonafide & Fee Structure Certificate",
      "Bank Account Passbook",
    ],
    application_steps: [
      "Visit amazonfutureengineer.in/scholarship and click Apply via Foundation for Excellence (FFE).",
      "Submit your JEE/State CET rank details, Class 12 marks, and family income proof.",
      "Complete the FFE facilitator verification interview with a parent/guardian.",
    ],
    combinable_rules:
      "Managed via Foundation for Excellence (FFE); can complement state tuition waivers to cover hostel, laptop, and academic expenses.",
  },
  {
    id: 16,
    title: "Siemens Scholarship Program for First-Year Government Engineering Students",
    provider: "Siemens India",
    category: "Private",
    provider_type: "PSU / Corporate CSR",
    eligible_courses: ["Bachelors", "Engineering"],
    education_level: "First-Year B.Tech / B.E. (Government Engineering Colleges)",
    academic_years: ["1st Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "All",
    min_marks_percent: 60,
    income_limit: 200000,
    deadline: "2027-01-15",
    description:
      "Supports deserving first-year students at government engineering colleges across India (Mechanical, Electrical, Electronics, CS/IT, Instrumentation) with tuition reimbursement, allowances, holistic training, and Siemens internships.",
    apply_link: "https://www.siemens.com/in/en/company/sustainability/corporate-citizenship/siemens-scholarship-program.html",
    official_source_url: "https://www.siemens.com/in/en/company/sustainability/corporate-citizenship/siemens-scholarship-program.html",
    tags: ["private", "stem", "merit", "siemens", "engineering"],
    amount: "Tuition Reimbursement + Allowances + Siemens Internship",
    annual_amount_numeric: 85000,
    source_portal: "Siemens India Official Portal",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-02",
    application_status: "Open",
    required_documents: [
      "Class 10 & Class 12 Mark Sheets (minimum 60% aggregate & 60% PCM)",
      "Government Engineering College Admission Proof (First Year)",
      "Annual Family Income Certificate (≤ ₹2.0 Lakh/year)",
      "Age Proof (up to 20 years of age)",
    ],
    application_steps: [
      "Open the Siemens Scholarship application form on the official Siemens India website.",
      "Fill in your Government Engineering College details, Class 10/12 PCM scores, and family income.",
      "Shortlisted candidates undergo online assessment and personal interview with Siemens mentors.",
    ],
    combinable_rules:
      "Reimburses balance tuition fees after deducting any state government freeship/concession.",
  },
  {
    id: 17,
    title: "Kotak Kanya Scholarship 2026-27",
    provider: "Kotak Education Foundation",
    category: "Private",
    provider_type: "Private Foundation",
    eligible_courses: ["Bachelors", "Engineering", "Medical", "Law", "Architecture"],
    education_level: "First-Year Professional Graduation (NIRF/NAAC Accredited)",
    academic_years: ["1st Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "Female",
    min_marks_percent: 75,
    income_limit: 600000,
    deadline: "2026-11-30",
    description:
      "Empowers meritorious girl students (≥ 75% in Class 12, family income ≤ ₹6.0 Lakh) pursuing professional graduation courses (Engineering, MBBS, Integrated Law, Architecture, Design) at accredited institutes.",
    apply_link: "https://www.buddy4study.com/page/kotak-kanya-scholarship",
    official_source_url: "https://www.buddy4study.com/page/kotak-kanya-scholarship",
    tags: ["private", "women", "merit", "kotak"],
    amount: "₹1,50,000 / year",
    annual_amount_numeric: 150000,
    source_portal: "Kotak Education Foundation & Buddy4Study",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-03",
    application_status: "Open",
    required_documents: [
      "Class 12 Mark Sheet (≥ 75% marks)",
      "First-Year Professional Degree Admission Letter & Fee Structure",
      "Family Income Certificate & ITR / Salary Slip (≤ ₹6.0 Lakh/year)",
      "Bonafide Student Certificate",
    ],
    application_steps: [
      "Apply online via the Kotak Kanya Scholarship page on Buddy4Study.",
      "Upload Class 12 mark sheet, entrance rank card, and family income proof.",
      "Complete two rounds of video/telephonic interviews if shortlisted.",
    ],
    combinable_rules:
      "Covers tuition, hostel, internet, and laptop expenses against valid receipts.",
  },
  {
    id: 18,
    title: "ONGC Foundation Scholarship for Meritorious Students",
    provider: "ONGC Foundation",
    category: "Private",
    provider_type: "PSU / Corporate CSR",
    eligible_courses: ["Bachelors", "Masters", "Engineering", "Medical", "MBA", "Science"],
    education_level: "First-Year B.Tech, MBBS, MBA, or M.Sc Geology/Geophysics",
    academic_years: ["1st Year"],
    eligible_states: ["All India"],
    eligible_categories: ["SC", "ST", "OBC", "General", "EWS"],
    gender_requirement: "All",
    min_marks_percent: 60,
    income_limit: 200000,
    deadline: "2026-12-10",
    description:
      "Awards 2,000 scholarships annually (1,000 SC/ST, 500 OBC, 500 General-EWS; 50% reserved for girls) of ₹48,000/year to first-year Engineering, MBBS, MBA, and Geology/Geophysics Master's students.",
    apply_link: "https://ongcscholar.org/",
    official_source_url: "https://ongcscholar.org/",
    tags: ["private", "welfare", "merit", "ongc", "psu"],
    amount: "₹48,000 / year",
    annual_amount_numeric: 48000,
    source_portal: "ONGC Scholar Official Portal (ongcscholar.org)",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-04",
    application_status: "Open",
    required_documents: [
      "Class 12 Mark Sheet (for Engineering/MBBS) or UG Mark Sheet (for MBA/M.Sc) with ≥ 60% marks",
      "Caste / EWS Certificate",
      "Annual Family Income Certificate (≤ ₹2.0 Lakh/year; ≤ ₹4.5 Lakh for SC/ST in select zones)",
      "PAN Card & Bank ECS Mandate Form certified by Bank",
      "College Undertaking & Bonafide Certificate",
    ],
    application_steps: [
      "Visit ongcscholar.org and select your category (SC/ST, OBC, or General-EWS).",
      "Complete the online application and download the generated hard-copy summary.",
      "Send the college-endorsed form to the designated ONGC zonal office as specified on the portal.",
    ],
    combinable_rules:
      "Students must not be availing any other scholarship or financial aid from any other source.",
  },
  {
    id: 19,
    title: "SBI Platinum Jubilee Asha Scholarship Program 2026-27",
    provider: "SBI Foundation",
    category: "Private",
    provider_type: "PSU / Corporate CSR",
    eligible_courses: ["Bachelors", "Masters", "Engineering", "Medical", "MBA"],
    education_level: "Undergraduate, Postgraduate, IIT, IIM & Medical",
    academic_years: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "All",
    min_marks_percent: 75,
    income_limit: 600000,
    deadline: "2026-11-25",
    description:
      "Flagship education initiative by SBI Foundation providing financial grants from ₹50,000 up to ₹7,50,000 per year to meritorious students from low-income families studying at premier colleges, IITs, IIMs, and medical institutions.",
    apply_link: "https://www.sbifoundation.in/asha-scholarship",
    official_source_url: "https://www.sbifoundation.in/asha-scholarship",
    tags: ["private", "sbi", "merit", "welfare", "new"],
    amount: "₹50,000 to ₹7,50,000 / year",
    annual_amount_numeric: 70000,
    source_portal: "SBI Foundation Official Portal",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-05",
    application_status: "Open",
    isNew: true,
    publishedAt: "2026-10-18",
    required_documents: [
      "Previous Academic Year Mark Sheet (≥ 75% marks or ≥ 7.0 CGPA)",
      "Family Income Certificate (≤ ₹3.0L for School, ≤ ₹6.0L for College/UG/PG)",
      "Current Year Fee Receipt & Admission Letter",
      "Student/Parent Bank Account Details & Caste Certificate (50% slots reserved for SC/ST)",
    ],
    application_steps: [
      "Visit sbifoundation.in/asha-scholarship and select your education track (UG, PG, Medical, IIT, or IIM).",
      "Fill in academic scores, NIRF college details, and upload income and fee receipts.",
      "Complete telephonic verification and document audit.",
    ],
    combinable_rules:
      "Up to 50% of slots are reserved for SC/ST students and 50% for female applicants.",
  },
  {
    id: 20,
    title: "Federal Bank Hormis Memorial Foundation Scholarship 2026-27",
    provider: "Federal Bank CSR",
    category: "Private",
    provider_type: "PSU / Corporate CSR",
    eligible_courses: ["Bachelors", "Engineering", "Medical", "Nursing", "MBA", "Agriculture"],
    education_level: "First-Year MBBS, B.Tech, B.Sc Nursing, B.Sc Agriculture, MBA",
    academic_years: ["1st Year"],
    eligible_states: ["Kerala", "Tamil Nadu", "Karnataka", "Maharashtra", "Gujarat", "Punjab"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "All",
    min_marks_percent: 70,
    income_limit: 300000,
    deadline: "2026-12-18",
    description:
      "Reimburses 100% of tuition fees and reasonable academic expenses up to ₹1,00,000/year (plus one laptop/PC allowance) for first-year students admitted on merit in MBBS, Engineering, Nursing, Agriculture, and MBA.",
    apply_link: "https://www.federalbank.co.in/corporate-social-responsibility",
    official_source_url: "https://www.federalbank.co.in/corporate-social-responsibility",
    tags: ["private", "banking", "merit", "stem", "medical", "new"],
    amount: "100% Tuition & Academic Fee Reimbursement (up to ₹1,00,000/yr)",
    annual_amount_numeric: 100000,
    source_portal: "Federal Bank CSR Official Portal",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-04",
    application_status: "Open",
    isNew: true,
    publishedAt: "2026-10-22",
    required_documents: [
      "Admission Memo / Allotment Letter in Government or Aided Merit Quota",
      "Class 12 / Qualifying Exam Mark Sheet",
      "Family Income Certificate issued by Village Officer / Tehsildar (≤ ₹3.0 Lakh/year)",
      "Course Fee Structure issued by College Principal",
    ],
    application_steps: [
      "Access the Hormis Memorial Scholarship portal via federalbank.co.in/corporate-social-responsibility.",
      "Submit your merit quota allotment letter, mark sheet, and income certificate.",
      "Attend the personal interview at the designated Federal Bank regional office.",
    ],
    combinable_rules:
      "Reimburses actual tuition and books/laptop bills not covered by other state concessions.",
  },
  {
    id: 21,
    title: "Sitaram Jindal Foundation Scholarship Scheme",
    provider: "Sitaram Jindal Foundation",
    category: "Private",
    provider_type: "Private Foundation",
    eligible_courses: ["Bachelors", "Masters", "Diploma", "Engineering", "Medical"],
    education_level: "Class 11-12, ITI, Diploma, UG, PG, Engineering & Medicine",
    academic_years: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    eligible_states: ["All India"],
    eligible_categories: ["All", "General", "OBC", "SC", "ST", "EWS"],
    gender_requirement: "All",
    min_marks_percent: 60,
    income_limit: 400000,
    deadline: "2027-02-28",
    description:
      "Year-round merit-cum-means scholarship offering monthly stipends from ₹1,000 to ₹3,200/month for students pursuing general graduation, polytechnic diploma, engineering, and medical courses.",
    apply_link: "https://www.sitaramjindalfoundation.org/scholarships-for-students-in-bangalore.php",
    official_source_url: "https://www.sitaramjindalfoundation.org/",
    tags: ["private", "merit", "welfare", "diploma", "engineering"],
    amount: "Up to ₹3,200 / month (₹38,400 / year)",
    annual_amount_numeric: 38400,
    source_portal: "Sitaram Jindal Foundation Official Portal",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-01",
    application_status: "Open",
    required_documents: [
      "Previous Examination Mark Sheet (≥ 60% for Boys, ≥ 55% for Girls)",
      "Income Certificate / BPL Card (≤ ₹4.0 Lakh/year for salaried, ≤ ₹2.5 Lakh for others)",
      "Certificate from College Principal regarding current fees and other scholarships",
      "Hostel Warden Certificate (if claiming hosteller enhanced stipend)",
    ],
    application_steps: [
      "Download the prescribed Annexure application form from sitaramjindalfoundation.org.",
      "Have the form endorsed and stamped by your College Principal.",
      "Submit the completed application with attested documents to the Sitaram Jindal Foundation office.",
    ],
    combinable_rules:
      "Students must declare any other scholarship received on the Principal's endorsement form.",
  },
  {
    id: 22,
    title: "Karnataka State Post-Matric Scholarship Portal (SSP)",
    provider: "Government of Karnataka",
    category: "Government",
    provider_type: "State Government",
    eligible_courses: ["Bachelors", "Masters", "Diploma", "Engineering", "Medical"],
    education_level: "Post-Matric (PU, Diploma, UG, PG, Engineering, Medical)",
    academic_years: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    eligible_states: ["Karnataka"],
    eligible_categories: ["SC", "ST", "OBC", "Minority", "EWS"],
    gender_requirement: "All",
    min_marks_percent: 50,
    income_limit: 250000,
    deadline: "2027-01-20",
    description:
      "Unified Karnataka State Scholarship Portal (SSP) providing fee reimbursement, Vidyasiri food & accommodation stipends, and maintenance allowances for Karnataka domicile students.",
    apply_link: "https://ssp.postmatric.karnataka.gov.in/",
    official_source_url: "https://ssp.postmatric.karnataka.gov.in/",
    tags: ["government", "state", "karnataka", "welfare"],
    amount: "Tuition Fee Reimbursement + Vidyasiri Stipend (₹15,000/yr)",
    annual_amount_numeric: 40000,
    source_portal: "Karnataka SSP Official Portal (ssp.postmatric.karnataka.gov.in)",
    verification_status: "Verified Source",
    last_verified_at: "2026-11-03",
    application_status: "Open",
    required_documents: [
      "Karnataka Caste & Income Certificate (RD Number starting with RD00...)",
      "SATS ID / University Registration Number",
      "College Fee Receipt & Hostel Certificate (for Vidyasiri)",
      "e-Attestation ID for UG/PG documents (where required)",
    ],
    application_steps: [
      "Create an account on ssp.postmatric.karnataka.gov.in using Aadhaar authentication.",
      "Enter your Caste and Income Certificate RD number and college registration number.",
      "Complete e-Attestation with your college nodal officer and submit the application.",
    ],
    combinable_rules:
      "Cannot claim duplicate maintenance allowance from both NSP and SSP concurrently.",
  },
];

function normalizeScholarshipRecord(item: RawScholarshipInput): Scholarship {
  const numericAmount =
    typeof item.amount === "number"
      ? item.amount
      : item.annual_amount_numeric ??
        (parseInt(String(item.amount).replace(/[^0-9]/g, ""), 10) || 50000);

  return {
    ...item,
    amount: numericAmount,
    amount_label:
      typeof item.amount === "string"
        ? item.amount
        : `₹${numericAmount.toLocaleString("en-IN")} / year`,
    annual_amount_numeric: numericAmount,
    link: item.link || item.apply_link,
    region:
      item.region ||
      (item.eligible_states && item.eligible_states.length > 0
        ? item.eligible_states.join(", ")
        : "All India"),
    eligible_categories:
      item.eligible_categories && item.eligible_categories.length > 0
        ? item.eligible_categories
        : ["General", "OBC", "SC", "ST", "EWS"],
    level: item.level || item.education_level || "Undergraduate / Postgraduate",
    field_of_study:
      item.field_of_study ||
      (item.eligible_courses && item.eligible_courses.length > 0
        ? item.eligible_courses.join(", ")
        : "All Streams"),
    eligibility: item.eligibility || {
      description: item.description,
      minMarks: item.min_marks_percent,
      maxIncome: item.income_limit,
    },
  };
}

export const rawInitialScholarships: Scholarship[] = rawScholarshipInputs.map(
  normalizeScholarshipRecord
);

// Keep empty replacementScholarships export for backwards compatibility without fabricating cycles
export const replacementScholarships: Record<number, Scholarship> = {};
export const newlyPublishedScholarships: Scholarship[] = rawInitialScholarships.filter(
  (s) => s.isNew
);

/**
 * Evaluates scholarships against the current date WITHOUT fabricating replacement deadlines:
 * - Automatically marks scholarships whose verified deadlines have passed as 'Closed' and `isExpired: true`.
 * - Preserves expired scholarships in a historical archive without falsely marking them active.
 */
export function updateScholarshipCatalog(
  existingScholarships: Array<Scholarship | RawScholarshipInput> = rawInitialScholarships,
  referenceDateStr?: string
): {
  activeScholarships: Scholarship[];
  expiredScholarships: ExpiredScholarshipRecord[];
  newlyPublishedCount: number;
  replacedCount: number;
} {
  const todayStr =
    referenceDateStr ||
    (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`;
    })();

  const expiredRecords: ExpiredScholarshipRecord[] = [];
  const activeScholarships: Scholarship[] = [];

  for (const rawItem of existingScholarships) {
    const item = normalizeScholarshipRecord(rawItem);
    const isPastDeadline = item.deadline < todayStr;
    if (isPastDeadline || item.application_status === "Closed") {
      expiredRecords.push({
        expiredId: item.id,
        expiredTitle: item.title,
        provider: item.provider,
        originalDeadline: item.deadline,
        category: item.category,
        retiredOn: item.deadline,
        reason: `Verified deadline (${item.deadline}) has passed. Preserved in historical archive pending official provider announcement of the next cycle.`,
      });
    } else {
      activeScholarships.push({
        ...item,
        isExpired: false,
        application_status: item.application_status || "Open",
      });
    }
  }

  activeScholarships.sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  const newlyPublishedCount = activeScholarships.filter((s) => s.isNew).length;

  return {
    activeScholarships,
    expiredScholarships: expiredRecords,
    newlyPublishedCount,
    replacedCount: expiredRecords.length,
  };
}

const defaultCatalog = updateScholarshipCatalog(rawInitialScholarships, "2026-11-07");
export const sampleScholarships: Scholarship[] = defaultCatalog.activeScholarships;
export const scholarships: Scholarship[] = sampleScholarships;
export const initialExpiredScholarships: ExpiredScholarshipRecord[] =
  defaultCatalog.expiredScholarships;

export const yearlyApplicationStats = [
  {
    year: "2023",
    Government: 110,
    "Corporate CSR": 150,
    "AICTE / Technical": 95,
    "State Portals": 80,
  },
  {
    year: "2024",
    Government: 135,
    "Corporate CSR": 185,
    "AICTE / Technical": 115,
    "State Portals": 105,
  },
  {
    year: "2025",
    Government: 160,
    "Corporate CSR": 215,
    "AICTE / Technical": 140,
    "State Portals": 130,
  },
  {
    year: "2026",
    Government: 190,
    "Corporate CSR": 250,
    "AICTE / Technical": 165,
    "State Portals": 155,
  },
];

export const topProviders = [
  { name: "National Scholarship Portal (NSP)", amount: "Central & Ministry Schemes", initial: "NS" },
  { name: "AICTE Pragati & Saksham", amount: "₹50,000 / year Technical Aid", initial: "AI" },
  { name: "State Portals (ePASS, MahaDBT, SSP)", amount: "100% Tuition Reimbursement", initial: "SP" },
  { name: "Corporate CSR (Tata, HDFC, SBI, Siemens)", amount: "₹50,000 – ₹2,00,000 / year", initial: "CS" },
];
