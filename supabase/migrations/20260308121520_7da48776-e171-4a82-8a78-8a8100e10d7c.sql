
CREATE TABLE public.saved_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_names TEXT[] NOT NULL DEFAULT '{}',
  charts JSONB DEFAULT '[]',
  story TEXT DEFAULT '',
  forecast TEXT DEFAULT '',
  simulation TEXT DEFAULT '',
  cofounder TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
ON public.saved_analyses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
ON public.saved_analyses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
ON public.saved_analyses FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
