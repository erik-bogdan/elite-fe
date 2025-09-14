import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Bebas_Neue } from "next/font/google";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { authClient } from "@/app/lib/auth-client";
import { toast } from "sonner";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

const formSchema = z
  .object({
    name: z.string().min(1, "A név megadása kötelező"),
    nickname: z.string().min(1, "A becenév megadása kötelező"),
    email: z
      .string()
      .email("Érvénytelen email cím")
      .min(1, "Az email cím megadása kötelező"),
    password: z.string().min(1, "A jelszó megadása kötelező"),
    confirmPassword: z.string().min(1, "A jelszó megerősítése kötelező"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "A jelszavak nem egyeznek",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

export const RegisterForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });


  async function onSubmit(values: FormData) {
    const { name, nickname, email, password } = values;
    setIsSubmitting(true);
    const { error } = await authClient.signUp.email(
      {
        name: name,
        nickname: nickname,
        email: email,
        password: password,
      },
      {
        onError: (ctx) => {
          toast.error(ctx.error.message, {
            style: {
              background: "red",
              color: "white",
            },
            duration: 8000,
          });
        },
      },
    );
    setIsSubmitting(false);

    if (!error) {
      router.push("/application");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className={`${bebasNeue.className} text-lg tracking-wider text-white/90`}>
          NÉV
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Nagy János"
          className="bg-black/40 border-2 border-[#ff5c1a]/50 text-white placeholder:text-white/50 focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-red-400">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname" className={`${bebasNeue.className} text-lg tracking-wider text-white/90`}>
          BECENÉV
        </Label>
        <Input
          id="nickname"
          type="text"
          placeholder="Jani"
          className="bg-black/40 border-2 border-[#ff5c1a]/50 text-white placeholder:text-white/50 focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
          {...register("nickname")}
        />
        {errors.nickname && (
          <p className="text-sm text-red-400">{errors.nickname.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className={`${bebasNeue.className} text-lg tracking-wider text-white/90`}>
          EMAIL CÍM
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="pelda@email.com"
          className="bg-black/40 border-2 border-[#ff5c1a]/50 text-white placeholder:text-white/50 focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className={`${bebasNeue.className} text-lg tracking-wider text-white/90`}>
          JELSZÓ
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••"
          className="bg-black/40 border-2 border-[#ff5c1a]/50 text-white placeholder:text-white/50 focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-red-400">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className={`${bebasNeue.className} text-lg tracking-wider text-white/90`}>
          JELSZÓ MEGERŐSÍTÉSE
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••"
          className="bg-black/40 border-2 border-[#ff5c1a]/50 text-white placeholder:text-white/50 focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className={`${bebasNeue.className} w-full text-lg tracking-wider bg-gradient-to-r from-[#ff5c1a] to-[#ff5c1a]/80 hover:from-[#ff5c1a]/90 hover:to-[#ff5c1a]/70 text-white border-2 border-[#ff5c1a] shadow-lg shadow-[#ff5c1a]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300`}
      >
        {isSubmitting ? "FELDOLGOZÁS..." : "REGISZTRÁCIÓ"}
      </Button>

      <div className="text-center">
        <p className="text-white/70">
          Már van fiókod?{" "}
          <a
            href="/auth/login"
            className="text-[#ff5c1a] hover:text-[#ff5c1a]/80 font-medium transition-colors"
          >
            Bejelentkezés
          </a>
        </p>
      </div>
    </form>
  );
}
