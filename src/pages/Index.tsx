import { Header } from "@/components/Header";
import { SongCard } from "@/components/SongCard";
import { songs } from "@/data/songs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(songs.map(song => song.category)));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 px-4">
        <div className="mb-12 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            Biblioteca de Letras
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre y explora una colección de himnos y canciones espirituales
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar canciones, artistas o categorías..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-border bg-card shadow-sm"
            />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2 justify-center">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSearchQuery(category)}
              className="px-4 py-2 text-sm font-medium rounded-full bg-secondary hover:bg-accent/10 hover:text-accent transition-colors"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSongs.map(song => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>

        {filteredSongs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron canciones</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
