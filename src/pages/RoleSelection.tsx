import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Stethoscope, Users } from 'lucide-react';

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            Rural Medical Assistance
          </h1>
          <p className="text-xl text-muted-foreground">
            Healthcare support for rural communities
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary cursor-pointer"
                onClick={() => navigate('/auth?role=villager')}>
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">I am a Villager</h2>
                <p className="text-muted-foreground">
                  Get medical guidance, request help, and access emergency tutorials
                </p>
              </div>
              <Button className="w-full" size="lg">
                Continue as Villager
              </Button>
            </div>
          </Card>

          <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary cursor-pointer"
                onClick={() => navigate('/auth?role=doctor')}>
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
                <Stethoscope className="w-10 h-10 text-secondary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">I am a Doctor</h2>
                <p className="text-muted-foreground">
                  Help patients, respond to requests, and share medical knowledge
                </p>
              </div>
              <Button className="w-full bg-secondary hover:bg-secondary/90" size="lg">
                Continue as Doctor
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;