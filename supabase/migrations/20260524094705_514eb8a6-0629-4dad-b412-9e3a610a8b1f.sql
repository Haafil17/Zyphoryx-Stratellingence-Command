CREATE TYPE public.finance_entry_type AS ENUM ('revenue', 'expense');

CREATE TABLE public.finance_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type public.finance_entry_type NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  description TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_finance_entries_user_date ON public.finance_entries(user_id, entry_date DESC);

ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own finance entries" ON public.finance_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance entries" ON public.finance_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance entries" ON public.finance_entries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance entries" ON public.finance_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);