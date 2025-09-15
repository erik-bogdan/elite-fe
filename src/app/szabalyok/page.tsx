"use client";

import { Bebas_Neue } from "next/font/google";
import SectionTitle from "../components/SectionTitle";
import TopNav from "../components/TopNav";
import Image from "next/image";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

export default function SzabalyokPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Fixed TopNav */}
      <TopNav />
      
      {/* Main Content with top padding to account for fixed header */}
      <div className="containerpx-4 pt-20 pb-12">
        {/* Hero Section with Title Overlay */}
        <div className="relative mb-16">
          <div className="relative w-full h-96 md:h-[500px] rounded-2xl overflow-hidden">
            <Image 
              src="/title.jpg" 
              alt="Beerpong Arena" 
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h1 className={`${bebasNeue.className} text-[#FFDB11] text-4xl md:text-6xl lg:text-7xl mb-4`}>
                  SZABÁLYOK
                </h1>
                <p className="text-white text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto">
                  Az ELITE Beerpong hivatalos játékszabályai
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rules Content */}
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* 1. FELSZERELÉS */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              1. FELSZERELÉS
            </h2>
            <div className="space-y-3 text-white/80">
              <p><span className="text-[#FFDB11] font-semibold">Asztalok:</span> 244 x 61 x 73 cm</p>
              <p><span className="text-[#FFDB11] font-semibold">Labdák:</span> 40mm</p>
              <p><span className="text-[#FFDB11] font-semibold">Poharak:</span> SOLO Red Cups 16oz (4,7dl)</p>
              <p><span className="text-[#FFDB11] font-semibold">Szájszélesség:</span> 9,53 cm</p>
              <p><span className="text-[#FFDB11] font-semibold">Magasság:</span> 12 cm</p>
              <p><span className="text-[#FFDB11] font-semibold">Talpszélesség:</span> 6,35 cm</p>
            </div>
          </div>

          {/* 2. A POHARAK TARTALMA ÉS ELRENDEZÉSE */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              2. A POHARAK TARTALMA ÉS ELRENDEZÉSE
            </h2>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>
                A játék kezdetekor 10-10 pohár van az asztalon piramis formába rendezve úgy, hogy a poharak pereme összeér. 
                A 10-ből 6 pohár sört tartalmaz, 4 pedig vizet, melyek a leghátsó sorban foglalnak helyet.
              </p>
              <p className="text-[#FFDB11] font-semibold">
                A játék során nem kötelező elfogyasztani a sört sem!
              </p>
            </div>
          </div>

          {/* 3.1 KEZDÉS */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              3.1 KEZDÉS
            </h2>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>
                A kezdés jogát a csapatok egy-egy játékosa kő-papír-ollóval dönti el. A győztes dönthet, hogy ki kezdje a mérkőzést, 
                míg a vesztes térfelet választhat.
              </p>
              <p>
                A játékot kezdő csapatnak egy (1) dobása van. Ezt tetszőleges játékos hajthatja végre. Ezután a másik csapat jön két (2) dobással, 
                a játék további részében pedig minden körben két-két dobása van a csapatoknak. A dobás sorrendje tetszőleges, 
                minden körben egyet dobhat mindkét játékos (kivéve, ha dupláznak, lásd 3.4)
              </p>
            </div>
          </div>

          {/* 3.2 DOBÁS/VÉDEKEZÉS */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              3.2 DOBÁS/VÉDEKEZÉS
            </h2>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>Minden sikeres találat után egy poharat kell levenni az ellenfél oldaláról</p>
              <p>
                A védekező csapat csak akkor érhet a labdához, miután az érintkezett valamelyik pohárral. Ellenkező esetben egy poharat le kell venni 
                az asztalról büntetésből, melyet az ellenfél dobó játékosa jelöl ki.
              </p>
              <p>
                Tilos a labda útját módosítani, amíg az a pohár belsejében van, a kifújás nem megengedett.
              </p>
              <p>
                Pattintott dobás megengedett, ugyanazok a szabályok vonatkoznak rá, mint a sima dobásra (egyet ér, és nem szabad elütni, 
                amíg nem ért poharat)
              </p>
            </div>
          </div>

          {/* 3.3 RENDEZÉS */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              3.3 RENDEZÉS
            </h2>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>
                A poharakat 6-nál, 3-nál és 1-nél minden esetben kötelező rendezni háromszög formátumban, középre. 
                Az utolsó poharat mindig középre kell húzni, kb. 2,5 cm-re az asztal hátuljától.
              </p>
              <p>A félrecsúszott poharakat meg kell igazítani, de csak az ellenfél kérésére</p>
              <p>Kötelező a rendezés amint az lehetséges, a kör közben is</p>
              <p>
                A kidobott poharakat azonnal ki kell venni, akkor is, ha rendezésnek kellett volna történnie.
                Példa: 7-nél gyors egymásutánban betalál mindkét játékos, és az ellenfélnek nem volt ideje rendezni 6-nál. 
                Ebben az esetben mindkét találat érvényes, kérhető a rendezés, és a védő csapat dönti el, hogy melyik poharat veszi ki a 6-os háromszögből.
              </p>
              <p>
                A dobó csapat felelőssége megvárni, hogy kivegyenek egy poharat, vagy rendezzenek. Ha rendezés, vagy pohárkivétel közben találnak kezet, 
                az kihagyott dobásnak számít. Kihagyott dobásnak számít továbbá, ha mindkét játékos egy már kidobott pohárba talál bele, 
                tehát ugyanazt a poharat nem dobhatja ki mindkét játékos.
              </p>
            </div>
          </div>

          {/* 3.4 DUPLÁZÁS */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              3.4 DUPLÁZÁS
            </h2>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>
                Ha egy körön belül mindkét játékos értékesíti a maga dobását, a csapat EGY labdát kap vissza. 
                A plusz egy dobást bármelyik játékos elvállalhatja. Ez alól a szabály alól csak a visszaszállás kivétel, lásd lejjeb.
              </p>
            </div>
          </div>

          {/* 4.1 BEHAJOLÁS */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              4.1 BEHAJOLÁS
            </h2>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>
                Az asztal fölé hajolás megengedett, mindaddig, amíg a játékos nem helyezi a kezét, lábát, stb. az asztalra, 
                hogy lopja a távolságot. Dobás közben a játékos semmilyen testrésze nem érintkezhet az asztallal. 
                MIUTÁN a játékos elengedte a labdát, a keze hozzáérhet az asztalhoz.
              </p>
              <p>
                A dobás csak az asztal mögül megengedett, az asztal képzeletbeli vonalába nem állhat a dobó játékos.
              </p>
              <p>
                A játékosok nem változtathatnak a poharak elrendezésén dobás közben. Ha a poharak elmozdulnak dobás közben a behajolás miatt, 
                vissza kell tenni őket az eredeti pozícióba.
              </p>
              <p>
                Ha egy pohár felborul a behajolás miatt, vagy a játékos leveri azt, a poharat ki kell venni a játékból.
              </p>
            </div>
          </div>

          {/* 4.2 ZAVARÁS */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              4.2 ZAVARÁS
            </h2>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>
                A zavarás alapvetően megengedett az alábbi feltételekkel (melyek megszegése egy pohár büntetést von maga után):
              </p>
              <p>
                A játékosok nem léphetik át az asztal képzeletbeli vonalát, nem nyúlhatnak-, és nem dobhatnak semmit az asztal fölé. 
                (Ennek elkerülése érdekében célszerű pár lépéssel az asztal mögött állni)
              </p>
              <p>Tilos legyezni, fújni és bármilyen légáramlatot generálni</p>
              <p>Mind a játékosoknak, mind a nézőknek tilos bármi módon eltakarni a poharakat.</p>
            </div>
          </div>

          {/* 4.3 SAJÁT POHÁRBA DOBÁS */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              4.3 SAJÁT POHÁRBA DOBÁS
            </h2>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>
                Ha egy játékos, akinél a labdabirtoklás van (ő dob a kör szerint) direkt, vagy nem direkt beledobja a labdát a saját poharába, 
                nem számít találatnak
              </p>
              <p>
                Ha egy játékos, aki nem birtokolja a labdát (nem ő következik) beledobja a labdát a saját poharába direkt, vagy nem direkt, 
                találatnak számít
              </p>
            </div>
          </div>

          {/* 4.4 A LABDÁBA ÉRÉS */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              4.4 A LABDÁBA ÉRÉS
            </h2>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>Ha a játékos belenyúl a dobásba, mielőtt az poharat érne, 1 pohár büntetést kap</p>
              <p>Ha bárki más ér bele a labdába (néző, játékvezető), a dobást meg kell ismételni</p>
              <p>
                Minden asztalon lévő tárgy az asztal részének számít, így ha például egy pattintott dobás egy már kidobott pohárról, 
                vagy saját korsóról pattan be, találatnak számít. Ugyanakkor törekedni kell arra, hogy minél kevesebb tárgy legyen az asztalon. 
                Középre, a két csapat játékban lévő poharai közé nem szabad helyezni semmit.
              </p>
            </div>
          </div>

          {/* 4.5 POHÁRHOZ ÉRÉS */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              4.5 POHÁRHOZ ÉRÉS
            </h2>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>Ha egy játékos feldönti a poharát, azt a poharat a játékból ki kell venni</p>
              <p>Ha a játékosokon kívül bárki más dönti fel a poharat, azt újra kell tölteni, és a játékban hagyni.</p>
              <p>
                A poharakba annyi sört célszerű tölteni, hogy ne tudjanak felborulni. Ha ez mégis bekövetkezik, abban az esetben érvényes a találat, 
                ha a labda egyértelműen a pohár belső peremét érte, nem a külső részét. Ha a külső részen ért találat miatt borul fel, 
                a dobás érvénytelen, a pohár a játékban marad.
              </p>
              <p>
                Abban az esetben, ha a labda a pohár belső peremén pörög, ennek hatására felborul a pohár, de a labda nem ér folyadékot (kiugrik), 
                a találat érvényesnek számít
              </p>
              <p>
                Tilos a poharakhoz érni, amíg a labda a dobó játékosnál, vagy a levegőben van. Ilyen esetben 1 pohár büntetés jár a védő csapatnak.
              </p>
            </div>
          </div>

          {/* 4.6 POHÁRHOZ ÉRÉS */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              4.6 POHÁRHOZ ÉRÉS
            </h2>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>
                Rendezés esetén addig nem dobhat a játékos, amíg a rendezés egyértelműen be nem fejeződött. 
                Ha mégis ez történik, a dobás érvénytelen, és a másik csapat jön automatikusan
              </p>
            </div>
          </div>

          {/* 5.1 VÉGJÁTÉK */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              5.1 VÉGJÁTÉK
            </h2>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p className="text-[#FFDB11] font-semibold">Visszaszállás és hosszabbítás:</p>
              <p>
                Amikor valamelyik csapat kidobja az utolsó poharat, az ellenfélnek minden esetben lehetősége van hosszabbításra menteni a mérkőzést. 
                A Példatárban további esetek találhatók, amik szemléltetik a szabályokat.
              </p>
              <p className="text-[#FFDB11] font-semibold">A visszaszállásra két fő szabály vonatkozik:</p>
              <p>
                Abban az esetben, ha kettő, vagy több pohár marad az ellenfél oldalán az ún. „Hirtelen halál" szabály lép életbe: 
                bármelyik játékos elkezdheti a visszaszállást, a játék akkor ér véget, ha egy dobás kimarad. A játékosoknak felváltva kell dobniuk. 
                Ez alól kivétel, ha 3 pohárnál történt a kiszállás, ilyenkor ugyanis ha mindkét játékos betalál, eldönthetik, 
                hogy ki dobjon az utolsó pohárra a hosszabbításért.
              </p>
              <p>
                Ha egy pohár marad az ellenfélnél, az ún. „Dobj, amennyi labdád van" szabály lép életbe: ha az első dobó szállt ki, 
                egy lehetőség van visszaszállni, tetszőleges játékosnak. Ha a második dobás volt a kiszálló, akkor mindkét játékos próbálkozhat visszaszállással.
              </p>
              <p>Sikeres visszaszállás esetén a játék hosszabbítással folytatódik.</p>
              <p>A hosszabbítás 3-3 pohárról indul, háromszög alakba rendezve</p>
              <p>Az a csapat kezd két dobással, mely először szállt ki a rendes játékidőben</p>
              <p>A hosszabbításra is rendes játékidő alatt érvényes szabályok vonatkoznak</p>
            </div>
          </div>

          {/* 5.2 PÉLDATÁR VISSZASZÁLLÁSRA */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              5.2 PÉLDATÁR VISSZASZÁLLÁSRA
            </h2>
            <div className="space-y-4 text-white/80 leading-relaxed text-sm">
              <p>
                <span className="text-[#FFDB11] font-semibold">4 pohár van CSAPAT1 oldalán, és CSAPAT1 valamelyik játékosa kiszáll (mindegy, melyik).</span> 
                CSAPAT2-nek az összes poharat ki kell dobnia hiba nélkül a visszaszálláshoz. CSAPAT2 A-játékosa kezd (mindegy, melyik játékos kezd). 
                Ha kihagyja, vége a meccsnek. Ha bedobja, rendezés következik háromszögbe és CSAPAT2 B-játékosa dob. Ha kihagyja, vége a meccsnek. 
                Ha bedobja, A-játékos jön ismét, felváltva dobnak egészen addig, míg valaki nem hibáz, mert akkor vége a játéknak. 
                Ha így sikerül végigdobni az összes poharat, hosszabbítás következik, mely az eredetileg kiszálló csapat 2 dobásával indul.
              </p>
              <p>
                <span className="text-[#FFDB11] font-semibold">3 pohár van CSAPAT1 oldalán, és CSAPAT1 kiszállt.</span> 
                CSAPAT2 A-játékosa dob (lehetne B is, tetszőleges, ki kezd), ha kihagyja, nincs tovább. Ha bedobja, CSAPAT2 B-játékosa dob, 
                ha kihagyja, vége. Ha bedobja, visszakapnak egy labdát, és a duplázás mintájára eldönthetik, hogy ki próbálkozzon az utolsó pohárra visszaszállni, 
                de csak egy dobásuk van.
              </p>
              <p>
                <span className="text-[#FFDB11] font-semibold">2 pohár van CSAPAT1 oldalán, 1 pohár van CSAPAT2 oldalán.</span> 
                CSAPAT1 A-játékosa dob és kihagyja, majd CSAPAT1 B-játékosa kiszáll. Mivel 2 pohár maradt fenn, mikor megtörtént a kiszállás, 
                a „Hirtelen halál" szabály lép életbe: CSAPAT2 A-játékosa dob, ha kihagyja, vége. Ha bedobja ő is és B-játékos is, hosszabítás következik.
              </p>
              <p>
                <span className="text-[#FFDB11] font-semibold">2 pohár van mindkét csapat előtt.</span> 
                CSAPAT1 A-játékosa betalál, majd B-játékosa kiszáll. Mivel egynél több pohár maradt visszaszállásra, a helyzet ugyanaz, mint a c, pontban.
              </p>
              <p>
                <span className="text-[#FFDB11] font-semibold">2 pohár van CSAPAT1 előtt, 3 pohár van CSAPAT2 előtt.</span> 
                CSAPAT1 dupláz, visszakapnak egy labdát, majd kiszállnak. Mivel egynél több pohár van, itt is a c, pont lép életbe.
              </p>
              <p>
                <span className="text-[#FFDB11] font-semibold">1-1 pohár van a csapatok előtt.</span> 
                CSAPAT1 A-játékosa kihagyja, B-játékos kiszáll. Mivel csak egy pohár van az asztalon a „Dobj, ahány labdád van" szabály lép életbe. 
                Jelen esetben CSAPAT2-nék 2 labdája van, így mindkét játékos próbálkozhat.
              </p>
              <p>
                <span className="text-[#FFDB11] font-semibold">1-1 pohár van a csapatok előtt.</span> 
                CSAPAT1 A-játékosa kiszáll. CSAPAT2-nél csak egy labda van, így csak egy játékos próbálkozhat.
              </p>
              <p>
                <span className="text-[#FFDB11] font-semibold">1 pohár van CSAPAT1 előtt és 2 pohár CSAPAT2 előtt.</span> 
                CSAPAT1 A-játékosa betalál, B kiszáll. Mivel 1 pohár van, és 2 labda CSAPAT2-nél, mindkét játékos dobhat.
              </p>
              <p>
                <span className="text-[#FFDB11] font-semibold">1 pohár van CSAPAT1 előtt, 3 CSAPAT2 előtt.</span> 
                CSAPAT1 dupláz, visszakapnak egy labdát, amivel valaki kiszáll. 1 pohár van, CSAPAT2-nél pedig 2 labda, így mindkét játékos dobhat.
              </p>
            </div>
          </div>

          {/* 6. IDŐKORLÁT */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              6. IDŐKORLÁT
            </h2>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>
                Alapvetően nincs időlimit, de a játékosoknak ésszerű és sportszerű időn belül kell eldobni a labdát.
              </p>
              <p>
                Bizonyos esetekben a szervezők dönthetnek úgy, hogy időkorlátot vezetnek be. Ilyenkor a játékvezető feladata mérni a „támadóidőt", 
                mely 30 másodpercet jelent dobásonként.
              </p>
            </div>
          </div>

          {/* SZABÁLYVIDEÓ */}
          <div className="bg-gradient-to-br from-[#FFDB11]/10 to-[#ff5c1a]/10 border border-[#FFDB11]/30 rounded-2xl p-8 text-center">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              SZABÁLYVIDEÓ
            </h2>
            <p className="text-white/80 text-lg mb-6">
              A szabályvideó ide kattintva érhető el
            </p>
            <a
              href="https://youtube.com/watch?v=NprrUky0wAg&themeRefresh=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#FFDB11] hover:bg-[#FFDB11]/80 text-black font-bold py-3 px-8 rounded-lg transition-colors duration-300"
            >
              Szabályvideó megtekintése
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
