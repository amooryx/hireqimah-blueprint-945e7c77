import { motion } from "framer-motion";
import { Landmark, Target, Handshake } from "lucide-react";

const points = [
  {
    icon: Landmark,
    title: "Vision 2030 Alignment",
    desc: "HireQimah directly supports Saudi Arabia's goal to empower its national workforce through transparent, merit-based hiring.",
  },
  {
    icon: Target,
    title: "CO-OP Placement Efficiency",
    desc: "Universities and employers streamline CO-OP matching with verified student data, reducing placement time by up to 60%.",
  },
  {
    icon: Handshake,
    title: "Bridging Education & Industry",
    desc: "Real-time data creates a feedback loop between universities and the job market, ensuring graduates are career-ready.",
  },
];

const Saudization = () => (
  <section id="saudization" className="py-24 bg-background">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center max-w-2xl mx-auto mb-14"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-display">
          Powering Saudization
        </h2>
        <p className="mt-4 text-muted-foreground text-lg">
          Built for the Kingdom. Aligned with Vision 2030 goals for national workforce empowerment.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {points.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
              <p.icon className="text-primary" size={28} />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-2">{p.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Saudization;
