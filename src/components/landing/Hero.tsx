import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden gradient-hero">
      {/* Abstract gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-[hsl(200_85%_55%/0.3)] blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[hsl(220_90%_40%/0.2)] blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight tracking-tight font-display"
          >
            HireQimah: Where Saudi Talent Builds Its{" "}
            <span className="italic">Qimah.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 text-lg sm:text-xl text-primary-foreground/85 max-w-2xl mx-auto leading-relaxed"
          >
            Verified career readiness for students; verified talent for HR.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold shadow-lg px-8 text-base"
            >
              Sign Up as Student <ArrowRight className="ml-1" size={18} />
            </Button>
            <Button
              size="lg"
              className="border-2 border-primary-foreground/70 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 font-semibold px-8 text-base"
            >
              Sign Up as HR
            </Button>
            <Button
              size="lg"
              className="border-2 border-primary-foreground/70 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 font-semibold px-8 text-base"
            >
              Partner as University
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
