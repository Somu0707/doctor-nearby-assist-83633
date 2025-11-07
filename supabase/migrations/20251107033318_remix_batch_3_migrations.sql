
-- Migration: 20251106045833

-- Migration: 20251106045216

-- Migration: 20251106020034

-- Migration: 20251106013323
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('villager', 'doctor');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  village TEXT,
  age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create medical_requests table
CREATE TABLE public.medical_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  symptoms TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'responded')),
  reply_message TEXT,
  medicines TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create emergency_videos table
CREATE TABLE public.emergency_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_videos ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own role during signup"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for medical_requests
CREATE POLICY "Villagers can view own requests"
  ON public.medical_requests FOR SELECT
  TO authenticated
  USING (
    patient_id = auth.uid() OR 
    public.has_role(auth.uid(), 'doctor')
  );

CREATE POLICY "Villagers can insert own requests"
  ON public.medical_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id = auth.uid() AND 
    public.has_role(auth.uid(), 'villager')
  );

CREATE POLICY "Doctors can update requests"
  ON public.medical_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'doctor'));

-- RLS Policies for emergency_videos
CREATE POLICY "Anyone authenticated can view videos"
  ON public.emergency_videos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Doctors can insert videos"
  ON public.emergency_videos FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can delete their own videos"
  ON public.emergency_videos FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid() AND 
    public.has_role(auth.uid(), 'doctor')
  );

-- Create storage bucket for medical images
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-images', 'medical-images', true);

-- Storage policies for medical images
CREATE POLICY "Authenticated users can upload medical images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'medical-images');

CREATE POLICY "Anyone can view medical images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'medical-images');

-- Create storage bucket for emergency videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('emergency-videos', 'emergency-videos', true);

-- Storage policies for emergency videos
CREATE POLICY "Doctors can upload emergency videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'emergency-videos' AND 
    public.has_role(auth.uid(), 'doctor')
  );

CREATE POLICY "Anyone can view emergency videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'emergency-videos');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_requests_updated_at
  BEFORE UPDATE ON public.medical_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for medical_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.medical_requests;


-- Migration: 20251106024529
-- Add specialization to profiles for doctors
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS consultation_fee INTEGER,
ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;

-- Create medical_history table
CREATE TABLE IF NOT EXISTS public.medical_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  diagnosis TEXT NOT NULL,
  prescription TEXT,
  notes TEXT,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on medical_history
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_history
CREATE POLICY "Patients can view their own history"
ON public.medical_history
FOR SELECT
USING (patient_id = auth.uid() OR has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can insert medical history"
ON public.medical_history
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can update medical history"
ON public.medical_history
FOR UPDATE
USING (has_role(auth.uid(), 'doctor'::app_role));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_medical_history_patient ON public.medical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_history_doctor ON public.medical_history(doctor_id);

-- Add trigger for updated_at on medical_history
CREATE TRIGGER update_medical_history_updated_at
BEFORE UPDATE ON public.medical_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();



-- Migration: 20251106050846
-- Create bookings table for villagers to book appointments with doctors
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
CREATE POLICY "Villagers can view their own bookings"
ON public.bookings
FOR SELECT
USING (patient_id = auth.uid() OR doctor_id = auth.uid());

CREATE POLICY "Villagers can create their own bookings"
ON public.bookings
FOR INSERT
WITH CHECK (patient_id = auth.uid() AND has_role(auth.uid(), 'villager'::app_role));

CREATE POLICY "Doctors can update bookings"
ON public.bookings
FOR UPDATE
USING (doctor_id = auth.uid() AND has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Patients can cancel their bookings"
ON public.bookings
FOR UPDATE
USING (patient_id = auth.uid() AND has_role(auth.uid(), 'villager'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251106052210
-- Add hospital details columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN hospital_name TEXT,
ADD COLUMN hospital_address TEXT,
ADD COLUMN hospital_contact TEXT;
