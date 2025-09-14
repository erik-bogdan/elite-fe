"use client";

import { Bebas_Neue, Open_Sans } from "next/font/google";
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect } from 'react';
import Image from "next/image";

const bebasNeue = Bebas_Neue({
	weight: "400",
	subsets: ["latin"],
});

const openSans = Open_Sans({
	weight: "500",
	style: "italic",
	subsets: ["latin"],
});

export default function HeaderSection() {
	// Wrapper, amely 160vh magas – az első ~60vh a nyitó animációhoz használt scroll-tér
	const sectionRef = useRef<HTMLDivElement | null>(null);
	const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });

	// A két szín-sáv szélessége: 50% -> 0%
	const leftWidth = useTransform(scrollYProgress, [0, 1], ["50%", "0%"]);
	const rightWidth = useTransform(scrollYProgress, [0, 1], ["50%", "0%"]);
	// Logo két fele csúszik kifelé
	const leftLogoX = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
	const rightLogoX = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
	const logoOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.0, 0]);
	const dividerOpacity = useTransform(scrollYProgress, [0, 1], [0.0, 0]);
	const bottomFadeOpacity = useTransform(scrollYProgress, [0.15, 0.4], [0, 1]);
	const heroTextOpacity = useTransform(scrollYProgress, [0.05, 0.35, 0.7], [1, 0.65, 0]);

	// Dust particles canvas
	const dustCanvasRef = useRef<HTMLCanvasElement | null>(null);
	useEffect(() => {
		const canvas = dustCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let animationFrame = 0;
		let width = 0;
		let height = 0;
		let dpr = Math.max(1, Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1));

		type Particle = { x: number; y: number; r: number; a: number; vx: number; vy: number; ttl: number; life: number; tw: number };
		let particles: Particle[] = [];

		const rand = (min: number, max: number) => Math.random() * (max - min) + min;

		const resize = () => {
			const rect = canvas.parentElement?.getBoundingClientRect();
			width = Math.floor((rect?.width || window.innerWidth));
			height = Math.floor((rect?.height || window.innerHeight));
			canvas.width = Math.floor(width * dpr);
			canvas.height = Math.floor(height * dpr);
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			// density based on area
			const targetCount = Math.min(220, Math.floor((width * height) / 45000));
			particles = Array.from({ length: targetCount }).map(() => createParticle(true));
		};

		const createParticle = (spawnAnywhere = false): Particle => {
			const startY = spawnAnywhere ? rand(0, height) : rand(height * 0.8, height + 40);
			return {
				x: rand(-40, width + 40),
				y: startY,
				r: rand(0.6, 2.2),
				a: rand(0.08, 0.22),
				vx: rand(-0.05, 0.05),
				vy: rand(-0.22, -0.06), // lassan felfelé
				ttl: rand(6, 14),
				life: 0,
				tw: rand(1, 3.2), // twinkle speed
			};
		};

		const step = (p: Particle, dt: number) => {
			p.life += dt;
			p.x += p.vx * dt * 60 + Math.sin((p.life + p.tw) * 0.6) * 0.06;
			p.y += p.vy * dt * 60;
			// soft twinkle
			p.a = Math.max(0.04, Math.min(0.28, p.a + Math.sin(p.life * p.tw) * 0.003));
			if (p.y < -20 || p.x < -60 || p.x > width + 60) {
				Object.assign(p, createParticle(false));
				p.y = Math.min(height + 30, Math.max(height * 0.75, p.y));
			}
		};

		let last = performance.now();
		const render = () => {
			const now = performance.now();
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;

			ctx.clearRect(0, 0, width, height);

			// subtle glow effect: draw twice, one blurred composite
			for (let i = 0; i < particles.length; i++) {
				const p = particles[i];
				step(p, dt);
				ctx.globalCompositeOperation = 'screen';
				ctx.fillStyle = `rgba(255, 240, 210, ${p.a})`;
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
				ctx.fill();
				// soft halo
				ctx.fillStyle = `rgba(255, 230, 180, ${p.a * 0.4})`;
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2);
				ctx.fill();
			}

			animationFrame = requestAnimationFrame(render);
		};

		resize();
		const onResize = () => {
			dpr = Math.max(1, Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1));
			resize();
		};
		window.addEventListener('resize', onResize);
		animationFrame = requestAnimationFrame(render);

		return () => {
			cancelAnimationFrame(animationFrame);
			window.removeEventListener('resize', onResize);
		};
	}, []);

	return (
		<section ref={sectionRef} className="relative w-full h-[160vh]">
			{/* Pinned hero: a nyitó animáció alatt rögzített, majd tovább gördül az oldal */}
			<div className="sticky top-0 h-screen w-full overflow-hidden bg-[#0b1221]">
				{/* Háttérkép: a leghátsó rétegre helyezve */}
				<div className="absolute inset-0 -z-10">
					<Image src="/bg2.png" alt="Background" fill priority sizes="100vw" className="object-cover" />
				</div>
				{/* Por/particle réteg a háttér felett, de a sávok és logó alatt */}
				<div className="absolute inset-0 -z-[5] pointer-events-none">
					<canvas ref={dustCanvasRef} className="w-full h-full" />
				</div>
				{/* Háttér mintázat, épp csak finoman látható */}
				<div className="absolute inset-0 opacity-[0.08] pointer-events-none"
					style={{ backgroundImage: `
						repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 60px),
						repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 60px)
					` }}
				/>

				{/* Kék és piros sávok – középről nyílnak szét */}
				<motion.div className="absolute left-0 top-0 h-full bg-[#0b2a66]"
					style={{ width: leftWidth }}
				/>
				<motion.div className="absolute right-0 top-0 h-full bg-[#9a0a2a]"
					style={{ width: rightWidth, backgroundImage: `url('/sign.png')` }}
				/>

				{/* Középső elválasztó vonal, ami elhalványul a nyitáskor */}
				<motion.div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-px bg-white" style={{ opacity: dividerOpacity }}/>

				{/* Középen az ELITE logó – két félre vágva; nyitáskor szétcsúszik és halványodik */}
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="relative w-[220px] h-[220px] md:w-[300px] md:h-[300px]">
						{/* BAL fél */}
						<motion.div className="absolute inset-0"
							style={{ x: leftLogoX, opacity: logoOpacity, clipPath: 'inset(0 50% 0 0)' }}
						>
							<Image src="/elitelogo.png" alt="Elite Logo Left" fill priority sizes="300px" />
						</motion.div>
						{/* JOBB fél */}
						<motion.div className="absolute inset-0"
							style={{ x: rightLogoX, opacity: logoOpacity, clipPath: 'inset(0 0 0 50%)' }}
						>
							<Image src="/elitelogo.png" alt="Elite Logo Right" fill priority sizes="300px" />
						</motion.div>
					</div>
				</div>

				{/* Cím és alcím a hero-on (fixen középen) */}
				<motion.div className="absolute inset-x-0 z-[100] bottom-20 flex flex-col items-center px-6 text-center" style={{ opacity: heroTextOpacity }}>
					<h1 className={`${bebasNeue.className} text-4xl md:text-6xl text-white drop-shadow-[0_0_18px_rgba(0,0,0,0.35)]`}>ELITE BEERPONG</h1>
					<p className={`${openSans.className} mt-3 max-w-2xl text-white/80`}>A profi offline beerpong liga. Görgess, hogy szétnyíljon a kezdőképernyő.</p>
					<div className="mt-6 flex items-center gap-2 text-white/70">
						<span className="text-sm">Tekerj lefelé a folytatáshoz</span>
						<span className="inline-block h-3 w-3 rounded-full bg-white/60 animate-pulse"/>
					</div>
				</motion.div>

				{/* Alul megjelenő átmenetes fekete – scrollra fade-in, hogy egybeolvadjon az alatta lévő feketével */}
				<motion.div
					className="pointer-events-none absolute inset-x-0 bottom-0 h-64 md:h-96"
					style={{ opacity: bottomFadeOpacity, backgroundImage: 'linear-gradient(to bottom, rgba(11,18,33,0) 0%, rgba(11,18,33,0.6) 35%, rgba(11,18,33,0.92) 70%, #000 100%)' }}
				/>
			</div>
		</section>
	);
}
