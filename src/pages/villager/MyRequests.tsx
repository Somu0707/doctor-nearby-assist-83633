import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';

interface Request {
  id: string;
  symptoms: string;
  image_url: string | null;
  status: string;
  reply_message: string | null;
  medicines: string | null;
  created_at: string;
}

const MyRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('medical_requests')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRequests(data);
      }
      setLoading(false);
    };

    fetchRequests();

    // Set up realtime subscription
    const channel = supabase
      .channel('medical-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medical_requests',
          filter: `patient_id=eq.${user.id}`,
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
          <h1 className="text-3xl md:text-4xl font-bold text-primary">My Requests</h1>
        </div>

        {requests.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No requests yet</p>
            <Button onClick={() => navigate('/villager/request')}>
              Submit Your First Request
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">Request</h3>
                        <Badge
                          variant={request.status === 'responded' ? 'default' : 'secondary'}
                          className={
                            request.status === 'responded'
                              ? 'bg-secondary'
                              : 'bg-muted'
                          }
                        >
                          {request.status === 'responded' ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Responded
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.created_at), 'PPp')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Your Symptoms:</h4>
                    <p className="text-muted-foreground">{request.symptoms}</p>
                  </div>

                  {request.image_url && (
                    <div>
                      <h4 className="font-medium mb-2">Uploaded Image:</h4>
                      <img
                        src={request.image_url}
                        alt="Medical image"
                        className="w-full max-w-md h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {request.status === 'responded' && (
                    <div className="bg-secondary/10 p-4 rounded-lg space-y-3">
                      <h4 className="font-semibold text-secondary">Doctor's Response:</h4>
                      {request.reply_message && (
                        <div>
                          <p className="text-sm font-medium mb-1">Advice:</p>
                          <p className="text-sm">{request.reply_message}</p>
                        </div>
                      )}
                      {request.medicines && (
                        <div>
                          <p className="text-sm font-medium mb-1">Recommended Medicines:</p>
                          <p className="text-sm">{request.medicines}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests;