import { motion } from "framer-motion";
import { ShieldCheck, FileCheck, BarChart3, XCircle, HelpCircle, AlertTriangle } from "lucide-react";

const traditional = [
  { icon: XCircle, label: "Unverified resumes & credentials" },
  { icon: HelpCircle, label: "No standardized readiness scoring" },
  { icon: AlertTriangle, label: "Hidden conduct & performance history" },
];

const hireqimah = [
  { icon: FileCheck, label: "University-verified transcripts & records" },
  { icon: BarChart3, label: "ERS — Employment Readiness Score" },
  { icon: ShieldCheck, label: "Transparent conduct & participation data" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const WhyHireQimah = () => (
  <section id="why" className="py-24 gradient-subtle">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center max-w-2xl mx-auto mb-16"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-display">
          Why HireQimah?
        </h2>
        <p className="mt-4 text-muted-foreground text-lg">
          Traditional platforms leave HR guessing. HireQimah delivers verified, data-driven talent insights.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Traditional */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <h3 className="text-lg font-semibold text-muted-foreground mb-6 uppercase tracking-wider text-center">
            Traditional Platforms
          </h3>
          <div className="space-y-5">
            {traditional.map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                  <item.icon className="text-destructive" size={20} />
                </div>
                <p className="text-foreground pt-1.5">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* HireQimah */}
        <div className="rounded-xl border-2 border-primary/20 bg-primary-light p-8 shadow-card">
          <h3 className="text-lg font-semibold text-primary mb-6 uppercase tracking-wider text-center">
            HireQimah
          </h3>
          <div className="space-y-5">
            {hireqimah.map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="text-primary" size={20} />
                </div>
                <p className="text-foreground pt-1.5">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default WhyHireQimah;
