import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="border-t border-border bg-card py-12">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <img src={logo} alt="HireQimah" className="h-10 w-auto" />
          <p className="text-sm text-muted-foreground mt-1">
            Where Saudi Talent Builds Its Qimah.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
            Terms of Service
          </a>
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
            Contact Us
          </a>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} HireQimah. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
