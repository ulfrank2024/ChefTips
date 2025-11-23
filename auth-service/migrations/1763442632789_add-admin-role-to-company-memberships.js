/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
        ALTER TABLE company_memberships
        DROP CONSTRAINT company_memberships_role_check;

        ALTER TABLE company_memberships
        ADD CONSTRAINT company_memberships_role_check
        CHECK (role IN ('manager', 'CUISINIER', 'SERVEUR', 'COMMIS', 'GERANT', 'BARMAN', 'HOTE', 'admin'));
    `);
};

exports.down = pgm => {
    pgm.sql(`
        ALTER TABLE company_memberships
        DROP CONSTRAINT company_memberships_role_check;

        ALTER TABLE company_memberships
        ADD CONSTRAINT company_memberships_role_check
        CHECK (role IN ('manager', 'CUISINIER', 'SERVEUR', 'COMMIS', 'GERANT', 'BARMAN', 'HOTE'));
    `);
};