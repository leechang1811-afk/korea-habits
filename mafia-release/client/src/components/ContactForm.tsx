import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { insertContactSchema, type InsertContact } from "@shared/schema";
import { useCreateContact } from "@/hooks/use-contacts";

export function ContactForm() {
  const createContact = useCreateContact();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = async (data: InsertContact) => {
    await createContact.mutateAsync(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
          Full Name
        </label>
        <input
          {...register("name")}
          id="name"
          type="text"
          placeholder="John Doe"
          className={`w-full px-4 py-3 rounded-xl bg-white/50 backdrop-blur-sm border-2 transition-all duration-200 outline-none
            ${errors.name 
              ? 'border-destructive/50 focus:border-destructive focus:ring-4 focus:ring-destructive/10' 
              : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/30'
            }`}
        />
        {errors.name && (
          <p className="mt-1.5 text-sm text-destructive font-medium">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
          Email Address
        </label>
        <input
          {...register("email")}
          id="email"
          type="email"
          placeholder="john@example.com"
          className={`w-full px-4 py-3 rounded-xl bg-white/50 backdrop-blur-sm border-2 transition-all duration-200 outline-none
            ${errors.email 
              ? 'border-destructive/50 focus:border-destructive focus:ring-4 focus:ring-destructive/10' 
              : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/30'
            }`}
        />
        {errors.email && (
          <p className="mt-1.5 text-sm text-destructive font-medium">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-foreground mb-2">
          Your Message
        </label>
        <textarea
          {...register("message")}
          id="message"
          rows={4}
          placeholder="How can we help you?"
          className={`w-full px-4 py-3 rounded-xl bg-white/50 backdrop-blur-sm border-2 transition-all duration-200 outline-none resize-none
            ${errors.message 
              ? 'border-destructive/50 focus:border-destructive focus:ring-4 focus:ring-destructive/10' 
              : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/30'
            }`}
        />
        {errors.message && (
          <p className="mt-1.5 text-sm text-destructive font-medium">{errors.message.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || createContact.isPending}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white
          bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25
          hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5
          active:translate-y-0 active:shadow-md
          disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none
          transition-all duration-300 ease-out"
      >
        {isSubmitting || createContact.isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            Send Message
            <Send className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}
