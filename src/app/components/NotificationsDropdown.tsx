"use client";

import { useState } from "react";
import { Bebas_Neue } from "next/font/google";
import { FiBell, FiCheck, FiTrash2 } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const notifications: Notification[] = [
  /*{
    id: "1",
    title: "New Match Scheduled",
    message: "Your team has been scheduled to play against Beer Masters tomorrow at 20:00.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    title: "League Update",
    message: "Your team has moved up to 1st place in the league standings!",
    time: "1 day ago",
    read: false,
  },
  {
    id: "3",
    title: "Match Result",
    message: "Your team won against Pong Kings with a score of 10-4!",
    time: "2 days ago",
    read: true,
  },*/
];

export default function NotificationsDropdown() {
  const [unreadCount, setUnreadCount] = useState(
    notifications.filter((n) => !n.read).length
  );

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative p-2 hover:bg-[#ff5c1a] hover:bg-opacity-20 rounded-full transition-colors cursor-pointer"
        >
          <FiBell className="h-6 w-6 md:h-7 md:w-7 text-[#ff5c1a]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 bg-[#ff5c1a] rounded-full text-xs flex items-center justify-center text-white font-bold shadow-lg shadow-[#ff5c1a]/40">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 bg-[#002b6b]/95 backdrop-blur-md border-2 border-[#ff5c1a] shadow-xl shadow-[#ff5c1a33]"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#ff5c1a]">
          <h3 className={`${bebasNeue.className} text-lg text-white`}>
            Értesítések
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[#ff5c1a] hover:text-[#ff7c3a] hover:bg-[#ff5c1a]/10"
              onClick={markAllAsRead}
            >
              Összes olvasva
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2">
            {notifications.length === 0 && (
              <div className="text-white/70">Nincs értesítés</div>
            )}
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg mb-2 transition-colors ${
                  notification.read
                    ? "bg-white/5"
                    : "bg-[#ff5c1a]/10 hover:bg-[#ff5c1a]/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-[#e0e6f7] mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-[#ff5c1a]">{notification.time}</p>
                  </div>
                  <div className="flex gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#ff5c1a] hover:text-[#ff7c3a] hover:bg-[#ff5c1a]/10"
                      >
                        <FiCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#ff5c1a] hover:text-[#ff7c3a] hover:bg-[#ff5c1a]/10"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 