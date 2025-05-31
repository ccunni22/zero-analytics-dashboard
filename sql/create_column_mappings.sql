-- Create table for storing column mappings
CREATE TABLE IF NOT EXISTS "Column Mappings" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    mapping_name TEXT NOT NULL,
    column_mapping JSONB NOT NULL,
    similarity_threshold FLOAT NOT NULL DEFAULT 0.8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    description TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_column_mappings_user_id ON "Column Mappings" (user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_column_mappings_updated_at
    BEFORE UPDATE ON "Column Mappings"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE "Column Mappings" ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own mappings
CREATE POLICY "Users can view their own mappings"
    ON "Column Mappings"
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for users to insert their own mappings
CREATE POLICY "Users can insert their own mappings"
    ON "Column Mappings"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own mappings
CREATE POLICY "Users can update their own mappings"
    ON "Column Mappings"
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy for users to delete their own mappings
CREATE POLICY "Users can delete their own mappings"
    ON "Column Mappings"
    FOR DELETE
    USING (auth.uid() = user_id); 