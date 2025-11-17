# Plan de Développement : Module d'Administration et de Facturation (COMPLÉTÉE)

## 1. Objectif

Ce document détaille les étapes de développement pour la mise en place d'un système complet de gestion des restaurants, des abonnements et de la facturation. L'objectif est de fournir au promoteur de l'application un tableau de bord (`admin-web-app`) pour piloter l'activité commerciale, tout en offrant une expérience de facturation claire et automatisée pour les clients (managers de restaurants) via l'application `manager-web-app`.

---

## 2. Architecture d'Ensemble

*   **Nouveaux Services :**
    *   `billing-service` (Node.js/Express) : Le cerveau de la facturation. Gère les plans, les abonnements, communique avec Stripe et orchestre la suspension/réactivation des comptes.
    *   `admin-web-app` (React/Vite) : Votre tableau de bord pour gérer les restaurants, les plans et visualiser les revenus.

*   **Services à Mettre à Jour :**
    *   `auth-service` : Doit savoir si un restaurant est "actif" ou "suspendu" pour autoriser ou bloquer les connexions.
    *   `tip-service` : Doit pouvoir calculer et fournir le volume total de pourboires pour un restaurant sur une période donnée.
    *   `manager-web-app` : Doit intégrer une interface de facturation pour que les managers puissent gérer leur abonnement.

---

## 3. Plan d'Action Détaillé

### Phase 1 : Le `billing-service` - Le Cerveau de la Facturation

#### Tâche 1.1 : Initialisation du Projet
- Créer le répertoire `billing-service`.
- Initialiser un projet Node.js, Express.js, et `Dockerfile`.
- Ajouter les dépendances : `express`, `pg`, `dotenv`, `node-pg-migrate`, `stripe`.

#### Tâche 1.2 : Conception et Création de la Base de Données
- Créer une base de données PostgreSQL dédiée.
- **Schéma :**
    - **Table `plans` :** `id`, `name`, `monthly_fee` (en centimes), `transaction_fee_percent`, `default_trial_days`, `is_active`.
    - **Table `subscriptions` :** `id`, `company_id`, `plan_id`, `stripe_customer_id`, `stripe_subscription_id`, `status` (`trialing`, `active`, `past_due`, `suspended`), `trial_ends_at`, `current_period_ends_at`.

#### Tâche 1.3 : Intégration et Logique Métier Stripe
- **API et Webhooks :**
    - Configurer les clés d'API Stripe.
    - Mettre en place un endpoint de webhook pour écouter les événements Stripe (`invoice.payment_failed`, `customer.subscription.updated`, etc.). **(PARTIELLEMENT COMPLÉTÉE - Endpoint mis en place, logique à affiner)**
