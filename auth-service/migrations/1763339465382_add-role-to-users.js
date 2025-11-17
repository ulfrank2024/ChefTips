// auth-service/migrations/1763339465382_add-role-to-users.js

exports.up = pgm => {
  pgm.addColumn('users', {
    role: {
      type: 'varchar(50)',
      notNull: true,
      default: 'employee'
    }
  });
  pgm.sql("UPDATE users SET role = 'manager' WHERE id IN (SELECT user_id FROM company_memberships WHERE role = 'manager')");
  pgm.sql("UPDATE users SET role = 'employee' WHERE role IS NULL"); 
};

exports.down = pgm => {
  pgm.dropColumn('users', 'role');
};
