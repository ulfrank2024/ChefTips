exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO "plans" ("name", "monthly_fee", "transaction_fee_percent", "default_trial_days", "is_active") VALUES
    ('Free Trial', 0, 0.00, 30, TRUE);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM "plans" WHERE "name" = 'Free Trial';
  `);
};
