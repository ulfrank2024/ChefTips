/* eslint-disable camelcase */

exports.up = pgm => {
  pgm.createTable('plans', {
    id: 'id',
    name: { type: 'text', notNull: true, unique: true },
    monthly_fee: { type: 'integer', notNull: true, default: 0 }, // en centimes
    transaction_fee_percent: { type: 'numeric(5, 2)', notNull: true, default: 0.00 }, // ex: 1.50 pour 1.5%
    default_trial_days: { type: 'integer', notNull: true, default: 14 },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  pgm.createTable('subscriptions', {
    id: 'id',
    company_id: { type: 'integer', notNull: true, unique: true }, // Référence à l'ID de l'entreprise dans auth-service
    plan_id: { type: 'integer', notNull: true, references: 'plans(id)', onDelete: 'RESTRICT' },
    stripe_customer_id: { type: 'text', notNull: true, unique: true },
    stripe_subscription_id: { type: 'text', unique: true }, // Peut être null au début (période d'essai sans abonnement Stripe actif)
    status: { type: 'text', notNull: true, default: 'trialing' }, // trialing, active, past_due, suspended, canceled
    trial_ends_at: { type: 'timestamp', notNull: true },
    current_period_ends_at: { type: 'timestamp' }, // Peut être null pour les essais ou avant le premier paiement
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // Ajout d'un index pour optimiser les recherches par company_id
  pgm.createIndex('subscriptions', 'company_id');
};

exports.down = pgm => {
  pgm.dropTable('subscriptions');
  pgm.dropTable('plans');
};