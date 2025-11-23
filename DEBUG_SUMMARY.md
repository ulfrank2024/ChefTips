# Résumé du Débogage et des Résolutions de Problèmes (Novembre 2025)

Ce document récapitule les problèmes rencontrés lors de l'inscription d'un manager et les étapes détaillées prises pour les résoudre, y compris les dépannages liés aux bases de données, aux migrations, aux configurations Docker/ECS, et à AWS SES.

---

## Problème Initial : Erreur 500 lors de l'Inscription d'un Manager

**Symptômes :**
*   `POST https://api.cheftips.app/api/auth/signup` renvoie une erreur 500 (Internal Server Error).
*   Message côté frontend : `{error: 'INTERNAL_SERVER_ERROR'}` et `i18next::translator: missingKey en errors INTERNAL_SERVER_ERROR`.

---

### Problème 1 : Plan de Facturation par Défaut Manquant dans `billing-service`

**Cause Racine :**
Le `billing-service` ne trouvait pas de plan de facturation par défaut dans sa base de données (`billing_service_db`) lors de la tentative de création d'un abonnement d'essai pour la nouvelle entreprise.

**Logs Pertinents :**
*   `billing-service` : `createTrialSubscription: Default plan query result rows: 0`
*   `billing-service` : `createTrialSubscription: No default plan found.`
*   `auth-service` (réponse du `billing-service`) : `error: 'NO_DEFAULT_PLAN_FOUND'`

**Étapes de Résolution :**
1.  **Identification du fichier de migration :** Lecture de `billing-service/migrations/1763605838_insert-default-plan.js` confirmant son rôle pour insérer le plan par défaut.
2.  **Tentative d'exécution de migration via `aws ecs execute-command` :** Échec dû à des problèmes avec le flag `--interactive` de l'AWS CLI et la persistance des tâches Docker.
3.  **Stratégie de redéploiement forcé avec commande explicite dans Task Definition :**
    *   Modification de la `taskDefinition` du `billing-service` pour exécuter `npm run migrate up` avant de démarrer le serveur.
    *   **Commande utilisée :** `aws ecs update-service --cluster tips-app-cluster --service billing-service --task-definition billing-service-task:29 --force-new-deployment`

### Problème 2 : Ordre des Migrations Incorrect (`node-pg-migrate`)

**Cause Racine :**
Même après la modification de la Task Definition, les logs ont montré que `node-pg-migrate` tentait d'exécuter la migration `1763605838_insert-default-plan.js` *avant* la migration de création du schéma initial (`1763281403349_initial-billing-schema.js`). Cela était dû à la manière dont `node-pg-migrate` (ou le shell) triait les noms de fichiers, entraînant l'erreur `relation "plans" does not exist`.

**Logs Pertinents :**
*   `billing-service` : `Error: Not run migration 1763605838_insert-default-plan is preceding already run migration 1763281403349_initial-billing-schema`
*   `billing-service` : `error: relation "plans" does not exist` lors de l'exécution d'`INSERT INTO "plans"`.

**Étapes de Résolution :**
1.  **Renommage du fichier de migration :** Le fichier `billing-service/migrations/1763605838_insert-default-plan.js` a été renommé en `billing-service/migrations/1764000000000_insert-default-plan.js` pour assurer un tri alphanumérique correct par `node-pg-migrate`.
    *   **Commande utilisée :** `mv billing-service/migrations/1763605838_insert-default-plan.js billing-service/migrations/1764000000000_insert-default-plan.js`
2.  **Suppression et recréation de la base de données (`billing_service_db`) :** Pour assurer un état de base de données vierge et permettre aux migrations de s'exécuter dans le bon ordre à partir de zéro.
    *   **Commandes utilisées :**
        *   `aws rds delete-db-instance --db-instance-identifier billing-db-instance --skip-final-snapshot`
        *   *(Attente de suppression)*
        *   `aws rds create-db-instance --db-instance-identifier billing-db-instance --db-instance-class db.t3.micro --engine postgres --master-username tips_ulrich_2025 --master-user-password [REDACTED] --allocated-storage 20 --db-name billing_service_db --vpc-security-group-ids sg-0a5815e4c15b59501 --db-subnet-group-name default --publicly-accessible`
        *   *(Attente de création)*
3.  **Reconstruction et push de l'image Docker `billing-service` :** Pour inclure le fichier de migration renommé.
    *   **Commandes utilisées :** `find . -name '._*' -delete && docker buildx build --platform linux/amd64 -t billing-service:latest ./billing-service && docker tag billing-service:latest 946358504020.dkr.ecr.us-east-1.amazonaws.com/billing-service:latest && docker push 946358504020.dkr.ecr.us-east-1.amazonaws.com/billing-service:latest`
