import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
  consultation_fee: number | null;
  available: boolean;
  hospital_name: string | null;
  hospital_address: string | null;
  hospital_contact: string | null;
}

const DoctorsList = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data: doctorRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'doctor');

      if (doctorRoles) {
        const doctorIds = doctorRoles.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, specialization, consultation_fee, available, hospital_name, hospital_address, hospital_contact')
          .in('id', doctorIds);

        if (profiles) {
          setDoctors(profiles);
        }
      }
      setLoading(false);
    };

    fetchDoctors();
  }, []);

  const handleContactDoctor = (doctorId: string) => {
    navigate('/villager/request', { state: { selectedDoctorId: doctorId } });
  };

  const handleBookAppointment = (doctorId: string, doctorName: string) => {
    navigate('/villager/book-appointment', { state: { doctorId, doctorName } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading doctors...</p>
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
          <h1 className="text-3xl md:text-4xl font-bold text-primary">Available Doctors</h1>
        </div>

        {doctors.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No doctors available at the moment</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {doctors.map((doctor) => (
              <Card key={doctor.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">Dr. {doctor.name}</h3>
                        {doctor.available && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Available
                          </Badge>
                        )}
                      </div>
                      {doctor.specialization && (
                        <p className="text-muted-foreground">{doctor.specialization}</p>
                      )}
                      {doctor.consultation_fee && (
                        <p className="text-sm text-muted-foreground">
                          Consultation Fee: ₹{doctor.consultation_fee}
                        </p>
                      )}
                      {doctor.hospital_name && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-md space-y-1">
                          <p className="text-sm font-medium">{doctor.hospital_name}</p>
                          {doctor.hospital_address && (
                            <p className="text-xs text-muted-foreground">{doctor.hospital_address}</p>
                          )}
                          {doctor.hospital_contact && (
                            <p className="text-xs text-muted-foreground">Contact: {doctor.hospital_contact}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleContactDoctor(doctor.id)}
                      disabled={!doctor.available}
                    >
                      Contact
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleBookAppointment(doctor.id, doctor.name)}
                      disabled={!doctor.available}
                    >
                      Book Appointment
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsList;
