import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertContact, Contact } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useCreateContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertContact) => {
      // Validate input before sending to backend
      const validated = api.contacts.create.input.parse(data);
      
      const res = await fetch(api.contacts.create.path, {
        method: api.contacts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          try {
            const error = api.contacts.create.responses[400].parse(await res.json());
            throw new Error(error.message);
          } catch (e) {
            if (e instanceof Error) throw e;
            throw new Error("Validation failed");
          }
        }
        throw new Error("An unexpected error occurred. Please try again.");
      }

      // Safe parse the response or typecast since z.custom is an any-passthrough
      const responseData = await res.json();
      return responseData as Contact;
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "Thanks for reaching out. We'll get back to you shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
