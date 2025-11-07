import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

const UploadVideo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideo(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideo(null);
    setVideoPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !video) return;

    setLoading(true);

    try {
      const fileExt = video.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('emergency-videos')
        .upload(fileName, video);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('emergency-videos')
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from('emergency_videos')
        .insert({
          title,
          description,
          video_url: publicUrl,
          uploaded_by: user.id,
        });

      if (error) throw error;

      toast.success('Video uploaded successfully!');
      navigate('/doctor/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-accent/5">
      <div className="container max-w-2xl mx-auto p-4 space-y-8">
        <div className="flex items-center gap-4 pt-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/doctor/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-secondary">Upload Emergency Video</h1>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Video Title</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g., How to do CPR"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this video teaches..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Upload Video</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Upload emergency treatment tutorial video
              </p>

              {!videoPreview ? (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-secondary transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">MP4, WEBM up to 50MB</p>
                  </div>
                  <Input
                    type="file"
                    className="hidden"
                    accept="video/*"
                    onChange={handleVideoChange}
                  />
                </label>
              ) : (
                <div className="relative">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full rounded-lg"
                  >
                    Your browser does not support the video tag.
                  </video>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeVideo}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/doctor/dashboard')}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-secondary hover:bg-secondary/90" disabled={loading || !video}>
                {loading ? 'Uploading...' : 'Upload Video'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default UploadVideo;