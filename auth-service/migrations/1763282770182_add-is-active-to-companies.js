/* eslint-disable camelcase */

exports.up = pgm => {
  pgm.addColumn('companies', {
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
  });
};

exports.down = pgm => {
  pgm.dropColumn('companies', 'is_active');
};