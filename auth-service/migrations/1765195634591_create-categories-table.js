/* eslint-disable indent */
/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
const up = (pgm) => {
    // 1. Create categories table
    pgm.createTable('categories', {
        id: {
            type: 'uuid',
            primaryKey: true,
            defaultExpression: 'uuid_generate_v4()',
        },
        company_id: {
            type: 'uuid',
            notNull: true,
            references: '"companies"',
            onDelete: 'CASCADE',
        },
        name: {
            type: 'varchar(255)',
            notNull: true,
        },
        is_tip_distribution_pool: {
            type: 'boolean',
            notNull: true,
            default: false,
        },
        created_at: {
            type: 'timestamp with time zone',
            notNull: true,
            defaultExpression: 'CURRENT_TIMESTAMP',
        },
        updated_at: {
            type: 'timestamp with time zone',
            notNull: true,
            defaultExpression: 'CURRENT_TIMESTAMP',
        },
    });

    // Add unique constraint for category name within a company
    pgm.addConstraint('categories', 'unique_category_name_per_company', {
        unique: ['company_id', 'name'],
    });

    // 2. Add category_id column to company_memberships
    pgm.addColumn('company_memberships', {
        category_id: {
            type: 'uuid',
            references: '"categories"',
            onDelete: 'SET NULL', // If a category is deleted, memberships referencing it become NULL
            allowNull: true, // Allow initially null, will be set by manager
        },
    });

    // 3. Make the existing 'role' column nullable (temporarily, or if kept for legacy)
    //    The user's intent is to replace roles with categories.
    //    For now, we make 'role' nullable to avoid breaking existing data.
    //    It might be removed in a future migration or cleaned up after category assignment.
    pgm.alterColumn('company_memberships', 'role', {
        notNull: false,
    });

    // 4. Drop the departments table and any associated foreign key constraints
    //    First, find and remove any foreign key constraints that might reference 'departments'.
    //    (This step is more robust, but for a simple case, dropping the table might suffice if no other FKs point to it).
    //    Since we just checked, only company_memberships might have had an implicit link, but not a direct FK.
    pgm.dropTable('departments', {
        ifExists: true,
        cascade: true, // Cascade will drop dependent objects like FK constraints
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
const down = (pgm) => {
    // Revert steps in reverse order

    // 1. Recreate departments table (if it was dropped)
    pgm.createTable('departments', {
        id: {
            type: 'uuid',
            primaryKey: true,
            defaultExpression: 'uuid_generate_v4()',
        },
        company_id: {
            type: 'uuid',
            notNull: true,
            references: '"companies"',
            onDelete: 'CASCADE',
        },
        name: {
            type: 'varchar(255)',
            notNull: true,
        },
        department_type: { // Recreate with old column
            type: 'varchar(50)',
            notNull: true,
            default: 'RECEIVER', // Assuming a common default
        },
        created_at: {
            type: 'timestamp with time zone',
            notNull: true,
            defaultExpression: 'CURRENT_TIMESTAMP',
        },
        updated_at: {
            type: 'timestamp with time zone',
            notNull: true,
            defaultExpression: 'CURRENT_TIMESTAMP',
        },
    });
    pgm.addConstraint('departments', 'unique_department_name_per_company', {
        unique: ['company_id', 'name'],
    });


    // 2. Revert 'role' column to NOT NULL if it was originally
    //    This assumes 'role' was NOT NULL before, which it was based on init.sql
    pgm.alterColumn('company_memberships', 'role', {
        notNull: true,
    });

    // 3. Drop category_id column from company_memberships
    pgm.dropColumn('company_memberships', 'category_id');

    // 4. Drop categories table
    pgm.dropTable('categories');
};

module.exports = { shorthands, up, down };