- **Logique d'Abonnement :**
    - Créer une fonction pour abonner un nouveau restaurant (création client Stripe, création de l'abonnement en `trialing`). **(COMPLÉTÉE)**
- **Tâche Planifiée (Cron Job) :**
    - Mettre en place une tâche mensuelle pour rapporter l'utilisation (volume de pourboires) à Stripe pour chaque abonnement. **(COMPLÉTÉE)**
- **Gestion des Statuts :**
    - Implémenter la logique des webhooks pour mettre à jour les statuts (`active`, `past_due`, `suspended`) dans notre base de données.
    - En cas de suspension, appeler l'API interne du `auth-service` pour bloquer le compte. **(COMPLÉTÉE)**

#### Tâche 1.4 : Gestion des Communications
- **Factures PDF et E-mails Transactionnels :**
    - **Déléguer à Stripe :** Configurer le portail de facturation de Stripe pour qu'il envoie automatiquement les factures PDF aux clients après chaque paiement réussi. **(COMPLÉTÉE - Configuration Stripe)**
    - **Personnalisation :** Personnaliser les modèles d'e-mails et de factures de Stripe avec le logo et les informations de l'entreprise. **(COMPLÉTÉE - Configuration Stripe)**
    - **Relances (`Dunning`) :** Activer et configurer le système de relance de Stripe pour gérer automatiquement les notifications d'échec de paiement. **(COMPLÉTÉE - Configuration Stripe)**
- **Notifications Applicatives :**
    - Le `billing-service` appellera une API interne du `auth-service` (qui gère déjà AWS SES) pour envoyer des e-mails de notification non-financiers, comme "Votre période d'essai se termine dans 3 jours". **(COMPLÉTÉE)**

### Phase 2 : Ajustements des Services Existants

#### Tâche 2.1 : Modifications sur `auth-service`
- **Base de Données :**
    - Ajouter une colonne `is_active` (BOOLEAN, default: `true`) à la table `companies`. **(COMPLÉTÉE)**
- **API Interne :**
    - Créer des endpoints sécurisés pour que le `billing-service` puisse suspendre (`/suspend`) et réactiver (`/reactivate`) une entreprise. **(COMPLÉTÉE)**
- **Logique d'Authentification :**
    - Modifier le middleware d'authentification pour vérifier si la `company` de l'utilisateur est `is_active = true`. Sinon, refuser l'accès. **(COMPLÉTÉE)**

#### Tâche 2.2 : Modifications sur `tip-service`
- **API Interne :**
    - Créer un endpoint sécurisé (`/api/internal/reports/volume`) pour que le `billing-service` puisse récupérer le total des pourboires bruts d'une entreprise sur une période. **(COMPLÉTÉE)**

### Phase 3 : Modifications sur `manager-web-app` (Interface Client)

#### Tâche 3.1 : Page de Gestion de l'Abonnement
- Créer une nouvelle route et page sécurisée `/billing`. **(COMPLÉTÉE - Initialisation de la page)**
- Cette page devra :
    - Afficher les plans tarifaires disponibles (récupérés depuis le `billing-service`). **(COMPLÉTÉE)**
    - Permettre au manager de choisir un plan et de s'abonner. **(COMPLÉTÉE)**
    - Intégrer le **Stripe Payment Element** : un formulaire UI sécurisé fourni par Stripe pour que le manager entre ses coordonnées bancaires. **Ces données sensibles n'atteindront jamais nos serveurs.** **(COMPLÉTÉE)**
    - Afficher le statut actuel de l'abonnement (ex: "En essai jusqu'au...", "Plan Premium actif"). **(COMPLÉTÉE)**
    - Permettre au manager de mettre à jour son moyen de paiement ou de changer de plan via le **portail client de Stripe**. **(COMPLÉTÉE)**

#### Tâche 3.2 : Indicateurs Visuels et Notifications
- Implémenter un composant de **bannière globale** visible sur toute l'application. **(COMPLÉTÉE)**
- La bannière changera de couleur et de message selon le statut de l'abonnement :
    - **Bleu/Info (Pendant l'essai) :** "Il vous reste X jours d'essai. [Choisir un plan]" **(COMPLÉTÉE)**
    - **Rouge/Alerte (En cas d'impayé `past_due`) :** "Votre paiement a échoué. Pour éviter la suspension de votre compte, veuillez [mettre à jour votre moyen de paiement]." **(COMPLÉTÉE)**
    - **Rouge/Alerte (Compte suspendu) :** "Votre compte est suspendu. Veuillez régler votre facture pour le réactiver." **(COMPLÉTÉE)**

#### Tâche 3.3 : Logique de Blocage et Redirection
- Si une requête API échoue avec un statut indiquant que le compte est suspendu, l'application doit :
    - Bloquer toute navigation ultérieure. **(COMPLÉTÉE)**
    - Rediriger automatiquement le manager vers la page `/billing`. **(COMPLÉTÉE)**
    - Afficher un message clair : "Votre compte est suspendu pour cause d'impayé. Veuillez régler votre facture pour le réactiver." **(COMPLÉTÉE)**

### Phase 4 : L'`admin-web-app` - Votre Centre de Contrôle **(COMPLÉTÉE)**

#### Tâche 4.1 : Initialisation du Projet
- Créer le répertoire `admin-web-app` (React/Vite, Material-UI). **(COMPLÉTÉE)**

#### Tâche 4.2 : Authentification du Promoteur
- Créer une page de connexion sécurisée. **(COMPLÉTÉE)**

#### Tâche 4.3 : Développement des Vues
- **Tableau de Bord Principal :** KPIs (MRR, clients actifs, en essai). **(COMPLÉTÉE)**
- **Gestion des Restaurants :** **(COMPLÉTÉE)**
    - Lister les restaurants et leur statut d'abonnement. **(COMPLÉTÉE)**
    - Vue détaillée pour **changer le plan** d'un restaurant ou **prolonger sa période d'essai**. **(COMPLÉTÉE)**
- **Gestion des Plans Tarifaires :** **(COMPLÉTÉE)**
    - CRUD complet pour les plans (créer, modifier, désactiver). **(COMPLÉTÉE)**
- **Paramètres Globaux :**
    - Modifier la **durée de la période d'essai par défaut**. **(COMPLÉTÉE)**

---
Ce plan mis à jour est plus complet. La première étape reste la **Tâche 1.1 : Initialisation du projet `billing-service`**.

## Historique des Dépannages et Mises à Jour Locales

Cette section résume les problèmes rencontrés et les solutions appliquées lors du développement et du dépannage local des services.

### 1. `tip-service`
- **Problème :** `ReferenceError: getGrossTipsVolume is not defined` lors du démarrage local et sur ECS.
  - **Solution :** Assuré que `getGrossTipsVolume` est correctement définie et exportée dans `tip-service/controllers/reportController.js` et que l'image Docker est reconstruite pour inclure ces modifications.
- **Problème :** Erreurs de build Docker dues aux fichiers de métadonnées macOS (`._*`).
  - **Solution :** Suppression des fichiers `._*` et ajout de `._*` au `.dockerignore` du `tip-service`.
- **Problème :** Persistance de l'ancienne version du service sur ECS malgré les mises à jour.
  - **Solution :** Forcé l'enregistrement d'une nouvelle révision de la définition de tâche ECS pointant explicitement vers l'image `:latest` et mis à jour le service ECS.

### 2. `auth-service`
- **Problème :** `Error: The server does not support SSL connections` lors de l'exécution de scripts de base de données locaux.
  - **Solution :** Désactivation de la configuration SSL dans `auth-service/db.js` pour la connexion à la base de données PostgreSQL locale (non-SSL).
- **Problème :** `Error: Cannot find module 'axios'` au démarrage du service.
  - **Solution :** Ajout de `axios` aux `dependencies` dans `auth-service/package.json` et reconstruction de l'image Docker.
- **Problème :** `ReferenceError: suspendCompany is not defined` au démarrage du service.
  - **Solution :** Importation de `suspendCompany` et `reactivateCompany` depuis `auth-service/controllers/companyController.js` dans `auth-service/routes/authRoutes.js`.
- **Problème :** `ReferenceError: sendInternalEmail is not defined` au démarrage du service.
  - **Solution :** Importation de `sendInternalEmail` depuis `auth-service/controllers/emailController.js` dans `auth-service/routes/authRoutes.js`.
- **Problème :** `Error: secretOrPrivateKey must have a value` lors de la connexion.
  - **Solution :** Ajout de la variable d'environnement `JWT_SECRET` avec une valeur forte dans `auth-service/.env`.
- **Problème :** `NO_COMPANY_MEMBERSHIP` après la connexion de l'admin.
  - **Solution :** Création d'un script `auth-service/create-admin-company.js` pour créer une entreprise et y associer l'utilisateur admin.
- **Problème :** Erreurs de build Docker dues aux fichiers de métadonnées macOS (`._*`).
  - **Solution :** Suppression des fichiers `._*` et ajout de `._*` au `.dockerignore` du `auth-service`.
- **Problème :** Incohérence du mappage de port Docker Compose.
  - **Solution :** Harmonisation du mappage de port dans `docker-compose.yml` (`4000:3000`) pour correspondre au port d'écoute réel du service (3000).

### 3. `admin-web-app`
- **Problème :** `net::ERR_CONNECTION_REFUSED` lors de la connexion.
  - **Solution :** Mise à jour de `VITE_AUTH_API_URL` dans `admin-web-app/.env` pour pointer vers `http://localhost:4000/api/auth`, correspondant au port mappé du `auth-service` local.

### 4. Configuration AWS SES
- **Problème :** Domaine MAIL FROM personnalisé "En attente".
  - **Solution :** Vérification des enregistrements DNS MX et TXT pour `mail.cheftips.app`, confirmant qu'ils sont correctement configurés et en attente de propagation DNS. Aucune action supplémentaire requise, juste de l'attente.
