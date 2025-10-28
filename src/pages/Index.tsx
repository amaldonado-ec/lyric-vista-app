import { Header } from "@/components/Header";
import { songs } from "@/data/songs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Artista</TableHead>
                <TableHead>Categoría</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSongs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    No se encontraron canciones
                  </TableCell>
                </TableRow>
              ) : (
                filteredSongs.map((song) => (
                  <TableRow key={song.id} className="hover:bg-accent/5 cursor-pointer">
                    <TableCell className="font-medium text-muted-foreground">
                      {song.id}
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/song/${song.id}`} 
                        className="font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {song.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{song.artist}</TableCell>
                    <TableCell>
                      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent">
                        {song.category}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default Index;
