export type Scholarship = {
  id: number;
  title: string;
  provider: string;
  eligible_courses: string[];
  income_limit: number;
  deadline: string;
  description: string;
  apply_link: string;
  tags: string[];
};

export const sampleScholarships: Scholarship[] = [
  {
    id: 1,
    title: "National Merit Scholarship",
    provider: "National Scholarship Portal (Govt)",
    eligible_courses: ["Bachelors", "Masters"],
    income_limit: 500000,
    deadline: "2026-03-31",
    description:
      "Official central government scholarship for meritorious students in undergraduate and postgraduate programs across India.",
    apply_link: "https://scholarships.gov.in/",
    tags: ["merit", "government"],
  },
  {
    id: 2,
    title: "Reliance Foundation Undergraduate Scholarships",
    provider: "Reliance Foundation",
    eligible_courses: ["Bachelors"],
    income_limit: 1500000,
    deadline: "2026-10-15",
    description: "Reliance Foundation scholarships support bright students pursuing first-year undergraduate degrees in any stream with grants up to ₹2,00,000.",
    apply_link: "https://www.reliancefoundation.org/scholarships",
    tags: ["stem", "private", "merit", "reliance"],
  },
  {
    id: 3,
    title: "Google Generation Scholarship (APAC)",
    provider: "Google / Alphabet",
    eligible_courses: ["Bachelors", "Masters"],
    income_limit: 1200000,
    deadline: "2026-12-15",
    description: "Awarded to women studying computer science and technology to help them excel in technology and become active leaders in the field.",
    apply_link: "https://buildyourfuture.withgoogle.com/scholarships/generation-google-scholarship-apac",
    tags: ["women", "private", "stem", "google"],
  },
  {
    id: 4,
    title: "Tata Capital Pankh Scholarship Program",
    provider: "Tata Capital",
    eligible_courses: ["Bachelors", "Diploma", "Certificate"],
    income_limit: 400000,
    deadline: "2026-11-30",
    description: "Tata Capital initiative on Buddy4Study offering financial support up to ₹12,000 to students from economically weaker sections.",
    apply_link: "https://www.buddy4study.com/page/tata-capital-pankh-scholarship-programme",
    tags: ["tata", "private", "welfare"],
  },
  {
    id: 5,
    title: "Infosys Foundation STEM Stars Scholarship",
    provider: "Infosys Foundation",
    eligible_courses: ["Bachelors", "Masters"],
    income_limit: 800000,
    deadline: "2026-09-30",
    description: "Infosys Foundation initiative empowering female students enrolled in premier STEM institutions (Engineering, Medical, Science) with full tuition coverage.",
    apply_link: "https://www.infosys.com/infosys-foundation/initiatives/education/stem-stars.html",
    tags: ["women", "stem", "private", "infosys"],
  },
  {
    id: 6,
    title: "HDFC Bank Parivartan's ECSS Programme",
    provider: "HDFC Bank",
    eligible_courses: ["Bachelors", "Masters", "Diploma"],
    income_limit: 600000,
    deadline: "2026-08-31",
    description: "Supporting meritorious and needy students from disadvantaged backgrounds with education assistance up to ₹75,000.",
    apply_link: "https://www.buddy4study.com/page/hdfc-bank-parivartan-ecss-programme",
    tags: ["hdfc", "merit", "private", "welfare"],
  },
  {
    id: 7,
    title: "Amazon Future Engineer Scholarship",
    provider: "Amazon India",
    eligible_courses: ["Bachelors"],
    income_limit: 300000,
    deadline: "2026-10-31",
    description: "Financial assistance of ₹50,000/year, mentorship from Amazon leaders, and paid software engineering internship opportunities for female students.",
    apply_link: "https://www.amazonfutureengineer.in/scholarship",
    tags: ["amazon", "women", "stem", "private"],
  },
  {
    id: 8,
    title: "Adobe India Women-in-Technology Scholarship",
    provider: "Adobe Systems",
    eligible_courses: ["Bachelors", "Masters"],
    income_limit: 1200000,
    deadline: "2026-11-20",
    description: "Recognizing outstanding female undergraduate and masters students in computer science with tuition support and direct Adobe internship opportunities.",
    apply_link: "https://www.adobe.com/careers/university/india-women-in-technology.html",
    tags: ["adobe", "women", "stem", "private"],
  },
  {
    id: 9,
    title: "State Post-Matric Welfare Scholarship",
    provider: "State Social Welfare Dept",
    eligible_courses: ["Bachelors", "Masters", "PhD", "Diploma"],
    income_limit: 250000,
    deadline: "2026-05-31",
    description: "Comprehensive state government financial assistance covering college tuition and maintenance allowance for eligible students.",
    apply_link: "https://scholarships.gov.in/",
    tags: ["welfare", "government"],
  },
];

export const yearlyApplicationStats = [
  {
    year: "2022",
    "Government": 80,
    "Tech Foundation": 120,
    "WomenEd": 90,
  },
  {
    year: "2023",
    "Government": 110,
    "Tech Foundation": 150,
    "WomenEd": 100,
    "State Govt": 40,
  },
  {
    year: "2024",
    "Government": 130,
    "Tech Foundation": 180,
    "WomenEd": 120,
    "State Govt": 60,
    "Cultural Council": 90,
  },
  {
    year: "2025",
    "Government": 150,
    "Tech Foundation": 210,
    "WomenEd": 140,
    "State Govt": 70,
    "Cultural Council": 110,
    "Entrepreneurs Org": 100,
  },
];

export const topProviders = [
  { name: "Private Tech Foundation", amount: "₹1,50,00,000", initial: "TF" },
  { name: "Global Entrepreneurs Org", amount: "₹1,20,00,000", initial: "GE" },
  { name: "Government", amount: "₹95,00,000", initial: "GO" },
  { name: "WomenEd", amount: "₹80,00,000", initial: "WE" },
];
