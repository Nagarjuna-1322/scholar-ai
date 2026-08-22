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
    provider: "Government",
    eligible_courses: ["Bachelors", "Masters"],
    income_limit: 500000,
    deadline: "2026-03-31",
    description:
      "For meritorious students in undergraduate and postgraduate programs.",
    apply_link: "#",
    tags: ["merit", "government"],
  },
  {
    id: 2,
    title: "STEM Future Grant",
    provider: "Private Tech Foundation",
    eligible_courses: ["Bachelors", "PhD"],
    income_limit: 1000000,
    deadline: "2026-05-15",
    description: "Support for STEM students pursuing research or degrees.",
    apply_link: "#",
    tags: ["stem", "private"],
  },
  {
    id: 3,
    title: "Women in Tech Scholarship",
    provider: "WomenEd",
    eligible_courses: ["Bachelors", "Masters", "Certificate"],
    income_limit: 800000,
    deadline: "2026-02-20",
    description: "Encouraging women to join tech-related degrees.",
    apply_link: "#",
    tags: ["women", "private"],
  },
  {
    id: 4,
    title: "State Welfare Scholarship",
    provider: "State Govt",
    eligible_courses: ["Bachelors"],
    income_limit: 200000,
    deadline: "2026-01-31",
    description: "For students from low-income households in the state.",
    apply_link: "#",
    tags: ["welfare", "government"],
  },
  {
    id: 5,
    title: "Arts & Humanities Fund",
    provider: "Cultural Council",
    eligible_courses: ["Masters"],
    income_limit: 600000,
    deadline: "2026-04-30",
    description: "Funding for students in creative fields and humanities.",
    apply_link: "#",
    tags: ["arts", "humanities", "private"],
  },
  {
    id: 6,
    title: "Future Leaders Scholarship",
    provider: "Global Entrepreneurs Org",
    eligible_courses: ["Bachelors", "Masters"],
    income_limit: 1200000,
    deadline: "2026-06-01",
    description: "For students demonstrating leadership potential and entrepreneurial spirit.",
    apply_link: "#",
    tags: ["leadership", "business", "private"],
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
