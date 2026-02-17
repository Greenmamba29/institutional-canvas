import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const WATCHLIST_KEY = "lithiumbuy_auction_watchlist";

function getWatchlist(): string[] {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
  } catch {
    return [];
  }
}

function setWatchlist(ids: string[]) {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable
  }
}

export function isWatched(auctionId: string): boolean {
  return getWatchlist().includes(auctionId);
}

export function getWatchedIds(): string[] {
  return getWatchlist();
}

interface WatchButtonProps {
  auctionId: string;
  variant?: "icon" | "default";
  className?: string;
}

export function WatchButton({ auctionId, variant = "icon", className }: WatchButtonProps) {
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    setWatched(isWatched(auctionId));
  }, [auctionId]);

  const toggle = useCallback(() => {
    const list = getWatchlist();
    if (list.includes(auctionId)) {
      setWatchlist(list.filter((id) => id !== auctionId));
      setWatched(false);
      toast("Removed from watchlist");
    } else {
      setWatchlist([...list, auctionId]);
      setWatched(true);
      toast.success("Added to watchlist");
    }
  }, [auctionId]);

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        className={cn("shrink-0", className)}
        aria-label={watched ? "Unwatch auction" : "Watch auction"}
      >
        {watched ? (
          <Eye className="h-4 w-4 text-primary" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={watched ? "secondary" : "outline"}
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      className={className}
    >
      {watched ? (
        <Eye className="h-4 w-4 mr-1.5 text-primary" />
      ) : (
        <EyeOff className="h-4 w-4 mr-1.5" />
      )}
      {watched ? "Watching" : "Watch"}
    </Button>
  );
}
