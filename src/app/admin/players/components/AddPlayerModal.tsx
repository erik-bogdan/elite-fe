"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { Bebas_Neue } from "next/font/google";
import { FiUpload, FiUserPlus, FiSearch, FiX } from "react-icons/fi";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { toast } from "sonner";
import AnimatedModal from "../../teams/components/AnimatedModal";
import { useAssignPlayerToTeamSeasonMutation, useCreatePlayerMutation, useGetAvailablePlayersForSeasonQuery } from "@/lib/features/apiSlice";
import { useGetSeasonsQuery } from "@/lib/features/season/seasonSlice";
import Select, { StylesConfig, components } from "react-select";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

interface TeamOption {
  value: string;
  label: string;
}

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamOptions: TeamOption[];
  allowExisting?: boolean;
  defaultSeasonId?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  team: TeamOption | null;
  season: TeamOption | null;
  image: string;
  playerImage: string;
  existingPlayerId?: string;
  captain?: boolean;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

const selectStyles: StylesConfig<TeamOption, false> = {
  control: (styles) => ({
    ...styles,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderColor: '#ff5c1a',
    borderWidth: '2px',
    borderRadius: '0.5rem',
    padding: '2px',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#ff7c3a',
    },
  }),
  menu: (styles) => ({
    ...styles,
    backgroundColor: '#001a3a',
    border: '1px solid #ff5c1a',
    borderRadius: '0.5rem',
    padding: '0.5rem',
  }),
  option: (styles, { isFocused, isSelected }) => ({
    ...styles,
    backgroundColor: isSelected 
      ? 'rgba(255, 92, 26, 0.8)' 
      : isFocused 
        ? 'rgba(255, 92, 26, 0.2)' 
        : undefined,
    color: isSelected ? 'white' : '#e0e6f7',
    borderRadius: '0.3rem',
    margin: '2px 0',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: 'rgba(255, 92, 26, 0.5)',
    },
  }),
  input: (styles) => ({
    ...styles,
    color: 'white',
  }),
  placeholder: (styles) => ({
    ...styles,
    color: '#e0e6f7',
  }),
  singleValue: (styles) => ({
    ...styles,
    color: 'white',
  }),
  dropdownIndicator: (styles) => ({
    ...styles,
    color: '#ff5c1a',
    '&:hover': {
      color: '#ff7c3a',
    },
  }),
  clearIndicator: (styles) => ({
    ...styles,
    color: '#ff5c1a',
    '&:hover': {
      color: '#ff7c3a',
    },
  }),
};

const DropdownIndicator = (props: any) => {
  return (
    <components.DropdownIndicator {...props}>
      <FiSearch className="w-5 h-5 text-[#ff5c1a]" />
    </components.DropdownIndicator>
  );
};

