import { Song } from "@/types/song";
import { Link } from "react-router-dom";
import { Music2 } from "lucide-react";

interface SongCardProps {
  song: Song;
}

export const SongCard = ({ song }: SongCardProps) => {
  return (
    <Link to={`/song/${song.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:scale-[1.02]">
        <div className="aspect-square w-full overflow-hidden bg-secondary">
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20">
            <Music2 className="h-16 w-16 text-primary/30" />
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg text-foreground line-clamp-1 mb-1">
            {song.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
            {song.artist}
          </p>
          <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent">
            {song.category}
          </span>
        </div>
      </div>
    </Link>
  );
};
