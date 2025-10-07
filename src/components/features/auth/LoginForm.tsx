import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/app/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Bebas_Neue } from "next/font/google";
import { Button } from "@/components/ui/button";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

const formSchema = z.object({
  email: z.string().email("Érvénytelen email cím").min(1, "Az email cím megadása kötelező"),
  password: z.string().min(1, "A jelszó megadása kötelező"),
});

type FormData = z.infer<typeof formSchema>;

export const LoginForm = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { email, password } = values;
    const { error } = await authClient.signIn.email(
      {
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

    if (!error) {
      router.push("/application");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
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
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-[#ff5c1a]">{errors.email.message}</p>
          )}
        </div>

        <div className="group">
          <label
            htmlFor="password"
            className={`${bebasNeue.className} block text-base text-white/90 mb-1.5 group-focus-within:text-[#ff5c1a] transition-colors tracking-wider`}
          >
            JELSZÓ
          </label>
          <input
            type="password"
            id="password"
            {...register("password")}
            className="w-full px-4 py-3 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-[#ff5c1a] focus:ring-2 focus:ring-[#ff5c1a]/20 transition-all duration-200"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1.5 text-sm text-[#ff5c1a]">{errors.password.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-[#ff5c1a]/50 bg-black/40 text-[#ff5c1a] focus:ring-[#ff5c1a]"
          />
          <label htmlFor="remember-me" className={`${bebasNeue.className} ml-2 block text-sm text-white/80 tracking-wider`}>
            EMLÉKEZZ RÁM
          </label>
        </div>

        <div className="text-sm">
          <a
            href="/auth/forgot-password"
            className={`${bebasNeue.className} font-medium text-[#ff5c1a] hover:text-[#ff7c3a] transition-colors tracking-wider`}
          >
            ELFELEJTETT JELSZÓ?
          </a>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className={`${bebasNeue.className} w-full text-lg tracking-wider bg-gradient-to-r from-[#ff5c1a] to-[#ff5c1a]/80 hover:from-[#ff5c1a]/90 hover:to-[#ff5c1a]/70 text-white border-2 border-[#ff5c1a] shadow-lg shadow-[#ff5c1a]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300`}
      >
        {isSubmitting ? "FELDOLGOZÁS..." : "BEJELENTKEZÉS"}
      </Button>

      <p className="text-center text-sm text-white/60">
        <span className={`${bebasNeue.className} tracking-wider`}>MÉG NINCS FIOKOD? </span>
        <a
          href="/auth/register"
          className={`${bebasNeue.className} font-medium text-[#ff5c1a] hover:text-[#ff7c3a] transition-colors tracking-wider`}
        >
          REGISZTRÁLJ MOST!
        </a>
      </p>
    </form>
  );
};
