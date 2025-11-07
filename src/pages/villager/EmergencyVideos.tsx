import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  created_at: string;
}

const EmergencyVideos = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from('emergency_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setVideos(data);
      }
      setLoading(false);
    };

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container max-w-4xl mx-auto p-4 space-y-8">
        <div className="flex items-center gap-4 pt-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/villager/home')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-primary">Emergency Treatment Videos</h1>
        </div>

        {selectedVideo ? (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{selectedVideo.title}</h2>
              <Button variant="outline" onClick={() => setSelectedVideo(null)}>
                Back to List
              </Button>
            </div>
            {selectedVideo.description && (
              <p className="text-muted-foreground">{selectedVideo.description}</p>
            )}
            <video
              controls
              className="w-full rounded-lg"
              src={selectedVideo.video_url}
            >
              Your browser does not support the video tag.
            </video>
          </Card>
        ) : (
          <>
            {videos.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No emergency videos available yet</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {videos.map((video) => (
                  <Card
                    key={video.id}
                    className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-secondary"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-lg flex-1">{video.title}</h3>
                        <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                          <Play className="w-6 h-6 text-secondary" />
                        </div>
                      </div>
                      {video.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {video.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Added {format(new Date(video.created_at), 'PP')}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EmergencyVideos;