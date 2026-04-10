import { motion } from "framer-motion";
import { GraduationCap, Building2, School, TrendingUp, Brain, Trophy, Users, Filter, ClipboardCheck, AlertOctagon, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface StakeSection {
  id: string;
  title: string;
  subtitle: string;
  mainIcon: LucideIcon;
  features: Feature[];
}

const sections: StakeSection[] = [
  {
    id: "students",
    title: "For Students",
    subtitle: "Build your verified professional profile before you graduate.",
    mainIcon: GraduationCap,
    features: [
      {
        icon: TrendingUp,
        title: "Employment Readiness Score (ERS)",
        desc: "A dynamic score reflecting your GPA, skills, certifications, and extracurriculars — visible to employers.",
      },
      {
        icon: Brain,
        title: "AI Career Roadmaps",
        desc: "Personalized career paths generated from 100+ real Saudi LinkedIn job listings, tailored to your major and goals.",
      },
      {
        icon: Trophy,
        title: "Leaderboards",
        desc: "Compete with peers across your university and nationwide. Top performers get highlighted to recruiters.",
      },
    ],
  },
  {
    id: "hr",
    title: "For HR Teams",
    subtitle: "Find verified, ranked talent in minutes — not months.",
    mainIcon: Building2,
    features: [
      {
        icon: Users,
        title: "Verified Talent Pools",
        desc: "Browse pre-vetted candidates whose transcripts, scores, and conduct records are university-verified.",
      },
      {
        icon: Filter,
        title: "AI-Ranked Applicant Filtering",
        desc: "Our AI ranks applicants by relevance, ERS, and role fit — so you interview the best, faster.",
      },
    ],
  },
  {
    id: "universities",
    title: "For Universities",
    subtitle: "Track, verify, and elevate your students' career readiness.",
    mainIcon: School,
    features: [
      {
        icon: ClipboardCheck,
        title: "Attendance & Participation Tracking",
        desc: "Monitor student engagement across courses, events, and co-op placements from a single dashboard.",
      },
      {
        icon: AlertOctagon,
        title: "Conduct Violation Records",
        desc: "Log and manage academic integrity issues — cheating incidents, formal warnings — with full transparency.",
      },
      {
        icon: Activity,
        title: "Real-Time Student Analytics",
        desc: "Gain insights into cohort performance, placement rates, and readiness trends across departments.",
      },
    ],
  },
];

const Stakeholders = () => (
  <>
    {sections.map((section, si) => (
      <section
        key={section.id}
        id={section.id}
        className={si % 2 === 0 ? "py-24 bg-background" : "py-24 gradient-subtle"}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-14"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
              <section.mainIcon className="text-primary" size={28} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-display">
              {section.title}
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">{section.subtitle}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {section.features.map((feat, fi) => (
              <motion.div
                key={fi}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: fi * 0.1, duration: 0.5 }}
                className="rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feat.icon className="text-primary" size={22} />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{feat.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    ))}
  </>
);

export default Stakeholders;
