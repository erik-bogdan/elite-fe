"use client";

import { useState } from "react";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { Bebas_Neue } from "next/font/google";
import { FiUpload, FiUserPlus, FiPlusCircle, FiX, FiSearch } from "react-icons/fi";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import AnimatedModal from "./AnimatedModal";
import { useCreateTeamMutation, useUploadTeamLogoMutation } from "@/lib/features/apiSlice";
import Select, { StylesConfig, components } from "react-select";
import { Controller } from "react-hook-form";

const bebasNeue = Bebas_Neue({
    weight: "400",
    subsets: ["latin"],
});

interface FormData {
    name: string;
    logo: string;
    players: {
        id?: number;
        firstName: string;
        lastName: string;
        email: string;
        nickname: string;
        isExisting: boolean;
    }[];
    existingPlayers: Player[];
}

interface Player {
    value: number;
    label: string;
    data: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
}

interface AddTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
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

const selectStyles: StylesConfig<Player, true> = {
    control: (styles) => ({
        ...styles,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderColor: '#ff5c1a',
        borderWidth: '2px',
        borderRadius: '0.5rem',
        padding: '2px',
        width: '100%',
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
    multiValue: (styles) => ({
        ...styles,
        backgroundColor: 'rgba(255, 92, 26, 0.2)',
        borderRadius: '0.3rem',
    }),
    multiValueLabel: (styles) => ({
        ...styles,
        color: 'white',
    }),
    multiValueRemove: (styles) => ({
        ...styles,
        color: 'white',
        '&:hover': {
            backgroundColor: 'rgba(255, 92, 26, 0.8)',
            color: 'white',
        },
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

export default function AddTeamModal({ isOpen, onClose }: AddTeamModalProps) {
    const [previewLogo, setPreviewLogo] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [createTeam, { isLoading }] = useCreateTeamMutation();
    const [uploadTeamLogo] = useUploadTeamLogoMutation();

    // Mock existing players for demonstration
    const existingPlayers = [
        { id: 1, firstName: "John", lastName: "Doe", email: "john@example.com" },
        { id: 2, firstName: "Jane", lastName: "Smith", email: "jane@example.com" },
        { id: 3, firstName: "Mike", lastName: "Johnson", email: "mike@example.com" },
        { id: 4, firstName: "Sarah", lastName: "Williams", email: "sarah@example.com" },
        { id: 5, firstName: "James", lastName: "Brown", email: "james@example.com" },
        { id: 6, firstName: "Emily", lastName: "Davis", email: "emily@example.com" },
        { id: 7, firstName: "David", lastName: "Miller", email: "david@example.com" },
        { id: 8, firstName: "Anna", lastName: "Wilson", email: "anna@example.com" },
    ];

    // Transform players for react-select
    const playerOptions: Player[] = existingPlayers.map(player => ({
        value: player.id,
        label: `${player.firstName} ${player.lastName} (${player.email})`,
        data: player
    }));

    const { register, control, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
        defaultValues: {
            name: "",
            logo: "",
            players: [{ firstName: "", lastName: "", email: "", nickname: "", isExisting: false }],
            existingPlayers: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "players"
    });

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        const existingPlayersPayload = (data.existingPlayers || []).map((p: any) => ({ id: String(p.id) }));
        const newPlayersPayload = (data.players || [])
            .filter((p) => !p.isExisting && p.nickname && p.nickname.trim().length > 0)
            .map((p) => ({
                nickname: p.nickname,
                firstName: p.firstName || undefined,
                lastName: p.lastName || undefined,
                email: p.email || undefined,
            }));

        const payload: any = {
            name: data.name,
            players: [...existingPlayersPayload, ...newPlayersPayload],
        };

        try {
            const created = await createTeam(payload).unwrap();
            if (logoFile && created?.id) {
                try {
                    await uploadTeamLogo({ id: String(created.id), file: logoFile }).unwrap();
                } catch (e) {
                    console.error('Team logo upload failed', e);
                }
            }
            onClose();
        } catch (err) {
            console.error("Failed to create team", err);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setPreviewLogo(url);
            setValue("logo", url);
            setLogoFile(file);
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
            setPreviewLogo(url);
            setValue("logo", url);
            setLogoFile(file);
        }
    };

    return (
        <AnimatedModal
            isOpen={isOpen}
            onClose={onClose}
            title={<span className={bebasNeue.className}>Új Csapat</span>}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                <motion.div
                    className="space-y-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Team info section */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        variants={itemVariants}
                    >
                        {/* Logo upload */}
                        <div className="flex flex-col items-center justify-center">
                            <label htmlFor="logo" className="block text-[#ff5c1a] font-bold mb-2">
                                Csapat Logo
                            </label>
                            <div
                                className="relative w-24 h-24 mb-2 border-2 border-dashed border-[#ff5c1a] rounded-full flex items-center justify-center cursor-pointer hover:border-[#ff7c3a] transition-colors"
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('logo-upload')?.click()}
                            >
                                <Image
                                    src={previewLogo || "/elitelogo.png"}
                                    alt="Team Logo"
                                    width={96}
                                    height={96}
                                    className="rounded-full object-cover"
                                />
                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                                    <FiUpload className="text-white w-6 h-6" />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[#ff5c1a] font-bold mb-2">Csapat Név</label>
                                <input
                                    {...register("name", { required: "Team name is required" })}
                                    className="w-full bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5c1a] hover:border-[#ff7c3a] transition-colors"
                                    placeholder="Enter team name"
                                />
                                {errors.name && <p className="text-red-500 mt-2">{errors.name.message}</p>}
                            </div>
                        </div>
                    </motion.div>

                    {/* Players section */}
                    <motion.div
                        className="mt-8"
                        variants={itemVariants}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`${bebasNeue.className} text-xl text-[#ff5c1a]`}>Csapat Játékosok</h3>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => append({ firstName: "", lastName: "", email: "", nickname: "", isExisting: false })}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff5c1a] text-white hover:bg-[#ff7c3a] transition-colors"
                                >
                                    <FiPlusCircle className="w-5 h-5" /> Új Játékos
                                </button>

                            </div>
                        </div>
                        <div className="w-full py-4">
                            <Controller
                                name="existingPlayers"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={playerOptions}
                                        styles={selectStyles}
                                        placeholder="Meglévő játékos hozzáadása..."
                                        components={{ DropdownIndicator }}
                                        isMulti
                                        className="w-full"
                                    />
                                )}
                            />
                        </div>
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <motion.div
                                    key={field.id}
                                    className="p-4 bg-black/30 rounded-lg border border-[#ff5c1a]"
                                    variants={itemVariants}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className={`${bebasNeue.className} text-lg text-white`}>Játékos {index + 1}</h4>
                                        {index > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="text-red-500 hover:text-red-600 transition-colors"
                                            >
                                                <FiX className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[#ff5c1a] font-bold mb-2">Keresztnév</label>
                                            <input
                                                {...register(`players.${index}.firstName`, { required: "A keresztnév kötelező" })}
                                                className="w-full bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5c1a] hover:border-[#ff7c3a] transition-colors"
                                                placeholder="Add meg a keresztnevet"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[#ff5c1a] font-bold mb-2">Vezetéknév</label>
                                            <input
                                                {...register(`players.${index}.lastName`, { required: "A vezetéknév kötelező" })}
                                                className="w-full bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5c1a] hover:border-[#ff7c3a] transition-colors"
                                                placeholder="Add meg a vezetéknevet"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[#ff5c1a] font-bold mb-2">Email</label>
                                            <input
                                                {...register(`players.${index}.email`, { required: "Az e-mail cím kötelező" })}
                                                className="w-full bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5c1a] hover:border-[#ff7c3a] transition-colors"
                                                placeholder="Add meg az e-mail címet"
                                                type="email"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[#ff5c1a] font-bold mb-2">Becenév</label>
                                            <input
                                                {...register(`players.${index}.nickname`, { required: "A becenév kötelező" })}
                                                className="w-full bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5c1a] hover:border-[#ff7c3a] transition-colors"
                                                placeholder="Add meg a becenevet"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Submit button */}
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
                            <FiUserPlus className="w-5 h-5" /> Csapat létrehozása
                        </button>
                    </motion.div>
                </motion.div>
            </form>
        </AnimatedModal>
    );
} 