import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Calendar as CalendarIcon, Building2, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DoctorDetails {
  name: string;
  hospital_name: string | null;
  hospital_address: string | null;
  hospital_contact: string | null;
}

const BookAppointment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { doctorId, doctorName } = location.state || {};
  
  const [date, setDate] = useState<Date>();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctorDetails, setDoctorDetails] = useState<DoctorDetails | null>(null);

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      if (!doctorId) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('name, hospital_name, hospital_address, hospital_contact')
        .eq('id', doctorId)
        .single();
      
      if (!error && data) {
        setDoctorDetails(data);
      }
    };
    
    fetchDoctorDetails();
  }, [doctorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error('Please select a date');
      return;
    }
    
    if (!doctorId) {
      toast.error('Doctor information missing');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          patient_id: user?.id,
          doctor_id: doctorId,
          booking_date: date.toISOString(),
          notes,
        });

      if (error) throw error;

      toast.success('Appointment booked successfully!');
      navigate('/villager/bookings');
    } catch (error: any) {
      toast.error(error.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container max-w-2xl mx-auto p-4 space-y-8">
        <div className="flex items-center gap-4 pt-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/villager/doctors')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-primary">Book Appointment</h1>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Doctor</Label>
              <p className="text-lg font-medium">Dr. {doctorDetails?.name || doctorName || 'Unknown'}</p>
            </div>

            {doctorDetails && (doctorDetails.hospital_name || doctorDetails.hospital_address || doctorDetails.hospital_contact) && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                {doctorDetails.hospital_name && (
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Hospital</p>
                      <p className="text-sm text-muted-foreground">{doctorDetails.hospital_name}</p>
                    </div>
                  </div>
                )}
                {doctorDetails.hospital_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">{doctorDetails.hospital_address}</p>
                    </div>
                  </div>
                )}
                {doctorDetails.hospital_contact && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Contact</p>
                      <p className="text-sm text-muted-foreground">{doctorDetails.hospital_contact}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Select Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information for the doctor..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/villager/doctors')}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Booking...' : 'Book Appointment'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default BookAppointment;
