
import { VercelResponse } from '@vercel/node';
import { sql } from '../../lib/db.js';
import { withAuth, AuthenticatedRequest } from '../middleware/withAuth.js';

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
    if (req.user?.role !== 'executive') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    try {
        // 1. Check if it's an ENUM type
        const { rows: enumTypes } = await sql(`
            SELECT t.typname as enum_name, e.enumlabel as enum_value
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            WHERE t.typname = 'car_status';
        `);

        if (enumTypes.length > 0) {
            console.log('Found ENUM type car_status:', enumTypes);
            // Check if 'Test drive' already exists in enum
            if (!enumTypes.some(e => e.enum_value === 'Test drive')) {
                await sql(`ALTER TYPE car_status ADD VALUE 'Test drive';`);
                return res.status(200).json({ message: 'ENUM type car_status updated successfully' });
            }
            return res.status(200).json({ message: 'ENUM type car_status already contains Test drive' });
        }

        // 2. Check current constraints (if not ENUM, maybe it's a CHECK constraint)
        const { rows: constraints } = await sql(`
            SELECT conname, pg_get_constraintdef(oid) 
            FROM pg_constraint 
            WHERE conrelid = 'cars'::regclass AND contype = 'c';
        `);

        console.log('Current constraints:', constraints);

        // Find the status check constraint
        const statusConstraint = constraints.find(c => c.pg_get_constraintdef.includes('status'));

        if (statusConstraint) {
            const oldDef = statusConstraint.pg_get_constraintdef;
            // Assuming it's something like CHECK (status = ANY (ARRAY['...'::text, ...]))
            // Or CHECK (status IN ('...', ...))
            
            // Let's just drop and recreate if we find it, or try to modify it.
            // A safer way is to drop the old one and add a new one.
            await sql(`ALTER TABLE cars DROP CONSTRAINT ${statusConstraint.conname};`);
            
            // New constraint including 'Test drive'
            await sql(`
                ALTER TABLE cars ADD CONSTRAINT cars_status_check 
                CHECK (status IN ('รอขึ้นเทรลเลอร์', 'ขึ้นเทรลเลอร์', 'รถลงแล้ว', 'In Stock', 'Reserved', 'Sold', 'Test drive'));
            `);
            
            return res.status(200).json({ 
                message: 'Constraint updated successfully', 
                oldConstraint: oldDef,
                newConstraint: "CHECK (status IN ('รอขึ้นเทรลเลอร์', 'ขึ้นเทรลเลอร์', 'รถลงแล้ว', 'In Stock', 'Reserved', 'Sold', 'Test drive'))"
            });
        } else {
            return res.status(200).json({ message: 'No status constraint found to update', constraints });
        }

    } catch (error: any) {
        console.error('Migration error:', error);
        return res.status(500).json({ message: 'Migration failed', error: error.message });
    }
};

export default withAuth(handler);
