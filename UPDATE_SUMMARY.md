# Synthèse des Mises à Jour et État Actuel du Projet

Ce document récapitule les modifications apportées et l'état actuel du projet, suite aux requêtes de l'utilisateur.

---

## 1. Modifications des Modèles d'E-mails et Liens de Connexion

**Objectif :** Améliorer la communication par e-mail avec les utilisateurs en ajoutant des liens de connexion pertinents.

### 1.1. Notification de Pourboire Partagé

*   **Description :** Lorsqu'un employé reçoit un pourboire partagé d'un collègue, il reçoit désormais une notification par e-mail avec le montant, le nom de l'expéditeur et un lien direct vers la page de connexion.
*   **Fichiers Modifiés :**
    *   `auth-service/controllers/emailController.js` : Ajout du `loginLink` aux données du template.
    *   `auth-service/emails/content/cashOutNotification.json` : Ajout des textes localisés (`login_cta`).
    *   `auth-service/emails/templates/cashOutNotification.hbs` : Modification pour afficher le `loginLink` sous forme de bouton.

### 1.2. E-mail de Bienvenue (Inscription)

*   **Description :** L'e-mail envoyé lors de la vérification initiale de l'adresse e-mail après une inscription contient maintenant un lien direct vers la page de connexion.
*   **Fichiers Modifiés :**
    *   `auth-service/emails/content/signup.json` : Ajout des textes localisés (`login_prompt`, `login_cta`).
    *   `auth-service/emails/templates/signup.hbs` : Modification pour afficher le `loginPageUrl` sous forme de bouton.

### 1.3. E-mail de Bienvenue (Après Configuration de l'Invitation)

*   **Description :** L'e-mail envoyé aux employés invités après qu'ils aient configuré leur mot de passe contient désormais un lien direct vers la page de connexion.
*   **Fichiers Modifiés :**
    *   `auth-service/controllers/verificationController.js` : Ajout du `loginPageUrl` aux données du template `welcomeEmployee`.
    *   `auth-service/emails/content/welcomeEmployee.json` : Ajout des textes localisés (`login_prompt`, `login_cta`).
    *   `auth-service/emails/templates/welcomeEmployee.hbs` : Modification pour afficher le `loginPageUrl` sous forme de bouton.

---

## 2. Refonte du Système de Rôles/Départements en Catégories Personnalisables

**Objectif :** Remplacer le concept rigide de "département" et de "rôles prédéfinis" par un système de "catégories" flexibles définies par le manager, incluant une option pour désigner une catégorie comme "pool de pourboires" (`is_tip_distribution_pool`).

### 2.1. Backend (`auth-service`)

*   **Migration de Base de Données (`auth-service/migrations/1765195634591_create-categories-table.js`) :**
    *   Création de la table `categories` avec `id`, `company_id`, `name`, `is_tip_distribution_pool` (BOOLEAN), `created_at`, `updated_at`.
    *   Ajout de la colonne `category_id` à la table `company_memberships` (nullable).
    *   La colonne `role` dans `company_memberships` est rendue `nullable`.
    *   Suppression de la table `departments`.
*   **Modèles :**
    *   `auth-service/models/CategoryModel.js` : Nouveau modèle pour les opérations CRUD sur les catégories.
    *   `auth-service/models/MembershipModel.js` : Mis à jour pour utiliser `category_id` au lieu de `role`, et inclut des jointures à `categories` pour récupérer les données complètes des employés.
*   **Contrôleurs :**
    *   `auth-service/controllers/employeeController.js` : `inviteEmployee` passe désormais `null` pour `categoryId` (sera défini par le manager ultérieurement), `updateMembership` attend `categoryId`.
    *   `auth-service/controllers/companyController.js` : La fonction `getCompanyDepartments` a été supprimée.
    *   `auth-service/controllers/categoryController.js` : Nouveau contrôleur pour les opérations CRUD sur les catégories.
*   **Routes :**
    *   `auth-service/routes/authRoutes.js` : La route `/departments` a été supprimée, et les routes CRUD pour `/categories` ont été ajoutées.

