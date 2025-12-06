-- Drop the old AppealStatus enum if it exists and has different values
DO $$ 
BEGIN
    -- Check if the old enum exists but with wrong values
    IF EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'AppealStatus'
        AND e.enumlabel = 'APPROVED'
    ) THEN
        -- Drop tables using the enum first
        DROP TABLE IF EXISTS "Appeal" CASCADE;
        -- Drop the old enum
        DROP TYPE IF EXISTS "AppealStatus" CASCADE;
    END IF;
END $$;
