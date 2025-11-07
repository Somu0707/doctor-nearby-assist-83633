import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Video, User, LogOut, Stethoscope, History, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const VillagerHome = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container max-w-4xl mx-auto p-4 space-y-8">
        <div className="flex items-center justify-between pt-4">
          <h1 className="text-3xl md:text-4xl font-bold text-primary">Villager Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut} size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary cursor-pointer"
            onClick={() => navigate('/villager/request')}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Request Medical Help</h2>
              <p className="text-muted-foreground">
                Submit your symptoms and get advice from doctors
              </p>
            </div>
          </Card>

          <Card 
            className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-accent cursor-pointer"
            onClick={() => navigate('/villager/doctors')}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Stethoscope className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-bold">Find Doctors</h2>
              <p className="text-muted-foreground">
                Browse and contact available doctors
              </p>
            </div>
          </Card>

          <Card 
            className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary cursor-pointer"
            onClick={() => navigate('/villager/my-requests')}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold">View My Requests</h2>
              <p className="text-muted-foreground">
                Check status and responses from doctors
              </p>
            </div>
          </Card>

          <Card 
            className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary cursor-pointer"
            onClick={() => navigate('/villager/medical-history')}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <History className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Medical History</h2>
              <p className="text-muted-foreground">
                View your past consultations and records
              </p>
            </div>
          </Card>

          <Card 
            className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-accent cursor-pointer"
            onClick={() => navigate('/villager/videos')}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Video className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-bold">Emergency Videos</h2>
              <p className="text-muted-foreground">
                Learn first-aid and emergency treatments
              </p>
            </div>
          </Card>

          <Card 
            className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary cursor-pointer"
            onClick={() => navigate('/villager/profile')}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold">My Profile</h2>
              <p className="text-muted-foreground">
                View and update your personal information
              </p>
            </div>
          </Card>

          <Card 
            className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary cursor-pointer"
            onClick={() => navigate('/villager/bookings')}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold">My Appointments</h2>
              <p className="text-muted-foreground">
                View and manage your bookings
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VillagerHome;