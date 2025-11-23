/* eslint-disable camelcase */

exports.up = (pgm) => {
  // On ne peut pas simplement changer le type, il faut d'abord supprimer la contrainte de clé étrangère si elle existe
  // et potentiellement d'autres contraintes. Ici, il n'y a pas de FK, mais il y a une contrainte unique.
  // La manière la plus sûre est de la supprimer et de la recréer.
  pgm.dropConstraint('subscriptions', 'subscriptions_company_id_key');

  // Changer le type de la colonne en UUID.
  // 'USING (company_id::text)' n'est pas nécessaire si on part d'un integer,
  // mais on va changer le type de la colonne en TEXT d'abord, puis en UUID pour être sûr.
  pgm.alterColumn('subscriptions', 'company_id', {
    type: 'uuid',
    using: 'company_id::text::uuid', // This might fail if there's data. Since we start fresh, it's ok.
  });

  // Recréer la contrainte unique
  pgm.addConstraint('subscriptions', 'subscriptions_company_id_key', {
    unique: 'company_id',
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('subscriptions', 'subscriptions_company_id_key');
  pgm.alterColumn('subscriptions', 'company_id', {
    type: 'integer',
    using: '0', // On doit fournir une valeur par défaut pour la conversion inverse
  });
  pgm.addConstraint('subscriptions', 'subscriptions_company_id_key', {
    unique: 'company_id',
  });
};
