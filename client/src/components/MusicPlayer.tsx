
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { SongWithRating } from '../../../server/src/schema';

interface MusicPlayerProps {
  song: SongWithRating;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function MusicPlayer({ 
  song, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious 
}: MusicPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setCurrentTime(0);
      onNext(); // Auto play next song
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onNext]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = (value[0] / 100) * song.duration_seconds;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const progress = song.duration_seconds > 0 ? (currentTime / song.duration_seconds) * 100 : 0;

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={song.audio_url}
        preload="metadata"
      />

      {/* Music Player */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-purple-500/20 transition-all duration-300 ${
        isExpanded ? 'h-64' : 'h-20'
      }`}>
        <Card className="bg-transparent border-none rounded-none">
          <CardContent className="p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <Slider
                value={[progress]}
                onValueChange={handleProgressChange}
                max={100}
                step={0.1}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(song.duration_seconds)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              {/* Song Info */}
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                  🎵
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-white truncate">{song.title}</h4>
                  <div className="flex items-center space-x-2">
                    {song.genre && (
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                        {song.genre}
                      </Badge>
                    )}
                    <span className="text-sm text-gray-400">Game Song</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onPrevious}
                  className="text-gray-400 hover:text-white"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                
                <Button
                  size="icon"
                  onClick={onPlayPause}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-12 h-12"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onNext}
                  className="text-gray-400 hover:text-white"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              {/* Volume & Expand */}
              <div className="flex items-center space-x-3 flex-1 justify-end">
                <div className="flex items-center space-x-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleMute}
                    className="text-gray-400 hover:text-white"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="w-20">
                    <Slider
                      value={[isMuted ? 0 : volume * 100]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
                
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-gray-400 hover:text-white"
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Expanded Info */}
            {isExpanded && (
              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">{song.title}</h3>
                  {song.description && (
                    <p className="text-gray-300 mb-4">{song.description}</p>
                  )}
                  <div className="flex justify-center space-x-4 text-sm text-gray-400">
                    <span>Duration: {formatTime(song.duration_seconds)}</span>
                    {song.genre && <span>Genre: {song.genre}</span>}
                    {song.average_rating && (
                      <span>Rating: {song.average_rating.toFixed(1)}/5</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Spacer to prevent content from being hidden behind player */}
      <div className="h-20" />
    </>
  );
}
