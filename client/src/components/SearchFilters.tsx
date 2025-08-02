
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Filter, X } from 'lucide-react';
import type { GameCategory, GameSearchInput } from '../../../server/src/schema';

interface SearchFiltersProps {
  categories: GameCategory[];
  onFiltersChange: (filters: Partial<GameSearchInput>) => void;
  isLoading?: boolean;
}

type FilterState = Partial<GameSearchInput>;

export function SearchFilters({ categories, onFiltersChange, isLoading = false }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category_ids: [],
    complexity_min: 1,
    complexity_max: 5
  });

  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  useEffect(() => {
    const hasFilters = (
      (filters.category_ids && filters.category_ids.length > 0) ||
      filters.min_players !== undefined ||
      filters.max_players !== undefined ||
      filters.min_playtime !== undefined ||
      filters.max_playtime !== undefined ||
      filters.min_age !== undefined ||
      filters.complexity_min !== 1 ||
      filters.complexity_max !== 5 ||
      filters.sort_by !== undefined
    );
    
    setHasActiveFilters(hasFilters);
    
    if (hasFilters) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  const handleCategoryToggle = (categoryId: number) => {
    setFilters((prev: FilterState) => ({
      ...prev,
      category_ids: prev.category_ids?.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...(prev.category_ids || []), categoryId]
    }));
  };

  const handleComplexityChange = (value: number[]) => {
    setFilters((prev: FilterState) => ({
      ...prev,
      complexity_min: value[0],
      complexity_max: value[1]
    }));
  };

  const clearFilters = () => {
    setFilters({
      category_ids: [],
      complexity_min: 1,
      complexity_max: 5
    });
  };

  const clearSpecificFilter = (filterKey: keyof FilterState) => {
    setFilters((prev: FilterState) => {
      const newFilters = { ...prev };
      if (filterKey === 'category_ids') {
        newFilters.category_ids = [];
      } else if (filterKey === 'complexity_min' || filterKey === 'complexity_max') {
        newFilters.complexity_min = 1;
        newFilters.complexity_max = 5;
      } else {
        delete newFilters[filterKey];
      }
      return newFilters;
    });
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white">Filters</CardTitle>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="bg-purple-600 text-white">
                    Active
                  </Badge>
                )}
              </div>
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {filters.category_ids && filters.category_ids.length > 0 && (
                  <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
                    Categories ({filters.category_ids.length})
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-4 w-4 ml-1 hover:bg-purple-600/30"
                      onClick={() => clearSpecificFilter('category_ids')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {(filters.min_players !== undefined || filters.max_players !== undefined) && (
                  <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
                    Players
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-4 w-4 ml-1 hover:bg-blue-600/30"
                      onClick={() => {
                        clearSpecificFilter('min_players');
                        clearSpecificFilter('max_players');
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-gray-400 hover:text-white"
                >
                  Clear All
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Categories */}
              <div className="space-y-3">
                <Label className="text-white font-semibold">Categories</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((category: GameCategory) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={filters.category_ids?.includes(category.id) || false}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                        className="border-gray-500 data-[state=checked]:bg-purple-600"
                      />
                      <Label
                        htmlFor={`category-${category.id}`}
                        className="text-gray-300 text-sm cursor-pointer flex-1"
                      >
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Player Count */}
              <div className="space-y-3">
                <Label className="text-white font-semibold">Player Count</Label>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="min-players" className="text-sm text-gray-400">Min Players</Label>
                    <Input
                      id="min-players"
                      type="number"
                      min="1"
                      max="20"
                      value={filters.min_players || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFilters((prev: FilterState) => ({
                          ...prev,
                          min_players: e.target.value ? parseInt(e.target.value) : undefined
                        }))
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Any"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-players" className="text-sm text-gray-400">Max Players</Label>
                    <Input
                      id="max-players"
                      type="number"
                      min="1"
                      max="20"
                      value={filters.max_players || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFilters((prev: FilterState) => ({
                          ...prev,
                          max_players: e.target.value ? parseInt(e.target.value) : undefined
                        }))
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Any"
                    />
                  </div>
                </div>
              </div>

              {/* Playtime */}
              <div className="space-y-3">
                <Label className="text-white font-semibold">Playtime (minutes)</Label>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="min-playtime" className="text-sm text-gray-400">Min Playtime</Label>
                    <Input
                      id="min-playtime"
                      type="number"
                      min="1"
                      value={filters.min_playtime || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFilters((prev: FilterState) => ({
                          ...prev,
                          min_playtime: e.target.value ? parseInt(e.target.value) : undefined
                        }))
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Any"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-playtime" className="text-sm text-gray-400">Max Playtime</Label>
                    <Input
                      id="max-playtime"
                      type="number"
                      min="1"
                      value={filters.max_playtime || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFilters((prev: FilterState) => ({
                          ...prev,
                          max_playtime: e.target.value ? parseInt(e.target.value) : undefined
                        }))
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Any"
                    />
                  </div>
                </div>
              </div>

              {/* Age Rating */}
              <div className="space-y-3">
                <Label className="text-white font-semibold">Minimum Age</Label>
                <Input
                  type="number"
                  min="0"
                  max="18"
                  value={filters.min_age || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFilters((prev: FilterState) => ({
                      ...prev,
                      min_age: e.target.value ? parseInt(e.target.value) : undefined
                    }))
                  }
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Any age"
                />
              </div>

              {/* Complexity */}
              <div className="space-y-3">
                <Label className="text-white font-semibold">
                  Complexity ({filters.complexity_min || 1} - {filters.complexity_max || 5})
                </Label>
                <Slider
                  value={[filters.complexity_min || 1, filters.complexity_max || 5]}
                  onValueChange={handleComplexityChange}
                  min={1}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Simple</span>
                  <span>Complex</span>
                </div>
              </div>

              {/* Sort */}
              <div className="space-y-3">
                <Label className="text-white font-semibold">Sort By</Label>
                <div className="space-y-2">
                  <Select
                    value={filters.sort_by || ''}
                    onValueChange={(value: 'name' | 'bgg_rating' | 'bgg_rank' | 'playtime_minutes' | 'created_at' | '') =>
                      setFilters((prev: FilterState) => ({
                        ...prev,
                        sort_by: value || undefined
                      }))
                    }
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="bgg_rating">BGG Rating</SelectItem>
                      <SelectItem value="bgg_rank">BGG Rank</SelectItem>
                      <SelectItem value="playtime_minutes">Playtime</SelectItem>
                      <SelectItem value="created_at">Date Added</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {filters.sort_by && (
                    <Select
                      value={filters.sort_order || 'desc'}
                      onValueChange={(value: 'asc' | 'desc') =>
                        setFilters((prev: FilterState) => ({
                          ...prev,
                          sort_order: value
                        }))
                      }
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="text-center text-gray-400">
                🔍 Searching...
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