### 2.2. Backend (`tip-service`)

*   **Migration de Base de Données (`tip-service/migrations/1765196208540_refactor-tip-rules-for-categories.js`) :**
    *   Ajout des colonnes `category_id` (nullable) aux tables `daily_reports` et `tip_pools`.
    *   Ajout de la colonne `destination_category_id` (nullable) à la table `tip_out_rules`.
    *   Les colonnes `role` (`daily_reports`, `tip_pools`) et `destination_role` (`tip_out_rules`) sont rendues `nullable`.
*   **Services :**
    *   `tip-service/services/authService.js` : Ajout de la fonction `getCategories` pour récupérer les catégories depuis `auth-service`.
*   **Modèles :**
    *   `tip-service/models/tipModel.js` : Mis à jour pour utiliser `category_id` pour les insertions/récupérations et pour effectuer des jointures avec les catégories.
    *   `tip-service/models/ruleModel.js` : Mis à jour pour utiliser `destination_category_id` lors de la création et de la modification des règles.
*   **Contrôleurs :**
    *   `tip-service/controllers/reportController.js` : Refactorisation majeure pour utiliser `category_id` et le flag `is_tip_distribution_pool` pour les calculs de pourboires et les notifications.
    *   `tip-service/controllers/poolController.js` : Mis à jour pour utiliser `categoryId` et le flag `is_tip_distribution_pool` pour la création de pools et les résumés.

---

## 3. Problème Actuel et Débogage (auth-service)

**Description du Problème :**
Actuellement, le déploiement du `auth-service` sur AWS ECS échoue de manière répétée. Les tâches du service ne démarrent pas correctement, affichant `exitCode: 1` et `stoppedReason: "Essential container in task exited"`.

**Analyse des Logs CloudWatch :**
Les logs du conteneur (`aws logs get-log-events`) indiquent un `SyntaxError: Unexpected token 'export'` dans le fichier de migration `auth-service/migrations/1765195634591_create-categories-table.js`.
`Error: Can't get migration files: /usr/src/app/migrations/1765195634591_create-categories-table.js:5 export const shorthands = undefined; SyntaxError: Unexpected token 'export'`

**Cause :**
Même si le fichier de migration a été converti en syntaxe CommonJS localement (`module.exports = { shorthands, up, down };`), le conteneur Docker semble toujours utiliser une ancienne version du fichier contenant la syntaxe ES Module (`export const`). Cela est probablement dû à un problème de cache Docker lors de la construction de l'image.

**Action Corrective Tentée :**
*   Suppression des fichiers de métadonnées macOS (`._*`) dans les répertoires `auth-service` et `tip-service`.
*   Reconstruction de l'image Docker de `auth-service` avec l'option `--no-cache` pour forcer la prise en compte des dernières modifications.
*   Push de la nouvelle image vers ECR et mise à jour du service ECS.

**Résultat :** Le problème persiste, les logs continuent de montrer le même `SyntaxError`.

---

## 4. Prochaines Étapes pour le Débogage

1.  **Vérification de l'image Docker sur ECR :** S'assurer que l'image la plus récente poussée vers ECR contient bien la version CommonJS du fichier de migration. Une inspection manuelle du `Dockerfile` et du `build` process Docker pourrait être nécessaire pour s'assurer que les fichiers corrects sont inclus.
2.  **Exécution manuelle de la migration (pour test) :** Si possible, tenter d'exécuter la commande `npm run migrate` manuellement dans un conteneur temporaire pour isoler le problème.
3.  **Vérification des dépendances :** S'assurer que toutes les dépendances nécessaires (`node-pg-migrate`, `dotenv`, etc.) sont correctement installées et compatibles dans l'environnement du conteneur.
4.  **Examen du `Dockerfile` :** Confirmer que la copie des fichiers de migration se fait après `npm install` et que l'environnement Node.js dans le conteneur est configuré pour gérer correctement les modules.

Le débogage de l'échec de démarrage de `auth-service` est la priorité absolue avant de pouvoir continuer le développement frontend ou la validation des nouvelles fonctionnalités.
