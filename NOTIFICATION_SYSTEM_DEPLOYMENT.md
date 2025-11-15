# Migration du Système de Notification vers AWS SES

Ce document détaille les étapes nécessaires pour faire migrer le système d'envoi d'e-mails de l'application, en passant de `nodemailer` avec un fournisseur SMTP (Gmail) à **Amazon Simple Email Service (SES)**.

## 1. Objectif

L'objectif est de remplacer la solution actuelle, qui n'est pas adaptée à la production, par un service d'envoi d'e-mails robuste, évolutif et professionnel.

**Problèmes de la solution actuelle :**
- Utilisation d'un compte Gmail personnel.
- Limites d'envoi strictes, inadaptées aux envois en masse.
- Risque élevé que les e-mails soient marqués comme spam.
- Manque de suivi (délivrabilité, erreurs, etc.).

**Avantages d'Amazon SES :**
- Haute performance et scalabilité.
- Meilleure délivrabilité.
- Intégration native avec l'écosystème AWS existant.
- Coûts optimisés et basés sur l'utilisation.

---

## 2. Plan de Migration

### Étape 1 : Configuration d'AWS SES

1.  **Vérifier une Identité d'Envoi :**
    -   Dans la console AWS, naviguer vers le service **Simple Email Service (SES)**.
    -   Aller dans "Verified identities" et cliquer sur "Create identity".
    -   Choisir de vérifier un **domaine** (recommandé, si `cheftips.app` est disponible) ou une **adresse e-mail** (par exemple, `noreply@cheftips.app`).
    -   Suivre les instructions pour finaliser la vérification (ajout d'enregistrements DNS ou clic sur un lien de vérification).

2.  **Demander l'Accès en Production :**
    -   Par défaut, les nouveaux comptes SES sont en mode "sandbox", ce qui limite les envois à des adresses vérifiées uniquement.
    -   Soumettre une demande pour passer en mode production afin de pouvoir envoyer des e-mails à n'importe quel utilisateur.

### Étape 2 : Mise à jour de l'Infrastructure AWS (IAM & ECS)

1.  **Mettre à jour le Rôle IAM :**
    -   Identifier le rôle IAM utilisé par les tâches ECS : `ecsTaskExecutionRole`.
    -   Créer une nouvelle politique IAM ou en modifier une existante pour ajouter la permission `ses:SendEmail`.
    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": "ses:SendEmail",
                "Resource": "*"
            }
        ]
    }
    ```
    -   Attacher cette politique au rôle `ecsTaskExecutionRole`.

2.  **Nettoyer la Définition de Tâche ECS :**
    -   Modifier le fichier `auth-task-def.json`.
    -   **Supprimer** toutes les variables d'environnement liées à l'ancien système SMTP :
        -   `SMTP_HOST`
        -   `SMTP_PORT`
        -   `SMTP_SECURE`
        -   `SMTP_USER`
        -   `SMTP_PASSWORD`
        -   `SMTP_FROM_EMAIL`
    -   Ajouter des variables pour SES (si nécessaire, comme l'adresse d'envoi vérifiée et la région) :
        -   `SES_FROM_EMAIL`: L'adresse vérifiée à l'étape 1.
        -   `AWS_REGION`: La région AWS (ex: `us-east-1`).

### Étape 3 : Mise à jour du Code de l'Application (`auth-service`) - **COMPLÉTÉE**

1.  **Gérer les Dépendances :**
    -   Installer le SDK AWS pour SES : `@aws-sdk/client-ses` **(COMPLÉTÉE)**
    -   Désinstaller `nodemailer` : `nodemailer` **(COMPLÉTÉE)**

2.  **Création des Fichiers de Traduction :**
    -   Création du dossier `auth-service/locales`. **(COMPLÉTÉE)**
    -   Création de `auth-service/locales/fr.json` et `auth-service/locales/en.json` avec les traductions des rôles et des sujets. **(COMPLÉTÉE)**

3.  **Modifier le Service d'E-mail (`emailService.js`) :**
    -   Remplacer l'initialisation de `nodemailer` par celle du client SES. **(COMPLÉTÉE)**
    -   Réécrire la fonction `sendEmail` pour qu'elle utilise `SendEmailCommand` du SDK AWS et gère la traduction des sujets. **(COMPLÉTÉE)**

4.  **Modifier le Contrôleur d'E-mail (`emailController.js`) :**
    -   Mettre à jour la fonction `sendCashOutNotification` pour traduire le rôle et appeler `sendEmail` avec la nouvelle signature. **(COMPLÉTÉE)**

### Étape 4 : Déploiement et Validation

1.  **Construire et Pousser l'Image Docker :**
    -   Reconstruire l'image Docker du `auth-service` pour inclure les nouvelles dépendances et les modifications du code.
    ```bash
    docker buildx build --platform linux/amd64 -t auth-service:latest ./auth-service
    docker tag auth-service:latest <your-aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/auth-service:latest
    docker push <your-aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/auth-service:latest
    ```

2.  **Mettre à jour le Service ECS :**
    -   Enregistrer la nouvelle version de la définition de tâche (`auth-task-def.json`).
    -   Mettre à jour le service `auth-service` dans le cluster ECS pour forcer un nouveau déploiement avec la dernière définition de tâche.

3.  **Tester :**
    -   Déclencher une action dans l'application qui envoie un e-mail (par exemple, une inscription ou une notification).
    -   Vérifier la réception de l'e-mail et consulter les métriques d'envoi dans la console AWS SES.
