import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import WhyHireQimah from "@/components/landing/WhyHireQimah";
import Stakeholders from "@/components/landing/Stakeholders";
import Saudization from "@/components/landing/Saudization";
import Footer from "@/components/landing/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <Hero />
    <WhyHireQimah />
    <Stakeholders />
    <Saudization />
    <Footer />
  </div>
);

export default Index;
