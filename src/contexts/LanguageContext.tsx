"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type SupportedLanguage = "en" | "hi" | "te";

type TranslationKeys =
  | "nav.dashboard"
  | "nav.chatbot"
  | "nav.aiMatcher"
  | "nav.recommendations"
  | "nav.tracker"
  | "nav.documents"
  | "nav.compare"
  | "nav.planner"
  | "nav.profile"
  | "dashboard.greeting"
  | "dashboard.subtitle"
  | "dashboard.profileCompletion"
  | "dashboard.eligibleCount"
  | "dashboard.possiblyEligibleCount"
  | "dashboard.savedScholarships"
  | "dashboard.activeApplications"
  | "dashboard.upcomingDeadlines"
  | "dashboard.searchPlaceholder"
  | "status.eligible"
  | "status.possiblyEligible"
  | "status.notEligible"
  | "card.compatibilityScore"
  | "card.viewDetails"
  | "card.compare"
  | "card.save"
  | "safety.noFeeWarning";

const translations: Record<SupportedLanguage, Record<TranslationKeys, string>> = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.chatbot": "AI Chatbot",
    "nav.aiMatcher": "Check My Eligibility",
    "nav.recommendations": "Recommended for You",
    "nav.tracker": "My Applications",
    "nav.documents": "Upload Resume / Docs",
    "nav.compare": "Compare Scholarships",
    "nav.planner": "Fee & Aid Calculator",
    "nav.profile": "My Profile",
    "dashboard.greeting": "Welcome",
    "dashboard.subtitle": "Find verified Government & Private scholarships matched to your profile.",
    "dashboard.profileCompletion": "Profile Completion",
    "dashboard.eligibleCount": "Eligible for You",
    "dashboard.possiblyEligibleCount": "May Be Eligible",
    "dashboard.savedScholarships": "Saved by You",
    "dashboard.activeApplications": "My Applications",
    "dashboard.upcomingDeadlines": "Closing Soon",
    "dashboard.searchPlaceholder": "Search scholarships by name, state (e.g. Telangana), course, NSP, AICTE...",
    "status.eligible": "Eligible",
    "status.possiblyEligible": "May Be Eligible",
    "status.notEligible": "Not Eligible",
    "card.compatibilityScore": "Match Score",
    "card.viewDetails": "View Details & How to Apply",
    "card.compare": "Compare",
    "card.save": "Save",
    "safety.noFeeWarning": "Genuine scholarships are 100% free to apply — never pay any application fee.",
  },
  hi: {
    "nav.dashboard": "डैशबोर्ड",
    "nav.chatbot": "AI चैटबॉट",
    "nav.aiMatcher": "पात्रता जाँचें",
    "nav.recommendations": "आपके लिए सुझाव",
    "nav.tracker": "मेरे आवेदन",
    "nav.documents": "दस्तावेज़ अपलोड",
    "nav.compare": "तुलना करें",
    "nav.planner": "फीस और सहायता कैलकुलेटर",
    "nav.profile": "मेरी प्रोफ़ाइल",
    "dashboard.greeting": "स्वागत है",
    "dashboard.subtitle": "आपकी पढ़ाई और प्रोफ़ाइल के अनुसार सत्यापित सरकारी और प्राइवेट छात्रवृत्तियाँ।",
    "dashboard.profileCompletion": "प्रोफ़ाइल पूर्णता",
    "dashboard.eligibleCount": "आपके लिए पात्र",
    "dashboard.possiblyEligibleCount": "संभावित पात्र",
    "dashboard.savedScholarships": "सहेजी गई छात्रवृत्तियाँ",
    "dashboard.activeApplications": "मेरे आवेदन",
    "dashboard.upcomingDeadlines": "जल्द बंद होने वाली",
    "dashboard.searchPlaceholder": "छात्रवृत्ति का नाम, राज्य (जैसे तेलंगाना), कोर्स खोजें...",
    "status.eligible": "पात्र (Eligible)",
    "status.possiblyEligible": "संभावित पात्र",
    "status.notEligible": "अपात्र",
    "card.compatibilityScore": "मैच स्कोर",
    "card.viewDetails": "विवरण और आवेदन गाइड",
    "card.compare": "तुलना",
    "card.save": "सहेजें",
    "safety.noFeeWarning": "सभी असली छात्रवृत्तियों के लिए आवेदन निःशुल्क है — कभी कोई शुल्क न दें।",
  },
  te: {
    "nav.dashboard": "డాష్‌బోర్డ్",
    "nav.chatbot": "AI చాట్‌బాట్",
    "nav.aiMatcher": "నా అర్హతను చూడండి",
    "nav.recommendations": "మీ కోసం సూచనలు",
    "nav.tracker": "నా దరఖాస్తులు",
    "nav.documents": "రెజ్యూమ్ / పత్రాలు",
    "nav.compare": "పోల్చండి",
    "nav.planner": "ఫీజు & సహాయ కాలిక్యులేటర్",
    "nav.profile": "నా ప్రొఫైల్",
    "dashboard.greeting": "స్వాగతం",
    "dashboard.subtitle": "మీ చదువు మరియు ప్రొఫైల్‌కు సరిపోయే ప్రభుత్వ & ప్రైవేట్ స్కాలర్‌షిప్‌లను సులభంగా కనుగొనండి.",
    "dashboard.profileCompletion": "ప్రొఫైల్ పూర్తి స్థాయి",
    "dashboard.eligibleCount": "మీకు అర్హత ఉన్నవి",
    "dashboard.possiblyEligibleCount": "పాక్షిక అర్హత",
    "dashboard.savedScholarships": "సేవ్ చేసినవి",
    "dashboard.activeApplications": "నా దరఖాస్తులు",
    "dashboard.upcomingDeadlines": "గడువు దగ్గరలో ఉన్నవి",
    "dashboard.searchPlaceholder": "స్కాలర్‌షిప్ పేరు, తెలంగాణ ePASS, B.Tech, NSP ద్వారా వెతకండి...",
    "status.eligible": "అర్హులు (Eligible)",
    "status.possiblyEligible": "పాక్షిక అర్హత",
    "status.notEligible": "అర్హత లేదు",
    "card.compatibilityScore": "మ్యాచ్ స్కోరు",
    "card.viewDetails": "వివరాలు & దరఖాస్తు విధానం",
    "card.compare": "పోల్చండి",
    "card.save": "సేవ్",
    "safety.noFeeWarning": "నిజమైన ప్రభుత్వ మరియు ప్రైవేట్ స్కాలర్‌షిప్‌లకు దరఖాస్తు చేయడం పూర్తిగా ఉచితం.",
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("scholarai_lang_v2") as SupportedLanguage | null;
      if (saved && (saved === "en" || saved === "hi" || saved === "te")) {
        setLanguageState(saved);
      }
    } catch {}
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem("scholarai_lang_v2", lang);
    } catch {}
  };

  const t = (key: TranslationKeys): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
