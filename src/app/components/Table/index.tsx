"use client";

import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({
    weight: "400",
    subsets: ["latin"],
});

type TableRecord = {
    column: string;
    value: string;
};

type TableProps = {
    records: {
        header: TableRecord[];
        rows: TableRecord[][];
    };
    highlightRowIndex?: number; // Optionally highlight a row (e.g. current user)
};

export default function Table({ records, highlightRowIndex }: TableProps) {
    return (
        <div className="overflow-x-auto w-full">
            <table className="w-full rounded-2xl bg-black/40 shadow-xl border-2 border-[#ff5c1a] text-xs overflow-hidden">
                <thead>
                    <tr className="bg-[#ff5c1a] text-white font-bold">
                        {records.header.map((header, idx) => (
                            <th
                                key={idx}
                                className={`${bebasNeue.className} px-1 py-1 text-left font-bold whitespace-nowrap ${idx === 0 ? 'rounded-tl-2xl' : ''} ${idx === records.header.length - 1 ? 'rounded-tr-2xl' : ''}`}
                            >
                                {header.value}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {records.rows.map((row, rowIndex) => {
                        // Highlight row if index matches
                        const isHighlight = highlightRowIndex === rowIndex || row.some(cell => cell.value.toLowerCase().includes('you'));
                        return (
                            <tr
                                key={rowIndex}
                                className={
                                    `${isHighlight ? 'bg-[#ff5c1a]/80 text-white shadow-lg shadow-[#ff5c1a]/30' : rowIndex % 2 === 0 ? 'bg-white/10 text-white' : 'bg-white/5 text-white'} ` +
                                    'transition hover:shadow-[0_0_16px_0_#ff5c1a99] hover:z-10 h-8'
                                }
                            >
                                {row.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className={`px-1 py-1 ${cell.column === 'pos' ? 'font-bold text-[#ff5c1a] whitespace-nowrap' : ''} ${rowIndex === records.rows.length - 1 && cellIndex === 0 ? 'rounded-bl-2xl' : ''} ${rowIndex === records.rows.length - 1 && cellIndex === row.length - 1 ? 'rounded-br-2xl' : ''}`}
                                    >
                                        {cell.value}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