4.  **Redéploiement forcé du `billing-service` :** `aws ecs update-service --cluster tips-app-cluster --service billing-service --task-definition billing-service-task:29 --force-new-deployment`

### Problème 3 : `company_id` de type `INTEGER` au lieu de `UUID`

**Cause Racine :**
La colonne `company_id` dans la table `subscriptions` de la base de données `billing_service_db` était définie comme `integer`, alors que le `auth-service` envoyait des `UUID` pour l'ID de l'entreprise.

**Logs Pertinents :**
*   `billing-service` : `error: invalid input syntax for type integer: "d9a45f99-a167-4e40-8cd4-2108a8dc37ea"`

**Étapes de Résolution :**
1.  **Création d'une nouvelle migration :** Un fichier `billing-service/migrations/1765000000000_alter-company-id-to-uuid.js` a été créé pour modifier le type de la colonne `company_id` en `uuid`.
2.  **Mise à jour du script `migrate` dans `package.json` :** Pour forcer l'exécution séquentielle des migrations via `node-pg-migrate` avec l'option `-f` (car le tri automatique posait problème).
    *   **Modification du `billing-service/package.json` :**
        ```json
        "migrate:run": "PGUSER=$DB_USER PGHOST=$DB_HOST PGDATABASE=$DB_NAME PGPASSWORD=$DB_PASSWORD PGPORT=$DB_PORT node-pg-migrate -m migrations --verbose",
        "migrate": "npm run migrate:run -- -f migrations/1763281403349_initial-billing-schema.js up && npm run migrate:run -- -f migrations/1763343483959_create-app-settings-table.js up && npm run migrate:run -- -f migrations/1764000000000_insert-default-plan.js up && npm run migrate:run -- -f migrations/1765000000000_alter-company-id-to-uuid.js up",
        ```
3.  **Reconstruction et push de l'image Docker `billing-service` :** Pour inclure la nouvelle migration et le `package.json` mis à jour.
4.  **Redéploiement forcé du `billing-service` :** `aws ecs update-service --cluster tips-app-cluster --service billing-service --task-definition billing-service-task:29 --force-new-deployment`

### Problème 4 : `DATABASE_URL` non défini pour `node-pg-migrate`

**Cause Racine :**
Après la simplification des scripts npm, `node-pg-migrate` n'arrivait plus à obtenir les informations de connexion à la base de données, car la variable `DATABASE_URL` n'était pas passée explicitement dans son environnement lors de l'exécution.

**Logs Pertinents :**
*   `billing-service` : `The DATABASE_URL environment variable is not set or incomplete connection parameters are provided.`

**Étapes de Résolution :**
1.  **Simplification des scripts npm `migrate` et `start` :**
    *   `"start": "node server.js"`
    *   `"migrate": "node-pg-migrate"`
2.  **Modification de la `taskDefinition` pour passer les paramètres explicitement à `node-pg-migrate` :**
    *   La commande de démarrage du conteneur a été changée pour utiliser : `["sh", "-c", "node-pg-migrate -m migrations --host $DB_HOST --port $DB_PORT --user $DB_USER --password $DB_PASSWORD --database $DB_NAME up && node server.js"]`
3.  **Suppression et recréation de la base de données (`billing_service_db`) :** Pour assurer un état de base de données vierge pour cette nouvelle tentative.
    *   *(Mêmes commandes que le Problème 2)*
4.  **Reconstruction et push de l'image Docker `billing-service` :** Pour inclure le `package.json` mis à jour.
5.  **Redéploiement forcé du `billing-service` :** `aws ecs update-service --cluster tips-app-cluster --service billing-service --task-definition billing-service-task:30 --force-new-deployment`

### Problème 5 : Fichier de Template d'E-mail Non Trouvé dans `auth-service`

**Cause Racine :**
Le `auth-service` tentait d'envoyer un e-mail de bienvenue en utilisant un nom de template incorrect (`"Bienvenue / Welcome"`) qui ne correspondait pas au fichier réel (`welcome.hbs`).

**Logs Pertinents :**
*   `auth-service` : `Error generating email template Bienvenue / Welcome: Error: ENOENT: no such file or directory, open '/usr/src/app/emails/templates/Bienvenue / Welcome.hbs'`

