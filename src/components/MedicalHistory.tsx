import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';

interface MedicalHistoryRecord {
  id: string;
  diagnosis: string;
  prescription: string | null;
  notes: string | null;
  visit_date: string;
  doctor_profile: {
    name: string;
  } | null;
}

interface MedicalHistoryProps {
  patientId: string;
}

const MedicalHistory = ({ patientId }: MedicalHistoryProps) => {
  const [history, setHistory] = useState<MedicalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('medical_history')
        .select(`
          *,
          doctor_profile:profiles!medical_history_doctor_id_fkey(name)
        `)
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });

      if (!error && data) {
        setHistory(data as any);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [patientId]);

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">Loading medical history...</p>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-2">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">No medical history available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((record) => (
        <Card key={record.id} className="p-6 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold">{record.diagnosis}</h4>
              <p className="text-sm text-muted-foreground">
                {format(new Date(record.visit_date), 'PPP')}
              </p>
            </div>
            {record.doctor_profile && (
              <p className="text-sm text-muted-foreground">
                Dr. {record.doctor_profile.name}
              </p>
            )}
          </div>

          {record.prescription && (
            <div>
              <p className="text-sm font-medium">Prescription:</p>
              <p className="text-sm text-muted-foreground">{record.prescription}</p>
            </div>
          )}

          {record.notes && (
            <div>
              <p className="text-sm font-medium">Notes:</p>
              <p className="text-sm text-muted-foreground">{record.notes}</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default MedicalHistory;
