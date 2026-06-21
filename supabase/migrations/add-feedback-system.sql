-- Create feedbacks table
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Allow all users to read feedbacks
CREATE POLICY "Allow public read access on feedbacks"
    ON public.feedbacks FOR SELECT
    USING (true);

-- Allow authenticated users to insert feedbacks
CREATE POLICY "Allow authenticated insert on feedbacks"
    ON public.feedbacks FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
