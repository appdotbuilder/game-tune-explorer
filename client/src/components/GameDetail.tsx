
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { 
  Star, 
  Users, 
  Clock, 
  BarChart3, 
  Play, 
  Pause, 
  Youtube,
  Music,
  ShoppingCart
} from 'lucide-react';
import type { GameWithSongs, SongWithRating } from '../../../server/src/schema';

interface GameDetailProps {
  game: GameWithSongs;
  onPlaySong: (song: SongWithRating) => void;
  currentSong: SongWithRating | null;
  isPlaying: boolean;
}

export function GameDetail({ game, onPlaySong, currentSong, isPlaying }: GameDetailProps) {
  const [userRatings, setUserRatings] = useState<{ [songId: number]: number }>({});

  const handleRateSong = useCallback(async (songId: number, rating: number) => {
    try {
      // Get user IP (stub implementation)
      const userIp = '127.0.0.1'; // This would be determined by the backend in real implementation
      
      await trpc.rateSong.mutate({
        song_id: songId,
        user_ip: userIp,
        rating
      });
      
      setUserRatings((prev: { [songId: number]: number }) => ({ 
        ...prev, 
        [songId]: rating 
      }));
    } catch (error) {
      console.error('Failed to rate song:', error);
    }
  }, []);

  const renderStarRating = (songId: number, currentRating?: number) => {
    const userRating = userRatings[songId];
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRateSong(songId, star)}
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            <Star 
              className={`h-4 w-4 ${
                star <= (userRating || 0) ? 'fill-current' : 'stroke-current fill-transparent'
              }`} 
            />
          </button>
        ))}
        {currentRating && (
          <span className="text-sm text-gray-400 ml-2">
            {currentRating.toFixed(1)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Game Cover */}
          <div className="flex-shrink-0">
            <div className="w-80 h-80 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg overflow-hidden">
              {game.cover_image_url ? (
                <img
                  src={game.cover_image_url}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">
                  🎲
                </div>
              )}
            </div>
          </div>

          {/* Game Info */}
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{game.name}</h1>
              <p className="text-xl text-gray-300">{game.description}</p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              <Badge variant="secondary" className="bg-purple-900/50 text-purple-300 px-3 py-1">
                <Users className="h-4 w-4 mr-2" />
                {game.min_players === game.max_players 
                  ? `${game.min_players} Players` 
                  : `${game.min_players}-${game.max_players} Players`}
              </Badge>
              <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 px-3 py-1">
                <Clock className="h-4 w-4 mr-2" />
                {game.playtime_minutes} minutes
              </Badge>
              <Badge variant="secondary" className="bg-green-900/50 text-green-300 px-3 py-1">
                <BarChart3 className="h-4 w-4 mr-2" />
                Complexity {game.complexity_rating}/5
              </Badge>
              <Badge variant="secondary" className="bg-orange-900/50 text-orange-300 px-3 py-1">
                Age {game.age_rating}+
              </Badge>
            </div>

            {/* BGG Rating */}
            {game.bgg_rating && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-yellow-400">
                  <Star className="h-5 w-5 mr-2 fill-current" />
                  <span className="text-xl font-semibold">{game.bgg_rating.toFixed(1)}</span>
                  <span className="text-gray-400 ml-1">/10 BGG Rating</span>
                </div>
                {game.bgg_rank && (
                  <div className="text-gray-300">
                    Rank #{game.bgg_rank}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {game.youtube_tutorial_url && (
                <Button 
                  variant="secondary" 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => window.open(game.youtube_tutorial_url!, '_blank')}
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  Watch Tutorial
                </Button>
              )}
              {game.amazon_link && (
                <Button 
                  variant="secondary"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => window.open(game.amazon_link!, '_blank')}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy on Amazon
                </Button>
              )}
              {game.bol_link && (
                <Button 
                  variant="secondary"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => window.open(game.bol_link!, '_blank')}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy on Bol.com
                </Button>
              )}
            </div>

            {/* Categories */}
            {game.categories.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {game.categories.map((category) => (
                    <Badge key={category.id} variant="outline" className="border-purple-500/50 text-purple-300">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator className="bg-gray-700" />

      {/* Tabs Section */}
      <Tabs defaultValue="songs" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="songs" className="data-[state=active]:bg-purple-600">
            <Music className="h-4 w-4 mr-2" />
            Songs ({game.songs.length})
          </TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-purple-600">
            Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="songs" className="space-y-4">
          {game.songs.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-8 text-center">
                <Music className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-300">No songs available for this game yet.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Songs will be generated automatically using Suno AI.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {game.songs.map((song, index) => {
                const songWithRating: SongWithRating = {
                  ...song,
                  average_rating: null, // This would come from the backend
                  total_ratings: 0 // This would come from the backend
                };
                
                const isCurrentSong = currentSong?.id === song.id;
                
                return (
                  <Card key={song.id} className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400 text-sm w-6 text-center">
                              {index + 1}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onPlaySong(songWithRating)}
                              className="h-8 w-8 text-purple-400 hover:text-white hover:bg-purple-600/20"
                            >
                              {isCurrentSong && isPlaying ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{song.title}</h4>
                            {song.description && (
                              <p className="text-sm text-gray-400">{song.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-1">
                              {song.genre && (
                                <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                                  {song.genre}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                {Math.floor(song.duration_seconds / 60)}:
                                {(song.duration_seconds % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {renderStarRating(song.id, songWithRating.average_rating || undefined)}
                        </div>
                      </div>
                      
                      {isCurrentSong && (
                        <div className="mt-3">
                          <Progress value={0} className="h-1" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Game Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                  {game.rules_text}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
