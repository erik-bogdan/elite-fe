"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toBackendUrl } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { FiUpload, FiEye, FiMoreVertical, FiUserPlus } from "react-icons/fi";
import ActionMenu from "../../ActionMenu";
import AddPlayerModal from "../../../players/components/AddPlayerModal";
import { useDeletePlayerMutation, useGetTeamByIdQuery, useGetTeamPlayersBySeasonQuery, useUnassignPlayerFromTeamSeasonMutation, useGetAvailablePlayersForSeasonQuery, useAssignPlayerToTeamSeasonMutation, useUpdateTeamMutation, useUploadTeamLogoMutation } from "@/lib/features/apiSlice";
import { useGetSeasonsQuery } from "@/lib/features/season/seasonSlice";

type Player = { id: string; nickname: string; firstName?: string; lastName?: string; email?: string; captain?: boolean; shirtSize?: string };
const columnHelper = createColumnHelper<Player>();

export default function TeamViewPage() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const params = useParams();
  const teamId = String(params?.id ?? "");
  const { data: team, refetch: refetchTeam } = useGetTeamByIdQuery(teamId, { skip: !teamId });
  const { data: seasons } = useGetSeasonsQuery();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  useEffect(() => {
    if (!selectedSeasonId && seasons && seasons.length > 0) {
      setSelectedSeasonId(String(seasons[0].id));
    }
  }, [seasons, selectedSeasonId]);
  const { data: players, refetch } = useGetTeamPlayersBySeasonQuery({ teamId, seasonId: selectedSeasonId }, { skip: !teamId || !selectedSeasonId });
  const [unassign] = useUnassignPlayerFromTeamSeasonMutation();
  const { data: availablePlayers } = useGetAvailablePlayersForSeasonQuery({ teamId, seasonId: selectedSeasonId }, { skip: !teamId || !selectedSeasonId });
  const [assign] = useAssignPlayerToTeamSeasonMutation();
  const [uploadLogo] = useUploadTeamLogoMutation();
  const [logo, setLogo] = useState<string | null>(null);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);

  const columns = [
    columnHelper.accessor('captain', {
      id: 'captain',
      header: '',
      cell: info => (
        info.getValue() ? (
          <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-[#ff5c1a] text-white">CAP</span>
        ) : null
      ),
      size: 40,
    }),
    columnHelper.accessor((row) => `${row.nickname}${row.firstName ? ` (${row.firstName} ${row.lastName ?? ""})` : ""}` as any, {
      id: "name",
      header: "Name",
      cell: info => <span className="font-semibold text-white">{info.getValue()}</span>,
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: info => <span className="text-white">{info.getValue() || "-"}</span>,
    }),
    columnHelper.accessor("shirtSize", {
      header: "Pólóméret",
      cell: info => <span className="text-white">{info.getValue() || "-"}</span>,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: info => {
    const isOpen = activeDropdown === String(info.row.original.id);
        return (
          <>
            <button
              onClick={e => {
                if (isOpen) {
                  setActiveDropdown(null);
                  setMenuAnchor(null);
                } else {
              setActiveDropdown(String(info.row.original.id));
                  setMenuAnchor((e.currentTarget as HTMLElement).getBoundingClientRect());
                }
              }}
              className="p-2 hover:bg-[#ff5c1a]/10 rounded-lg transition-colors"
            >
              <FiMoreVertical className="w-5 h-5 text-[#ff5c1a]" />
            </button>
            {isOpen && menuAnchor && (
              <ActionMenu
                anchorRect={menuAnchor}
                onView={() => {
                  setActiveDropdown(null);
                  setMenuAnchor(null);
                  window.location.href = `/admin/players/${info.row.original.id}`;
                }}
                onRemove={async () => {
                  const playerId = String(info.row.original.id);
                  try {
                    await unassign({ teamId, playerId, seasonId: selectedSeasonId }).unwrap();
                    await refetch();
                  } catch (e) {
                    console.error('Nem sikerült eltávolítani a játékost a szezonból', e);
                  } finally {
                    setActiveDropdown(null);
                    setMenuAnchor(null);
                  }
                }}
                canPromoteCaptain={!info.row.original.captain}
                onPromoteCaptain={async () => {
                  const playerId = String(info.row.original.id);
                  try {
                    await assign({ teamId, playerId, seasonId: selectedSeasonId, captain: true }).unwrap();
                    await refetch();
                  } catch (e) {
                    console.error('Nem sikerült kapitánnyá tenni a játékost', e);
                  } finally {
                    setActiveDropdown(null);
                    setMenuAnchor(null);
                  }
                }}
                onClose={() => {
                  setActiveDropdown(null);
                  setMenuAnchor(null);
                }}
              />
            )}
          </>
        );
      },
      size: 60,
    }),
  ];

  const table = useReactTable({
    data: players || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      setLogo(preview);
      try {
        await uploadLogo({ id: teamId, file }).unwrap();
        await refetchTeam();
      } catch (err) {
        console.error('Logo feltöltés nem sikerült', err);
      }
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-10 space-y-10">
      {/* Team Header & Logo Upload */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-2xl shadow-2xl border border-[#ff5c1a]/40 p-8">
        <div className="relative group">
           <Image
            src={logo || toBackendUrl(team?.logo || undefined) || "/elitelogo.png"}
            alt="Team Logo"
            width={120}
            height={120}
            className="rounded-full border-4 border-[#ff5c1a] bg-white/10 object-cover shadow-lg"
          />
          <label className="absolute bottom-2 right-2 bg-[#ff5c1a] p-2 rounded-full cursor-pointer shadow-lg hover:bg-[#ff7c3a] transition-colors">
            <FiUpload className="text-white w-5 h-5" />
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </label>
        </div>
        <div className="flex-1 flex flex-col gap-2 items-center md:items-start">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-wide">{team?.name ?? "Csapat"}</h1>
          <span className="text-[#ff5c1a] text-lg font-semibold">Azonosító: {teamId}</span>
        </div>
      </div>

      {/* Seasons List */}
      <div className="bg-[#002b6b]/90 rounded-xl shadow-lg border border-[#ff5c1a] p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Szezonok és eredmények</h2>
        <ul className="divide-y divide-[#ff5c1a]/30">
          {(team?.seasons ?? []).map((season: any, idx: number) => (
            <li key={idx} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-white">{season.year}</span>
                <span className="text-[#ff5c1a] font-bold">{season.league}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white">{season.result}</span>
                <span className="text-[#ff5c1a] font-bold">{season.points} pts</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Players Table */}
      <div className="bg-[#002b6b]/90 rounded-xl shadow-lg border border-[#ff5c1a] p-6">
        <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-white">Szezon:</label>
            <select
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              className="bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-3 py-2"
            >
              {(seasons || []).map(s => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
          </div>
          <button
            className="flex items-center gap-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-bold px-5 py-2 rounded-lg shadow transition-colors"
            onClick={() => setIsAddPlayerOpen(true)}
          >
            <FiUserPlus className="w-5 h-5" />
            Játékos hozzáadása
          </button>
        </div>
   
        <div className="overflow-x-auto rounded-xl">
          <table className="min-w-full divide-y divide-[#ff5c1a] overflow-hidden rounded-xl">
            <thead className="bg-[#002b6b]">
              {table.getHeaderGroups().map((headerGroup: any, i: number) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header: any, j: number) => (
                    <th
                      key={header.id}
                      className={
                        `px-6 py-4 text-left text-base font-bold text-[#ff5c1a] tracking-wider uppercase whitespace-nowrap` +
                        (i === 0 && j === 0 ? ' rounded-tl-xl' : '') +
                        (i === 0 && j === headerGroup.headers.length - 1 ? ' rounded-tr-xl' : '')
                      }
                      style={{ width: header.getSize() }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-[#001a3a]/60 divide-y divide-[#ff5c1a]/30">
              {table.getRowModel().rows.map((row: any, rowIdx: number) => (
                <tr key={row.id} className="hover:bg-[#ff5c1a]/10 transition-colors">
                  {row.getVisibleCells().map((cell: any, cellIdx: number) => (
                    <td
                      key={cell.id}
                      className={
                        `px-6 py-4 align-middle whitespace-nowrap` +
                        (rowIdx === table.getRowModel().rows.length - 1 && cellIdx === 0 ? ' rounded-bl-xl' : '') +
                        (rowIdx === table.getRowModel().rows.length - 1 && cellIdx === row.getVisibleCells().length - 1 ? ' rounded-br-xl' : '')
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AddPlayerModal
        isOpen={isAddPlayerOpen}
        onClose={async () => {
          setIsAddPlayerOpen(false);
          try { await refetch(); } catch {}
        }}
        teamOptions={useMemo(() => (team ? [{ value: teamId, label: team?.name ?? teamId }] : []), [teamId, team])}
        allowExisting={true}
        defaultSeasonId={selectedSeasonId}
      />
    </div>
  );
} 