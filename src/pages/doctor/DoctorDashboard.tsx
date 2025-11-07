import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, MessageSquare, Video, User, Clock, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';

interface Request {
  id: string;
  patient_id: string;
  symptoms: string;
  image_url: string | null;
  status: string;
  created_at: string;
  profiles: {
    name: string;
    village: string | null;
    age: number | null;
  } | null;
}

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('medical_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const requestsWithProfiles = await Promise.all(
          data.map(async (req) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, village, age')
              .eq('id', req.patient_id)
              .single();
            return { ...req, profiles: profile };
          })
        );
        setRequests(requestsWithProfiles as any);
      }

      setLoading(false);
    };

    fetchRequests();

    // Set up realtime subscription
    const channel = supabase
      .channel('doctor-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medical_requests',
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-accent/5">
      <div className="container max-w-6xl mx-auto p-4 space-y-8">
        <div className="flex items-center justify-between pt-4">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary">Doctor Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/doctor/bookings')}>
              <Calendar className="w-4 h-4 mr-2" />
              Appointments
            </Button>
            <Button variant="outline" onClick={() => navigate('/doctor/upload-video')}>
              <Video className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
            <Button variant="outline" onClick={() => navigate('/doctor/profile')}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-3xl font-bold">{requests.length}</p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold text-primary">
                {requests.filter((r) => r.status === 'pending').length}
              </p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Responded</p>
              <p className="text-3xl font-bold text-secondary">
                {requests.filter((r) => r.status === 'responded').length}
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Patient Requests</h2>

          {requests.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No patient requests yet</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">
                            {request.profiles?.name || 'Unknown Patient'}
                          </h3>
                          <Badge
                            variant={request.status === 'responded' ? 'default' : 'secondary'}
                            className={
                              request.status === 'responded'
                                ? 'bg-secondary'
                                : 'bg-primary'
                            }
                          >
                            {request.status === 'responded' ? 'Responded' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {request.profiles?.village && (
                            <span>Village: {request.profiles.village}</span>
                          )}
                          {request.profiles?.age && (
                            <span>Age: {request.profiles.age}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(new Date(request.created_at), 'PPp')}
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate(`/doctor/respond/${request.id}`)}
                        size="sm"
                        className="bg-secondary hover:bg-secondary/90"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {request.status === 'responded' ? 'View' : 'Respond'}
                      </Button>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">Symptoms:</h4>
                      <p className="text-muted-foreground">{request.symptoms}</p>
                    </div>

                    {request.image_url && (
                      <div>
                        <h4 className="font-medium mb-2">Uploaded Image:</h4>
                        <img
                          src={request.image_url}
                          alt="Medical image"
                          className="w-full max-w-sm h-40 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;