
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { GameGrid } from '@/components/GameGrid';
import { GameDetail } from '@/components/GameDetail';
import { SearchFilters } from '@/components/SearchFilters';
import { MusicPlayer } from '@/components/MusicPlayer';
import type { Game, GameWithSongs, GameCategory, SongWithRating, GameSearchInput } from '../../server/src/schema';

function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<GameCategory[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameWithSongs | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentSong, setCurrentSong] = useState<SongWithRating | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Load initial data
  const loadFeaturedGames = useCallback(async () => {
    try {
      const result = await trpc.getFeaturedGames.query();
      setFeaturedGames(result);
      if (result.length === 0) {
        // Fallback to all games if no featured games
        const allGames = await trpc.getGames.query();
        setFeaturedGames(allGames);
      }
    } catch (error) {
      console.error('Failed to load featured games:', error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    loadFeaturedGames();
    loadCategories();
  }, [loadFeaturedGames, loadCategories]);

  const handleSearch = async (query: string, filters?: Partial<GameSearchInput>) => {
    if (!query.trim() && !filters) {
      setGames([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = await trpc.searchGames.query({
        query: query.trim() || undefined,
        ...filters
      });
      setGames(result);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGameClick = async (gameId: number) => {
    try {
      const gameDetail = await trpc.getGameById.query(gameId);
      if (gameDetail) {
        setSelectedGame(gameDetail);
        setShowDetail(true);
      }
    } catch (error) {
      console.error('Failed to load game details:', error);
    }
  };

  const handlePlaySong = (song: SongWithRating) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                🎲 GameTunes
              </h1>
              {showDetail && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetail(false)}
                  className="text-purple-300 hover:text-white"
                >
                  ← Back to Browse
                </Button>
              )}
            </div>
            
            {!showDetail && (
              <div className="flex items-center space-x-4 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search games..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showDetail && selectedGame ? (
          <GameDetail
            game={selectedGame}
            onPlaySong={handlePlaySong}
            currentSong={currentSong}
            isPlaying={isPlaying}
          />
        ) : (
          <>
            {/* Search Filters */}
            {(searchQuery || games.length > 0) && (
              <div className="mb-8">
                <SearchFilters
                  categories={categories}
                  onFiltersChange={(filters) => handleSearch(searchQuery, filters)}
                  isLoading={isSearching}
                />
              </div>
            )}

            {/* Search Results */}
            {games.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Search Results {isSearching && '🔍'}
                </h2>
                <GameGrid 
                  games={games} 
                  onGameClick={handleGameClick}
                  isLoading={isSearching}
                />
              </section>
            )}

            {/* Featured Games */}
            {games.length === 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  ✨ Featured Games
                </h2>
                {featuredGames.length === 0 ? (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-8 text-center">
                      <div className="text-gray-400 mb-4">🎲</div>
                      <p className="text-gray-300">No games available yet.</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Add some games to get started!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <GameGrid 
                    games={featuredGames} 
                    onGameClick={handleGameClick}
                  />
                )}
              </section>
            )}

            {/* Categories Preview */}
            {categories.length > 0 && games.length === 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">🎯 Categories</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {categories.map((category: GameCategory) => (
                    <Card 
                      key={category.id}
                      className="bg-gradient-to-br from-purple-800/30 to-pink-800/30 border-purple-500/30 hover:border-purple-400/50 transition-all cursor-pointer group"
                      onClick={() => handleSearch('', { category_ids: [category.id] })}
                    >
                      <CardContent className="p-4 text-center">
                        <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Music Player */}
      {currentSong && (
        <MusicPlayer
          song={currentSong}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onNext={() => {
            // TODO: Implement next song logic
            console.log('Next song');
          }}
          onPrevious={() => {
            // TODO: Implement previous song logic
            console.log('Previous song');
          }}
        />
      )}
    </div>
  );
}

export default App;
