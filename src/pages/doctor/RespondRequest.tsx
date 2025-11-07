import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import MedicalHistory from '@/components/MedicalHistory';
import { useAuth } from '@/lib/auth';

interface Request {
  id: string;
  patient_id: string;
  symptoms: string;
  image_url: string | null;
  status: string;
  reply_message: string | null;
  medicines: string | null;
  created_at: string;
  profiles: {
    name: string;
    village: string | null;
    age: number | null;
  } | null;
}

const RespondRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState<Request | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [medicines, setMedicines] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      const { data, error } = await supabase
        .from('medical_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, village, age')
          .eq('id', data.patient_id)
          .single();
        
        setRequest({ ...data, profiles: profile } as any);
        setReplyMessage(data.reply_message || '');
        setMedicines(data.medicines || '');
      }
    };

    fetchRequest();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!diagnosis.trim()) {
      toast.error('Diagnosis is required');
      return;
    }
    
    if (!medicines.trim()) {
      toast.error('Medicine prescription is required');
      return;
    }
    
    setLoading(true);

    try {
      // Update medical request
      const { error: requestError } = await supabase
        .from('medical_requests')
        .update({
          reply_message: replyMessage,
          medicines,
          status: 'responded',
          doctor_id: user?.id,
        })
        .eq('id', id);

      if (requestError) throw requestError;

      // Add to medical history
      if (diagnosis && request) {
        const { error: historyError } = await supabase
          .from('medical_history')
          .insert({
            patient_id: request.patient_id,
            doctor_id: user?.id,
            diagnosis,
            prescription: medicines,
            notes,
          });

        if (historyError) throw historyError;
      }

      toast.success('Response submitted successfully!');
      navigate('/doctor/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-accent/5">
      <div className="container max-w-4xl mx-auto p-4 space-y-8">
        <div className="flex items-center gap-4 pt-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/doctor/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-secondary">
            {request.status === 'responded' ? 'View Response' : 'Respond to Request'}
          </h1>
        </div>

        <Tabs defaultValue="response" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="history">Medical History</TabsTrigger>
          </TabsList>

          <TabsContent value="response">
            <Card className="p-8 space-y-6">
              <div className="space-y-4 pb-6 border-b">
            <h2 className="text-2xl font-bold">Patient Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{request.profiles?.name || 'Unknown'}</p>
              </div>
              {request.profiles?.village && (
                <div>
                  <p className="text-sm text-muted-foreground">Village</p>
                  <p className="font-medium">{request.profiles.village}</p>
                </div>
              )}
              {request.profiles?.age && (
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">{request.profiles.age} years</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Request Date</p>
                <p className="font-medium">{format(new Date(request.created_at), 'PPp')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pb-6 border-b">
            <h3 className="text-xl font-semibold">Patient's Symptoms</h3>
            <p className="text-muted-foreground">{request.symptoms}</p>

            {request.image_url && (
              <div>
                <h4 className="font-medium mb-2">Uploaded Image:</h4>
                <img
                  src={request.image_url}
                  alt="Medical image"
                  className="w-full max-w-2xl h-64 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Diagnosis *</Label>
                  <Textarea
                    id="diagnosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Enter the diagnosis..."
                    required
                    rows={3}
                    className="resize-none"
                    disabled={request.status === 'responded'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advice">Medical Advice</Label>
              <Textarea
                id="advice"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Provide your medical advice and recommendations..."
                required
                rows={6}
                className="resize-none"
                disabled={request.status === 'responded'}
              />
            </div>

                <div className="space-y-2">
                  <Label htmlFor="medicines">Recommended Medicines *</Label>
                  <Textarea
                    id="medicines"
                    value={medicines}
                    onChange={(e) => setMedicines(e.target.value)}
                    placeholder="List recommended medicines and dosage..."
                    required
                    rows={4}
                    className="resize-none"
                    disabled={request.status === 'responded'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes or follow-up instructions..."
                    rows={3}
                    className="resize-none"
                    disabled={request.status === 'responded'}
                  />
                </div>

                {request.status !== 'responded' && (
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate('/doctor/dashboard')}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-secondary hover:bg-secondary/90" disabled={loading}>
                      {loading ? 'Submitting...' : 'Submit Response'}
                    </Button>
                  </div>
                )}
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="p-8">
              <h3 className="text-xl font-bold mb-6">Patient Medical History</h3>
              {request && <MedicalHistory patientId={request.patient_id} />}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RespondRequest;