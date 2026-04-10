import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "ar" | "en";

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const translations: Record<string, Record<Lang, string>> = {
  // Navbar
  "nav.home": { en: "Home", ar: "الرئيسية" },
  "nav.features": { en: "Features", ar: "المميزات" },
  "nav.forStudents": { en: "For Students", ar: "للطلاب" },
  "nav.forCompanies": { en: "For Employers", ar: "لأصحاب العمل" },
  "nav.signin": { en: "Sign In", ar: "تسجيل الدخول" },
  "nav.signup": { en: "Sign Up", ar: "إنشاء حساب" },
  "nav.dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "nav.logout": { en: "Logout", ar: "تسجيل الخروج" },

  // Hero
  "hero.title1": { en: "Measure What Actually", ar: "قِس ما يُؤهلك" },
  "hero.title2": { en: "Gets You Hired", ar: "للتوظيف فعلاً" },
  "hero.subtitle": {
    en: "HireQimah provides a verified Employment Readiness Score (ERS) based on real skills, certifications, and market demand.",
    ar: "هايركيمة تقدّم مؤشر الجاهزية الوظيفية (ERS) بناءً على مهارات حقيقية، وشهادات موثّقة، ومتطلبات سوق العمل.",
  },
  "hero.cta.start": { en: "Get Started", ar: "ابدأ الآن" },
  "hero.cta.learn": { en: "Learn More", ar: "اعرف المزيد" },

  // Sections
  "section.forStudents": { en: "For Students", ar: "للطلاب" },
  "section.forStudents.desc": {
    en: "Build your verified profile, track your readiness score, and get AI-powered career guidance based on real market demand.",
    ar: "أنشئ ملفك الموثّق، تابع مؤشر جاهزيتك، واحصل على توجيه مهني مدعوم بالذكاء الاصطناعي.",
  },
  "section.forEmployers": { en: "For Employers", ar: "لأصحاب العمل" },
  "section.forEmployers.desc": {
    en: "Access a pool of verified, scored graduates. Filter by skills, certifications, and readiness — make data-driven hiring decisions.",
    ar: "وصول لقاعدة خريجين موثّقين ومُقيّمين. فلترة حسب المهارات والشهادات والجاهزية — قرارات توظيف مبنية على بيانات.",
  },
  "section.forUniversities": { en: "For Universities", ar: "للجامعات" },
  "section.forUniversities.desc": {
    en: "Track student readiness at scale. Identify skill gaps, monitor certification trends, and improve graduate outcomes.",
    ar: "تتبّع جاهزية الطلاب على نطاق واسع. حدّد الفجوات المهارية وراقب اتجاهات الشهادات وحسّن مخرجات التخرج.",
  },

  // Trust
  "trust.verified": { en: "Verified Data", ar: "بيانات موثّقة" },
  "trust.aiPowered": { en: "AI-Powered Analysis", ar: "تحليل بالذكاء الاصطناعي" },
  "trust.secure": { en: "Enterprise Security", ar: "أمان مؤسسي" },
  "trust.vision2030": { en: "Vision 2030 Aligned", ar: "متوافق مع رؤية 2030" },

  // Footer
  "footer.privacy": { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  "footer.terms": { en: "Terms of Service", ar: "شروط الاستخدام" },
  "footer.contact": { en: "Contact Us", ar: "تواصل معنا" },
  "footer.about": { en: "About", ar: "عن المنصة" },
  "footer.rights": { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },
};

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("hq-lang") as Lang) || "ar";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("hq-lang", l);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const t = (key: string) => translations[key]?.[lang] ?? key;
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
