import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getInitialSongs, loadSongs } from "@/data/songs";
import { Song } from "@/types/song";
import { Header } from "@/components/Header";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SongDetail = () => {
  const { id } = useParams();
  const [songs, setSongs] = useState<Song[]>(() => getInitialSongs());
  const [syncComplete, setSyncComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncSongs = async () => {
      try {
        const remoteSongs = await loadSongs();
        if (isMounted) {
          setSongs(remoteSongs);
        }
      } catch (error) {
        console.warn("Using fallback songs due to sync error", error);
      } finally {
        if (isMounted) {
          setSyncComplete(true);
        }
      }
    };

    syncSongs();

    return () => {
      isMounted = false;
    };
  }, []);

  const numericId = Number(id);
  const song = songs.find((s) => s.id === numericId);

  if (!song) {
    if (!syncComplete) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container py-12 px-4">
            <p className="text-center text-muted-foreground">
              Sincronizando canciones...
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 px-4">
          <p className="text-center text-muted-foreground">
            Canción no encontrada
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-3xl py-8 px-4">
        <Link to="/">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 gap-2 hover:gap-3 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div className="rounded-2xl bg-card p-8 shadow-[var(--shadow-card)]">
          <h1 className="text-xl font-semibold text-foreground mb-6 pb-3 border-b border-border">
            {song.title}
          </h1>
          <div className="prose prose-slate max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground/90">
              {song.lyrics}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongDetail;