**Étapes de Résolution :**
1.  **Correction de l'appel `sendEmail` dans `auth-service/controllers/signupController.js` :** Le nom du template a été changé de `"Bienvenue / Welcome"` à `'signup'`, le sujet étant résolu par le `emailService` via les fichiers `locales`.
    *   **Modification de `signupController.js` :** `await sendEmail(email, 'signup', templateData, 'en');`
2.  **Reconstruction et push de l'image Docker `auth-service` :** Pour inclure le code corrigé.
3.  **Redéploiement forcé du `auth-service` :** `aws ecs update-service --cluster tips-app-cluster --service auth-service --force-new-deployment`

### Problème 6 : Permissions AWS SES Manquantes (`AccessDenied`)

**Cause Racine :**
Le rôle IAM (`ecsTaskExecutionRole`) associé à la tâche ECS du `auth-service` n'avait pas les permissions `ses:SendEmail` nécessaires pour envoyer des e-mails via AWS SES.

**Logs Pertinents :**
*   `auth-service` : `AccessDenied: User arn:aws:sts::...assumed-role/ecsTaskExecutionRole/... is not authorized to perform ses:SendEmail' on resource ...`

**Étapes de Résolution :**
1.  **Attachement de la politique IAM `AmazonSESFullAccess` au rôle `ecsTaskExecutionRole` :** Pour accorder les permissions d'envoi d'e-mails.
    *   **Commande utilisée :** `aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess`
2.  **Redéploiement forcé du `auth-service` :** `aws ecs update-service --cluster tips-app-cluster --service auth-service --force-new-deployment` (pour que les tâches redémarrent avec le rôle IAM mis à jour).

### Problème 7 : Adresse E-mail Expéditrice Non Vérifiée dans SES (Mode Sandbox)

**Cause Racine :**
L'adresse e-mail configurée comme expéditeur dans l'application (`frranklinlontsi99@gmail.com`) n'était pas vérifiée dans AWS SES, et le compte SES était en mode "sandbox". En mode sandbox, SES ne peut envoyer des e-mails qu'à des adresses vérifiées.

**Logs Pertinents :**
*   `auth-service` : `MessageRejected: Email address is not verified. The following identities failed the check in region US-EAST-1: frranklinlontsi99@gmail.com`
*   `aws sesv2 get-account` : `"ProductionAccessEnabled": false`

**Étapes de Résolution :**
1.  **Création de l'identité d'e-mail dans SES :**
    *   **Commande utilisée :** `aws sesv2 create-email-identity --email-identity frranklinlontsi99@gmail.com`
2.  **Vérification Manuelle de l'Identité :** L'utilisateur a reçu un e-mail d'AWS à `frranklinlontsi99@gmail.com` et a cliqué sur le lien de vérification.
    *   **Confirmation du statut :** `aws sesv2 get-email-identity --email-identity frranklinlontsi99@gmail.com` a retourné `VerifiedForSendingStatus: true` et `VerificationStatus: SUCCESS`.
3.  **Redéploiement forcé du `auth-service` :** `aws ecs update-service --cluster tips-app-cluster --service auth-service --force-new-deployment` (pour que les tâches utilisent l'identité d'e-mail vérifiée).

---

### Problème Actuel : Toujours une erreur d'envoi d'e-mail au destinataire non vérifié

**Symptômes :**
*   L'inscription échoue toujours avec une erreur 500.
*   Logs du `auth-service` : `MessageRejected: Email address is not verified. The following identities failed the check in region US-EAST-1: ulrichfranklinlontsinobossi@gmail.com`

**Cause Racine :**
Votre compte AWS SES est toujours en **mode sandbox** (`"ProductionAccessEnabled": false`). En mode sandbox, vous ne pouvez envoyer des e-mails *qu'à des adresses vérifiées par vous* (les expéditeurs que vous avez configurés) ou à des *destinataires que vous avez également vérifiés*. Il est impossible d'envoyer à des adresses non vérifiées (comme l'e-mail d'un nouvel utilisateur) en mode sandbox.

**Prochaine Étape (Manuelle) : Demander l'Accès à la Production SES**
Vous devez suivre les étapes manuelles détaillées dans la section "Problème 7" ci-dessus pour demander à AWS de passer votre compte SES en mode production. Une fois cette demande approuvée par AWS, votre application pourra envoyer des e-mails à n'importe quel destinataire sans qu'ils aient besoin d'être individuellement vérifiés.

---
Je ne peux pas aller plus loin sans que votre compte AWS SES soit en mode production. Voulez-vous que je supprime les fichiers temporaires créés ?