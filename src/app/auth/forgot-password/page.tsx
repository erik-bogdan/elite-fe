"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/app/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Bebas_Neue } from "next/font/google";
import { Button } from "@/components/ui/button";
import { FiArrowLeft, FiMail } from "react-icons/fi";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

const formSchema = z.object({
  email: z.string().email("Érvénytelen email cím").min(1, "Az email cím megadása kötelező"),
});

type FormData = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      const { error } = await authClient.forgetPassword({
        email: values.email,
        redirectTo: "/auth/reset-password",
      });

      if (error) {
        toast.error(error.message, {
          style: {
            background: "red",
            color: "white",
          },
          duration: 8000,
        });
      } else {
        setIsSubmitted(true);
        toast.success("Jelszó visszaállító email elküldve!", {
          style: {
            background: "green",
            color: "white",
          },
          duration: 5000,
        });
      }
    } catch (err) {
      toast.error("Hiba történt a kérés feldolgozása során", {
        style: {
          background: "red",
          color: "white",
        },
        duration: 8000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border-2 border-[#ff5c1a] shadow-xl shadow-[#ff5c1a33]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-[#ff5c1a]/20 rounded-full flex items-center justify-center">
            <FiMail className="w-8 h-8 text-[#ff5c1a]" />
          </div>
          
          <h1 className={`${bebasNeue.className} text-2xl text-white mb-4 tracking-wider`}>
            EMAIL ELKÜLDVE
          </h1>
          
          <p className="text-white/80 text-sm mb-6 leading-relaxed">
            Ha ez az email cím regisztrálva van a rendszerben, akkor hamarosan megkapja a jelszó visszaállító linket.
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => router.push("/auth/login")}
              className={`${bebasNeue.className} w-full text-base tracking-wider bg-gradient-to-r from-[#ff5c1a] to-[#ff5c1a]/80 hover:from-[#ff5c1a]/90 hover:to-[#ff5c1a]/70 text-white border-2 border-[#ff5c1a] shadow-lg shadow-[#ff5c1a]/20 transition-all duration-300`}
            >
              VISSZA A BEJELENTKEZÉSHEZ
            </Button>
            
            <Button
              onClick={() => setIsSubmitted(false)}
              className={`${bebasNeue.className} w-full text-base tracking-wider border-2 border-[#ff5c1a] text-[#ff5c1a] hover:bg-[#ff5c1a] hover:text-white transition-all duration-300 bg-transparent`}
            >
              ÚJRA PRÓBÁLKOZÁS
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border-2 border-[#ff5c1a] shadow-xl shadow-[#ff5c1a33]">
      <div className="flex items-center gap-4 mb-8 justify-center">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center shadow-lg shadow-[#ff5c1a]/40">
          <FiMail className="w-8 h-8 text-white" />
        </div>
        <h1 className={`${bebasNeue.className} text-3xl sm:text-4xl tracking-wider text-white`}>
          ELFELEJTETT JELSZÓ
        </h1>
      </div>
      
      <p className="text-white/80 text-sm text-center mb-6">
        Adja meg az email címét, és elküldjük a jelszó visszaállító linket
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="group">
          <label
            htmlFor="email"
            className={`${bebasNeue.className} block text-base text-white/90 mb-1.5 group-focus-within:text-[#ff5c1a] transition-colors tracking-wider`}
          >
            EMAIL CÍM
          </label>
          <input
            type="email"
            id="email"
            {...register("email")}
            className="w-full px-4 py-3 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-[#ff5c1a] focus:ring-2 focus:ring-[#ff5c1a]/20 transition-all duration-200"
            placeholder="pelda@email.hu"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-[#ff5c1a]">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`${bebasNeue.className} w-full text-lg tracking-wider bg-gradient-to-r from-[#ff5c1a] to-[#ff5c1a]/80 hover:from-[#ff5c1a]/90 hover:to-[#ff5c1a]/70 text-white border-2 border-[#ff5c1a] shadow-lg shadow-[#ff5c1a]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300`}
        >
          {isSubmitting ? "FELDOLGOZÁS..." : "JELSZÓ VISSZAÁLLÍTÁSA"}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.back()}
            className={`${bebasNeue.className} flex items-center justify-center gap-2 text-[#ff5c1a] hover:text-[#ff7c3a] transition-colors tracking-wider text-sm`}
          >
            <FiArrowLeft className="w-4 h-4" />
            VISSZA A BEJELENTKEZÉSHEZ
          </button>
        </div>
      </form>
    </div>
  );
}
