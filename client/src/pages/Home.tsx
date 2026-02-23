import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, Sparkles, ChevronDown } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";

const features = [
  {
    icon: <Zap className="w-6 h-6 text-primary" />,
    title: "Lightning Fast",
    description: "Built on cutting-edge edge infrastructure to deliver responses in milliseconds, not seconds."
  },
  {
    icon: <Shield className="w-6 h-6 text-accent" />,
    title: "Enterprise Grade",
    description: "Bank-level security and compliance built-in from day one. Your data is always protected."
  },
  {
    icon: <Sparkles className="w-6 h-6 text-primary" />,
    title: "Intelligent Design",
    description: "Intuitive interfaces and workflows that adapt to your team's unique way of working."
  }
];

export default function Home() {
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Abstract Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-accent/15 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-panel border-x-0 border-t-0 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Nexus</span>
        </div>
        <button 
          onClick={scrollToContact}
          className="text-sm font-semibold px-5 py-2 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          Get Early Access
        </button>
      </nav>

      <main className="flex-1 pt-32 pb-20 px-6 md:px-12">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto pt-16 md:pt-24 pb-32 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm font-medium mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Nexus Platform 2.0 is now live
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground leading-[1.1] mb-6"
          >
            Build the future, <br className="hidden md:block" />
            <span className="text-gradient">faster than ever.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The ultimate platform for modern teams to collaborate, design, and ship incredible products. Say goodbye to friction and hello to flow.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <button 
              onClick={scrollToContact}
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-white bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Start for free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-foreground bg-white border border-border hover:border-primary/50 hover:bg-gray-50 transition-all duration-300 shadow-sm">
              Read the docs
            </button>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="max-w-6xl mx-auto py-24">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-panel p-8 rounded-3xl group hover:-translate-y-2 transition-all duration-500"
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-border/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="max-w-6xl mx-auto py-24">
          <div className="glass-panel rounded-[2.5rem] overflow-hidden">
            <div className="grid lg:grid-cols-5 min-h-[600px]">
              {/* Left Side: Info */}
              <div className="col-span-2 bg-foreground text-background p-10 md:p-14 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
                
                <div className="relative z-10">
                  <h2 className="text-4xl font-bold mb-4 font-display">Let's talk</h2>
                  <p className="text-background/70 text-lg mb-8">
                    Ready to transform how your team works? We'd love to hear from you.
                  </p>
                </div>

                <div className="relative z-10 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-background/50 uppercase tracking-wider mb-2">HQ</h4>
                    <p className="text-background/90">100 Innovation Drive<br />San Francisco, CA 94103</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-background/50 uppercase tracking-wider mb-2">Contact</h4>
                    <p className="text-background/90">hello@nexusplatform.io<br />+1 (555) 123-4567</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="col-span-3 p-10 md:p-14 bg-white/50">
                <div className="max-w-md mx-auto h-full flex flex-col justify-center">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-foreground">Send a message</h3>
                    <p className="text-muted-foreground mt-2">Fill out the form below and our team will get back to you within 24 hours.</p>
                  </div>
                  
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-6 md:px-12 text-center text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-display font-semibold text-foreground">Nexus</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Nexus Platform Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
