"use client";

import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Bebas_Neue } from "next/font/google";
import { FiSave, FiX } from "react-icons/fi";
import { motion, Variants } from "framer-motion";
import AnimatedModal from "../../teams/components/AnimatedModal";
import { useUpdatePlayerMutation } from "@/lib/features/apiSlice";
import { StylesConfig } from "react-select";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: {
    id: string;
    firstName?: string;
    lastName?: string;
    nickname: string;
    email?: string;
    shirtSize?: string | null;
  };
}

interface FormData {
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  shirtSize?: string;
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

const selectStyles: StylesConfig<any, false> = {
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

export default function EditPlayerModal({ isOpen, onClose, player }: EditPlayerModalProps) {
  const [updatePlayer, { isLoading }] = useUpdatePlayerMutation();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    defaultValues: {
      firstName: player.firstName,
      lastName: player.lastName,
      nickname: player.nickname,
      email: player.email,
      shirtSize: player.shirtSize || undefined,
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        firstName: player.firstName || '',
        lastName: player.lastName || '',
        nickname: player.nickname,
        email: player.email || '',
        shirtSize: player.shirtSize || undefined,
      });
    }
  }, [isOpen, player, reset]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    await updatePlayer({ id: player.id, player: {
      firstName: data.firstName,
      lastName: data.lastName,
      nickname: data.nickname,
      email: data.email,
      shirtSize: data.shirtSize,
    }});
    onClose();
  };

  return (
    <AnimatedModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={<span className={bebasNeue.className}>Edit Player</span>}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <motion.div 
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Player info section */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={itemVariants}
          >
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[#ff5c1a] font-bold mb-2">First Name</label>
                <input
                  {...register("firstName")}
                  className="w-full bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5c1a] hover:border-[#ff7c3a] transition-colors"
                  placeholder="Enter first name"
                />
                {errors.firstName && <p className="text-red-500 mt-2">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-[#ff5c1a] font-bold mb-2">Last Name</label>
                <input
                  {...register("lastName")}
                  className="w-full bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5c1a] hover:border-[#ff7c3a] transition-colors"
                  placeholder="Enter last name"
                />
                {errors.lastName && <p className="text-red-500 mt-2">{errors.lastName.message}</p>}
              </div>
              <div>
                <label className="block text-[#ff5c1a] font-bold mb-2">Nickname</label>
                <input
                  {...register("nickname", { required: "Nickname is required" })}
                  className="w-full bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5c1a] hover:border-[#ff7c3a] transition-colors"
                  placeholder="Enter nickname"
                />
                {errors.nickname && <p className="text-red-500 mt-2">{errors.nickname.message}</p>}
              </div>
              <div>
                <label className="block text-[#ff5c1a] font-bold mb-2">Email</label>
                <input
                  {...register("email")}
                  className="w-full bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5c1a] hover:border-[#ff7c3a] transition-colors"
                  placeholder="Enter email"
                  type="email"
                />
                {errors.email && <p className="text-red-500 mt-2">{String(errors.email.message)}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[#ff5c1a] font-bold mb-2">Shirt Size</label>
                <select
                  {...register("shirtSize")}
                  className="w-full bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5c1a] hover:border-[#ff7c3a] transition-colors"
                >
                  <option value="">Not set</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="XXXL">XXXL</option>
                  <option value="XXXXL">XXXXL</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Submit button */}
          <motion.div className="flex justify-end gap-4 mt-8" variants={itemVariants}>
            <button
              type="button"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
              onClick={onClose}
            >
              <FiX className="w-5 h-5" /> Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#ff5c1a] text-white hover:bg-[#ff7c3a] font-bold transition-colors disabled:opacity-60"
            >
              <FiSave className="w-5 h-5" /> Save Changes
            </button>
          </motion.div>
        </motion.div>
      </form>
    </AnimatedModal>
  );
} 