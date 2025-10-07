"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/app/lib/auth-client";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Bebas_Neue } from "next/font/google";
import { Button } from "@/components/ui/button";
import { FiArrowLeft, FiCheck, FiEye, FiEyeOff } from "react-icons/fi";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

const formSchema = z.object({
  password: z.string().min(8, "A jelszónak legalább 8 karakter hosszúnak kell lennie"),
  confirmPassword: z.string().min(8, "A jelszó megerősítése kötelező"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "A jelszavak nem egyeznek",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const password = watch("password");

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      toast.error("Érvénytelen vagy hiányzó token", {
        style: {
          background: "red",
          color: "white",
        },
        duration: 8000,
      });
    }
  }, [token]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await authClient.resetPassword({
        token: token,
        newPassword: values.password,
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
        setIsSuccess(true);
        toast.success("Jelszó sikeresen visszaállítva!", {
          style: {
            background: "green",
            color: "white",
          },
          duration: 5000,
        });
      }
    } catch (err) {
      toast.error("Hiba történt a jelszó visszaállítása során", {
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

  if (!isValidToken) {
    return (
      <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border-2 border-red-500 shadow-xl shadow-red-500/20">
        <div className="text-center">
          <h1 className={`${bebasNeue.className} text-2xl text-white mb-4 tracking-wider`}>
            ÉRVÉNYTELEN LINK
          </h1>
          
          <p className="text-white/80 text-sm mb-6 leading-relaxed">
            Ez a jelszó visszaállító link érvénytelen vagy lejárt. Kérjük, kérjen új jelszó visszaállító linket.
          </p>
          
          <Button
            onClick={() => router.push("/auth/forgot-password")}
            className={`${bebasNeue.className} w-full text-base tracking-wider bg-gradient-to-r from-[#ff5c1a] to-[#ff5c1a]/80 hover:from-[#ff5c1a]/90 hover:to-[#ff5c1a]/70 text-white border-2 border-[#ff5c1a] shadow-lg shadow-[#ff5c1a]/20 transition-all duration-300`}
          >
            ÚJ JELSZÓ VISSZAÁLLÍTÁS
          </Button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border-2 border-[#ff5c1a] shadow-xl shadow-[#ff5c1a33]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
            <FiCheck className="w-8 h-8 text-green-500" />
          </div>
          
          <h1 className={`${bebasNeue.className} text-2xl text-white mb-4 tracking-wider`}>
            JELSZÓ VISSZAÁLLÍTVA
          </h1>
          
          <p className="text-white/80 text-sm mb-6 leading-relaxed">
            A jelszó sikeresen visszaállítva! Most már bejelentkezhet az új jelszavával.
          </p>
          
          <Button
            onClick={() => router.push("/auth/login")}
            className={`${bebasNeue.className} w-full text-base tracking-wider bg-gradient-to-r from-[#ff5c1a] to-[#ff5c1a]/80 hover:from-[#ff5c1a]/90 hover:to-[#ff5c1a]/70 text-white border-2 border-[#ff5c1a] shadow-lg shadow-[#ff5c1a]/20 transition-all duration-300`}
          >
            BEJELENTKEZÉS
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border-2 border-[#ff5c1a] shadow-xl shadow-[#ff5c1a33]">
      <div className="flex items-center gap-4 mb-8 justify-center">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center shadow-lg shadow-[#ff5c1a]/40">
          <FiCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className={`${bebasNeue.className} text-3xl sm:text-4xl tracking-wider text-white`}>
          ÚJ JELSZÓ
        </h1>
      </div>
      
      <p className="text-white/80 text-sm text-center mb-6">
        Adja meg az új jelszavát
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="group">
          <label
            htmlFor="password"
            className={`${bebasNeue.className} block text-base text-white/90 mb-1.5 group-focus-within:text-[#ff5c1a] transition-colors tracking-wider`}
          >
            ÚJ JELSZÓ
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              {...register("password")}
              className="w-full px-4 py-3 pr-12 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-[#ff5c1a] focus:ring-2 focus:ring-[#ff5c1a]/20 transition-all duration-200"
              placeholder="••••••••"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
            >
              {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-sm text-[#ff5c1a]">{errors.password.message}</p>
          )}
        </div>

        <div className="group">
          <label
            htmlFor="confirmPassword"
            className={`${bebasNeue.className} block text-base text-white/90 mb-1.5 group-focus-within:text-[#ff5c1a] transition-colors tracking-wider`}
          >
            JELSZÓ MEGERŐSÍTÉSE
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              {...register("confirmPassword")}
              className="w-full px-4 py-3 pr-12 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-[#ff5c1a] focus:ring-2 focus:ring-[#ff5c1a]/20 transition-all duration-200"
              placeholder="••••••••"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
            >
              {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-sm text-[#ff5c1a]">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="text-xs text-white/60">
          <p>• A jelszónak legalább 8 karakter hosszúnak kell lennie</p>
          <p>• Használjon kis- és nagybetűket, számokat és speciális karaktereket</p>
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
            onClick={() => router.push("/auth/login")}
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
