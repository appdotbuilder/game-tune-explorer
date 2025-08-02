
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Users, Clock, BarChart3, Play } from 'lucide-react';
import type { Game } from '../../../server/src/schema';

interface GameGridProps {
  games: Game[];
  onGameClick: (gameId: number) => void;
  isLoading?: boolean;
}

export function GameGrid({ games, onGameClick, isLoading = false }: GameGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <Skeleton className="h-48 w-full bg-gray-700" />
              <Skeleton className="h-4 w-3/4 bg-gray-700" />
              <Skeleton className="h-3 w-1/2 bg-gray-700" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full bg-gray-700" />
                <Skeleton className="h-3 w-2/3 bg-gray-700" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-4">🎲</div>
          <p className="text-gray-300">No games found</p>
          <p className="text-sm text-gray-500 mt-2">
            Try adjusting your search or filters
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {games.map((game: Game) => (
        <Card
          key={game.id}
          className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group overflow-hidden"
          onClick={() => onGameClick(game.id)}
        >
          <CardHeader className="pb-2">
            <div className="relative aspect-square mb-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg overflow-hidden">
              {game.cover_image_url ? (
                <img
                  src={game.cover_image_url}
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  🎲
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button
                  size="icon"
                  className="bg-purple-600 hover:bg-purple-700 rounded-full"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onGameClick(game.id);
                  }}
                >
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardTitle className="text-white group-hover:text-purple-300 transition-colors line-clamp-2">
              {game.name}
            </CardTitle>
            <CardDescription className="text-gray-400 line-clamp-2">
              {game.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1 mb-3">
              <Badge variant="secondary" className="bg-purple-900/50 text-purple-300 text-xs">
                <Users className="h-3 w-3 mr-1" />
                {game.min_players === game.max_players 
                  ? `${game.min_players}` 
                  : `${game.min_players}-${game.max_players}`}
              </Badge>
              <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {game.playtime_minutes}min
              </Badge>
              <Badge variant="secondary" className="bg-green-900/50 text-green-300 text-xs">
                <BarChart3 className="h-3 w-3 mr-1" />
                {game.complexity_rating}/5
              </Badge>
            </div>
            
            {game.bgg_rating && (
              <div className="flex items-center text-sm text-yellow-400">
                <Star className="h-4 w-4 mr-1 fill-current" />
                <span>{game.bgg_rating.toFixed(1)}</span>
                {game.bgg_rank && (
                  <span className="text-gray-500 ml-2">#{game.bgg_rank}</span>
                )}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-2">
              Age {game.age_rating}+
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
