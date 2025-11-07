import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';

interface Booking {
  id: string;
  booking_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  doctor_profile: {
    name: string;
    specialization: string | null;
  } | null;
}

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          status,
          notes,
          created_at,
          doctor_id
        `)
        .eq('patient_id', user?.id)
        .order('booking_date', { ascending: true });

      if (error) {
        toast.error('Failed to load bookings');
        setLoading(false);
        return;
      }

      if (data) {
        const bookingsWithDoctors = await Promise.all(
          data.map(async (booking) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, specialization')
              .eq('id', booking.doctor_id)
              .single();

            return {
              ...booking,
              doctor_profile: profile,
            };
          })
        );

        setBookings(bookingsWithDoctors as Booking[]);
      }
      setLoading(false);
    };

    if (user) {
      fetchBookings();
    }
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Booking cancelled successfully');
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      ));
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading bookings...</p>
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
          <h1 className="text-3xl md:text-4xl font-bold text-primary">My Appointments</h1>
        </div>

        {bookings.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">You don't have any appointments yet</p>
            <Button onClick={() => navigate('/villager/doctors')}>
              Browse Doctors
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold">
                        Dr. {booking.doctor_profile?.name || 'Unknown'}
                      </h3>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                    
                    {booking.doctor_profile?.specialization && (
                      <p className="text-muted-foreground">
                        {booking.doctor_profile.specialization}
                      </p>
                    )}
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Date: {format(new Date(booking.booking_date), 'PPP')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Booked on: {format(new Date(booking.created_at), 'PP')}
                      </p>
                    </div>
                    
                    {booking.notes && (
                      <div>
                        <p className="text-sm font-medium">Notes:</p>
                        <p className="text-sm text-muted-foreground">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  {booking.status === 'pending' && (
                    <Button
                      variant="outline"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      Cancel
                    </Button>
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

export default MyBookings;
