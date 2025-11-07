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
  patient_profile: {
    name: string;
    village: string | null;
    age: number | null;
  } | null;
}

const ManageBookings = () => {
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
          patient_id
        `)
        .eq('doctor_id', user?.id)
        .order('booking_date', { ascending: true });

      if (error) {
        toast.error('Failed to load bookings');
        setLoading(false);
        return;
      }

      if (data) {
        const bookingsWithPatients = await Promise.all(
          data.map(async (booking) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, village, age')
              .eq('id', booking.patient_id)
              .single();

            return {
              ...booking,
              patient_profile: profile,
            };
          })
        );

        setBookings(bookingsWithPatients as Booking[]);
      }
      setLoading(false);
    };

    if (user) {
      fetchBookings();
    }
  }, [user]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success(`Booking ${newStatus} successfully`);
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));
    } catch (error: any) {
      toast.error(error.message || 'Failed to update booking');
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
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-accent/5">
      <div className="container max-w-4xl mx-auto p-4 space-y-8">
        <div className="flex items-center gap-4 pt-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/doctor/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-secondary">Manage Appointments</h1>
        </div>

        {bookings.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No appointments yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold">
                          {booking.patient_profile?.name || 'Unknown Patient'}
                        </h3>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        {booking.patient_profile?.village && (
                          <p className="text-muted-foreground">
                            Village: {booking.patient_profile.village}
                          </p>
                        )}
                        {booking.patient_profile?.age && (
                          <p className="text-muted-foreground">
                            Age: {booking.patient_profile.age} years
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Appointment Date: {format(new Date(booking.booking_date), 'PPP')}
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
                  </div>
                  
                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  
                  {booking.status === 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(booking.id, 'completed')}
                    >
                      Mark as Completed
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

export default ManageBookings;
