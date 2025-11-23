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
    pgm.sql(`
        INSERT INTO app_settings (setting_name, setting_value)
        VALUES ('default_trial_days', '14')
        ON CONFLICT (setting_name) DO NOTHING;
    `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
const down = (pgm) => {
    pgm.sql(`
        DELETE FROM app_settings WHERE setting_name = 'default_trial_days';
    `);
};

module.exports = {
    shorthands,
    up,
    down,
};