export default function AddPlayerModal({ isOpen, onClose, teamOptions, allowExisting = false, defaultSeasonId }: AddPlayerModalProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [createPlayer, { isLoading }] = useCreatePlayerMutation();
  const [assign] = useAssignPlayerToTeamSeasonMutation();
  const { data: seasons } = useGetSeasonsQuery();
  const [useExisting, setUseExisting] = useState<boolean>(false);
  useEffect(() => {
    if (!allowExisting) setUseExisting(false);
  }, [allowExisting, isOpen]);
  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<FormData>({
    shouldUnregister: true,
    defaultValues: {
      firstName: "",
      lastName: "",
      nickname: "",
      email: "",
      team: null,
      season: null,
      image: "",
      playerImage: "",
      existingPlayerId: "",
      captain: false
    }
  });

  const selectedTeam = watch("team");
  const selectedSeason = watch("season");
  const { data: availablePlayers } = useGetAvailablePlayersForSeasonQuery(
    selectedTeam && selectedSeason
      ? { teamId: selectedTeam.value, seasonId: selectedSeason.value }
      : { teamId: "", seasonId: "" },
    { skip: !allowExisting || !selectedTeam || !selectedSeason }
  );

  useEffect(() => {
    if (isOpen && teamOptions && teamOptions.length === 1) {
      setValue("team", teamOptions[0]);
    }
  }, [isOpen, teamOptions, setValue]);

  useEffect(() => {
    if (isOpen && seasons && seasons.length > 0) {
      const targetId = defaultSeasonId ?? String(seasons[0].id);
      const found = seasons.find(s => String(s.id) === String(targetId));
      if (found) {
        setValue("season", { value: String(found.id), label: found.name });
      }
    }
  }, [isOpen, seasons, setValue, defaultSeasonId]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    // csapat és szezon opcionális: ha nincs kiválasztva, csak játékost hozunk létre, hozzárendelés nélkül
    try {
      const effectiveSeasonId = data.season?.value || defaultSeasonId;
      const effectiveTeamId = data.team?.value || (teamOptions.length === 1 ? teamOptions[0].value : undefined);
      if (useExisting) {
        if (!data.existingPlayerId || !effectiveTeamId || !effectiveSeasonId) return;
        await assign({ teamId: effectiveTeamId, playerId: data.existingPlayerId, seasonId: effectiveSeasonId, captain: !!data.captain }).unwrap();
        toast.success("Játékos sikeresen hozzárendelve a csapathoz");
      } else {
        const created = await createPlayer({
          teamId: effectiveTeamId,
          nickname: data.nickname,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        }).unwrap();
        toast.success("Játékos sikeresen létrehozva");
        if (effectiveTeamId && effectiveSeasonId) {
          await assign({ teamId: effectiveTeamId, playerId: created.id, seasonId: effectiveSeasonId, captain: !!data.captain }).unwrap();
          toast.success("Játékos hozzárendelve a kiválasztott csapathoz és szezonhoz");
        }
      }
      onClose();
    } catch (e) {
      console.error("Nem sikerült a hozzárendelés", e);
      toast.error("Hiba történt a művelet közben");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
      setValue("playerImage", url);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
      setValue("playerImage", url);
    }
  };

  return (
    <AnimatedModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={<span className={bebasNeue.className}>Új játékos hozzáadása</span>}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <motion.div 
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Mód választás */}
          {allowExisting && (
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                className={`px-3 py-2 rounded ${!useExisting ? 'bg-[#ff5c1a] text-white' : 'bg-black/40 text-white'}`}
                onClick={() => setUseExisting(false)}
              >
                Új játékos
              </button>
              <button
                type="button"
                className={`px-3 py-2 rounded ${useExisting ? 'bg-[#ff5c1a] text-white' : 'bg-black/40 text-white'}`}
                onClick={() => setUseExisting(true)}
              >
                Meglévő játékos
              </button>
            </div>
          )}

          {!useExisting && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={itemVariants}
            >
              {/* Kép feltöltése */}
              <div className="flex flex-col items-center justify-center">
                <p className="text-[#ff5c1a] font-bold mb-4">Játékos kép</p>
                <motion.div 
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-32 h-32 rounded-full border-4 border-[#ff5c1a] bg-white/10 flex items-center justify-center overflow-hidden">
                    {previewImage ? (
                      <Image src={previewImage} alt="Player Image" width={120} height={120} className="object-cover w-full h-full" />
                    ) : (
                      <FiUpload className="w-12 h-12 text-[#ff5c1a]" />
                    )}
                  </div>
                  <motion.label 
                    className="absolute bottom-0 right-0 bg-[#ff5c1a] p-2 rounded-full cursor-pointer shadow-lg hover:bg-[#ff7c3a] transition-colors"
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiUpload className="text-white w-5 h-5" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageChange}
                    />
                  </motion.label>
                </motion.div>
                {errors.playerImage && <p className="text-red-500 mt-2">A játékos képe kötelező</p>}
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[#ff5c1a] font-bold mb-2">Keresztnév</label>
                  <input
                    {...register("firstName", { required: "A keresztnév kötelező" })}
                    className="w-full bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5c1a] hover:border-[#ff7c3a] transition-colors"
                    placeholder="Add meg a keresztnevet"
                  />
                  {errors.firstName && <p className="text-red-500 mt-2">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-[#ff5c1a] font-bold mb-2">Vezetéknév</label>
                  <input
                    {...register("lastName", { required: "A vezetéknév kötelező" })}
                    className="w-full bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5c1a] hover:border-[#ff7c3a] transition-colors"
                    placeholder="Add meg a vezetéknevet"
                  />
                  {errors.lastName && <p className="text-red-500 mt-2">{errors.lastName.message}</p>}
                </div>
                <div>
                  <label className="block text-[#ff5c1a] font-bold mb-2">Becenév</label>
                  <input
                    {...register("nickname", { required: "A becenév kötelező" })}
                    className="w-full bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5c1a] hover:border-[#ff7c3a] transition-colors"
                    placeholder="Add meg a becenevet"
                  />
                  {errors.nickname && <p className="text-red-500 mt-2">{errors.nickname.message}</p>}
                </div>
                <div>
                  <label className="block text-[#ff5c1a] font-bold mb-2">E-mail</label>
                  <input
                    {...register("email", { required: "Az e-mail kötelező" })}
                    className="w-full bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5c1a] hover:border-[#ff7c3a] transition-colors"
                    placeholder="Add meg az e-mail címet"
                    type="email"
                  />
                  {errors.email && <p className="text-red-500 mt-2">{errors.email.message}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* Csapat és szezon kiválasztása */}
          <motion.div 
            className="mt-4"
            variants={itemVariants}
          >
            <label className="block text-[#ff5c1a] font-bold mb-2">Hozzárendelés csapathoz</label>
            <Controller
              name="team"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={teamOptions}
                  styles={selectStyles}
                  placeholder="Keresés és csapat kiválasztása..."
                  components={{ DropdownIndicator }}
                  isClearable
                  className="team-select"
                />
              )}
            />
            <div className="mt-4">
              <label className="block text-[#ff5c1a] font-bold mb-2">Szezon</label>
              <Controller
                name="season"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={(seasons || []).map(s => ({ value: String(s.id), label: s.name }))}
                    styles={selectStyles}
                    placeholder="Válassz szezont..."
                    components={{ DropdownIndicator }}
                    className="team-select"
                  />
                )}
              />
            </div>

            {allowExisting && useExisting && (
              <div className="mt-4">
                <label className="block text-[#ff5c1a] font-bold mb-2">Meglévő játékos</label>
                <select
                  {...register('existingPlayerId')}
                  className="w-full bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5c1a] hover:border-[#ff7c3a] transition-colors"
                >
                  <option value="">Válassz játékost...</option>
                  {(availablePlayers || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nickname} {p.firstName ? `(${p.firstName} ${p.lastName ?? ''})` : ''}
                    </option>
                  ))}
                </select>
                {selectedTeam && selectedSeason && (availablePlayers?.length === 0) && (
                  <p className="text-sm text-white/70 mt-2">Nincs hozzárendelhető játékos ehhez a szezonhoz.</p>
                )}
              </div>
            )}

            {/* Kapitány beállítása */}
            <div className="mt-4 flex items-center gap-3">
              <input
                id="captain"
                type="checkbox"
                {...register('captain')}
                className="w-5 h-5 accent-[#ff5c1a]"
              />
              <label htmlFor="captain" className="text-white">Csapatkapitány erre a szezonra</label>
            </div>
          </motion.div>

          {/* Műveletek */}
          <motion.div className="flex justify-end gap-4 mt-8" variants={itemVariants}>
            <button
              type="button"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
              onClick={onClose}
            >
              <FiX className="w-5 h-5" /> Mégse
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#ff5c1a] text-white hover:bg-[#ff7c3a] font-bold transition-colors"
            >
              <FiUserPlus className="w-5 h-5" /> {useExisting ? 'Hozzárendelés' : 'Játékos létrehozása'}
            </button>
          </motion.div>
        </motion.div>
      </form>
    </AnimatedModal>
  );
} 