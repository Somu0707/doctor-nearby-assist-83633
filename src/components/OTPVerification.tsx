import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface OTPVerificationProps {
  phone: string;
  onVerified: () => void;
  onBack: () => void;
}

const OTPVerification = ({ phone, onVerified, onBack }: OTPVerificationProps) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);

  const sendOTP = async () => {
    setSendingOTP(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });

      if (error) throw error;
      toast.success('OTP sent to your phone!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;
      toast.success('Phone verified successfully!');
      onVerified();
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Verify Phone Number</h3>
        <p className="text-sm text-muted-foreground">
          We'll send a verification code to {phone}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp">Enter OTP</Label>
          <Input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={sendOTP}
            disabled={sendingOTP}
            className="flex-1"
          >
            {sendingOTP ? 'Sending...' : 'Send OTP'}
          </Button>
          <Button
            type="button"
            onClick={verifyOTP}
            disabled={loading || otp.length !== 6}
            className="flex-1"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="w-full"
        >
          Back
        </Button>
      </div>
    </Card>
  );
};

export default OTPVerification;
