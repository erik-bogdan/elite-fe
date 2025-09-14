"use client";

import { Bebas_Neue } from "next/font/google";
import SectionTitle from "./components/SectionTitle";
import Table from "./components/Table";
import HeaderSection from "./sections/HeaderSection";
import { motion, useViewportScroll, useTransform } from 'framer-motion';
import Image from "next/image";
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

export default function Home() {
  const { scrollY } = useViewportScroll();
  // 0–300px scroll: left flex 1 → 2, jobb flex 1 → 0, opacitás 1 → 0
  const leftFlex = useTransform(scrollY, [0, 300], [1, 2]);
  const rightFlex = useTransform(scrollY, [0, 300], [1, 0]);
  const rightOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  return (
    <div>
      <div><HeaderSection /></div>
      <div className="bg-black h-[150px]"></div>
      <div className="h-[1500px] bg-black">

        <div className="container mx-auto">
          <div className="w-full h-screen">
            <div className="flex-[1] bg-black p-[50px] justify-center" >
              <SectionTitle title="ELITE Beerpong" subtitle="Európa és Magyarország legelső profi beerpong bajnoksága" />
              <div className={`text-white text-lg md:text-3xl ${bebasNeue.className} mt-8`}>
              Hamarosan...
              </div>
            </div>

            {/*<div className="flex flex-row gap-[400px] justify-center items-center">
                <div className="flex justify-center items-center">
                  <Image src="/elitelogo.png" alt="Elite Logo" width={250} height={250} />
                </div>
                <div className="flex justify-center items-center">
                  <Image src="/elitelogo.png" alt="Elite Logo" width={250} height={250} />
                </div>
            </div>*/}
        
            
          </div>
        </div>
        {/*<div className="w-full flex flex-col md:flex-row h-screen">
          <motion.div className="flex-[1] bg-black p-[50px] justify-center" >
          <SectionTitle title="league standings" subtitle="The section of the first and second division championship tables." />
            <div className="mt-[50px]">
              <Table records={{
                header: [
                  {column: 'pos', value: 'Position'},
                  {column: 'name', value: 'Name'},
                  {column: 'win', value: 'W'},
                  {column: 'loose', value: 'L'},
                  {column: 'cups', value: 'Cups'},
                  {column: 'points', value: 'Points'},
                ],
                rows: [
                  [
                    { column: "pos", value: "1" },
                    { column: "name", value: "Amíg BEERom" },
                    { column: "win", value: "28" },
                    { column: "loose", value: "2" },
                    { column: "cups", value: "+79" },
                    { column: "points", value: "81" }
                  ]
                ]
              }} />
            </div>
          </motion.div>
          <motion.div className="relative flex-[1] bg-[#ea303d]" >
            bbbbb
          </motion.div>
        </div>*/}
      </div>
    </div>
  );
}
