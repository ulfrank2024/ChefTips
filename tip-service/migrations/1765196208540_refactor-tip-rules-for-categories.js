/* eslint-disable indent */
/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    // 1. Add category_id column to tip_reports table
    pgm.addColumn('daily_reports', { // Changed from tip_reports to daily_reports based on tipModel.js
        category_id: {
            type: 'uuid',
            references: '"auth_service_db"."public"."categories"(id)', // Reference auth-service's categories table
            onDelete: 'SET NULL',
            allowNull: true,
        },
    });

    // 2. Add destination_category_id column to rules table
    pgm.addColumn('tip_out_rules', { // Changed from rules to tip_out_rules based on tipModel.js
        destination_category_id: {
            type: 'uuid',
            references: '"auth_service_db"."public"."categories"(id)', // Reference auth-service's categories table
            onDelete: 'SET NULL',
            allowNull: true,
        },
    });

    // 3. Add category_id column to tip_pools table
    pgm.addColumn('tip_pools', {
        category_id: {
            type: 'uuid',
            references: '"auth_service_db"."public"."categories"(id)', // Reference auth-service's categories table
            onDelete: 'SET NULL',
            allowNull: true,
        },
    });

    // 4. Make 'role' column in daily_reports table nullable
    pgm.alterColumn('daily_reports', 'role', {
        notNull: false,
    });

    // 5. Make 'destination_role' column in tip_out_rules table nullable
    pgm.alterColumn('tip_out_rules', 'destination_role', {
        notNull: false,
    });

    // 6. Make 'role' column in tip_pools table nullable
    pgm.alterColumn('tip_pools', 'role', {
        notNull: false,
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    // Revert steps in reverse order

    // 1. Revert 'role' column in tip_pools table to NOT NULL
    pgm.alterColumn('tip_pools', 'role', {
        notNull: true,
    });

    // 2. Revert 'destination_role' column in tip_out_rules table to NOT NULL
    pgm.alterColumn('tip_out_rules', 'destination_role', {
        notNull: true,
    });

    // 3. Revert 'role' column in daily_reports table to NOT NULL
    pgm.alterColumn('daily_reports', 'role', {
        notNull: true,
    });

    // 4. Drop category_id column from tip_pools table
    pgm.dropColumn('tip_pools', 'category_id');

    // 5. Drop destination_category_id column from tip_out_rules table
    pgm.dropColumn('tip_out_rules', 'destination_category_id');

    // 6. Drop category_id column from daily_reports table
    pgm.dropColumn('daily_reports', 'category_id');
};