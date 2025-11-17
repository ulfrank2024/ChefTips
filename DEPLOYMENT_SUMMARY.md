# Résumé du Déploiement du Backend sur AWS Fargate

Ce document récapitule toutes les étapes, commandes et configurations effectuées pour déployer les services `auth-service` et `tip-service` sur AWS Fargate.

## Prérequis

*   Compte AWS actif.
*   AWS CLI installé et configuré avec les identifiants de l'utilisateur IAM (`admin`).
*   Docker Desktop installé et fonctionnel.

## Informations Clés Utilisées

*   **Région AWS :** `us-east-1`
*   **ID de Compte AWS :** `946358504020`
*   **Nom d'utilisateur RDS :** `tips_ulrich_2025`
*   **Mot de passe RDS :** `[REDACTED]` (⚠️ **ATTENTION :** Pour la production, utilisez AWS Secrets Manager !)
*   **Adresse IP Publique Locale :** `24.203.93.101` (utilisée pour la configuration initiale du pare-feu RDS)
*   **Email SMTP :** `frranklinlontsi99@gmail.com`
*   **Mot de passe SMTP :** `[REDACTED]` (⚠️ **ATTENTION :** Pour la production, utilisez AWS Secrets Manager !)
*   **JWT Secret :** `[REDACTED]` (⚠️ **ATTENTION :** Pour la production, utilisez AWS Secrets Manager !)

---

## Étapes de Déploiement

### Étape 1 : Configuration de l'AWS CLI

*   **Objectif :** Connecter votre terminal à votre compte AWS.
*   **Commande :**
    ```bash
    aws configure
    ```
    *   **Inputs :**
        *   `AWS Access Key ID`: [Votre nouvelle clé d'accès, ex: `AKIA...`]
        *   `AWS Secret Access Key`: [Votre clé secrète, ex: `xyz...`]
        *   `Default region name`: `us-east-1`
        *   `Default output format`: `json`
    *   **Note :** Les clés d'accès ont été générées via la console AWS (IAM > Users > admin > Security credentials > Create access key).

### Étape 2 : Préparation des Bases de Données (Amazon RDS)

*   **Objectif :** Créer deux instances PostgreSQL managées sur AWS RDS et configurer leur accès.

#### 2.1 Création de la base de données `auth-service`

*   **Commande :**
    ```bash
    aws rds create-db-instance \
      --db-name auth_service_db \
      --db-instance-identifier auth-db-instance \
      --allocated-storage 20 \
      --db-instance-class db.t3.micro \
      --engine postgres \
      --master-username tips_ulrich_2025 \
      --master-user-password [REDACTED] \
      --publicly-accessible
    ```
*   **Output :** JSON confirmant le statut `creating`.
*   **Endpoint :** `auth-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com`

#### 2.2 Création de la base de données `tip-service`

*   **Commande :**
    ```bash
    aws rds create-db-instance \
      --db-name tip_service_db \
      --db-instance-identifier tip-db-instance \
      --allocated-storage 20 \
      --db-instance-class db.t3.micro \
      --engine postgres \
      --master-username tips_ulrich_2025 \
      --master-user-password [REDACTED] \
      --publicly-accessible
    ```
*   **Output :** JSON confirmant le statut `creating`.
*   **Endpoint :** `tip-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com`

#### 2.3 Configuration du Groupe de Sécurité RDS

*   **Objectif :** Autoriser votre IP publique à se connecter aux bases de données RDS.
*   **ID du Groupe de Sécurité :** `sg-0a5815e4c15b59501` (récupéré lors de la création de la DB)
*   **Commande pour autoriser l'accès :**
    ```bash
    aws ec2 authorize-security-group-ingress \
      --group-id sg-0a5815e4c15b59501 \
      --protocol tcp \
      --port 5432 \
      --cidr 24.203.93.101/32
    ```

#### 2.4 Mise à jour des fichiers `.env` des services

*   **Objectif :** Configurer les services pour qu'ils utilisent les nouvelles bases de données RDS.

##### `auth-service/.env`
*   **Contenu mis à jour :**
    ```
    # SMTP Configuration
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=465
    SMTP_SECURE=true
    SMTP_USER=frranklinlontsi99@gmail.com
    SMTP_PASSWORD=[REDACTED]
    SMTP_FROM_EMAIL=frranklinlontsi99@gmail.com

    # PostgreSQL Configuration for AWS RDS
    DB_USER=tips_ulrich_2025
    DB_HOST=auth-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com
    DB_NAME=auth_service_db
    DB_PASSWORD=[REDACTED]
    DB_PORT=5432

    # JWT Secret
    JWT_SECRET="[REDACTED]"
    ```

##### `tip-service/.env`
*   **Contenu mis à jour :**
    ```
    PORT=4001

    # PostgreSQL Configuration for AWS RDS
    DB_USER=tips_ulrich_2025
    DB_HOST=tip-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com
    DB_NAME=tip_service_db
    DB_PASSWORD=[REDACTED]
    DB_PORT=5432

    # SMTP Configuration
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=465
    SMTP_SECURE=true
    SMTP_USER=frranklinlontsi99@gmail.com
    SMTP_PASSWORD=[REDACTED]
    SMTP_FROM_EMAIL=frranklinlontsi99@gmail.com

    JWT_SECRET=[REDACTED]
    ```

### Étape 3 : Publication des Images Docker sur Amazon ECR

*   **Objectif :** Construire les images Docker pour la plateforme `linux/amd64` et les stocker sur ECR.

#### 3.1 Création des dépôts ECR

*   **Commande `auth-service` :**
    ```bash
    aws ecr create-repository --repository-name auth-service --image-scanning-configuration scanOnPush=true
    ```
*   **Commande `tip-service` :**
    ```bash
    aws ecr create-repository --repository-name tip-service --image-scanning-configuration scanOnPush=true
    ```

#### 3.2 Authentification Docker à ECR

*   **Objectif :** Permettre à votre client Docker local de communiquer avec ECR.
*   **Commande :**
    ```bash
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 946358504020.dkr.ecr.us-east-1.amazonaws.com
    ```

#### 3.3 Construction et Push de l'image `auth-service`

*   **Objectif :** Reconstruire l'image pour `linux/amd64` et l'envoyer sur ECR.
*   **Commandes :**
    ```bash
    find . -name '._*' -delete
    docker buildx build --platform linux/amd64 -t auth-service:latest ./auth-service
    docker tag auth-service:latest 946358504020.dkr.ecr.us-east-1.amazonaws.com/auth-service:latest
    docker push 946358504020.dkr.ecr.us-east-1.amazonaws.com/auth-service:latest
    ```

#### 3.4 Construction et Push de l'image `tip-service`

*   **Objectif :** Reconstruire l'image pour `linux/amd64` et l'envoyer sur ECR.
*   **Commandes :**
    ```bash
    find . -name '._*' -delete
    docker buildx build --platform linux/amd64 -t tip-service:latest ./tip-service
    docker tag tip-service:latest 946358504020.dkr.ecr.us-east-1.amazonaws.com/tip-service:latest
    docker push 946358504020.dkr.ecr.us-east-1.amazonaws.com/tip-service:latest
    ```

### Étape 4 : Déploiement des Services sur Amazon ECS (Fargate)

*   **Objectif :** Lancer et maintenir les conteneurs de services sur AWS.

#### 4.1 Création du Cluster ECS

*   **Objectif :** Créer l'environnement logique pour les services.
*   **Commande :**
    ```bash
    aws ecs create-cluster --cluster-name tips-app-cluster
    ```

#### 4.2 Création du Rôle d'Exécution de Tâche IAM

*   **Objectif :** Donner à ECS les permissions nécessaires pour exécuter les tâches.
*   **Commandes :**
    ```bash
    aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
    aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    ```

#### 4.3 Configuration Réseau pour les Services ECS

*   **Objectif :** Définir les sous-réseaux et le groupe de sécurité pour les services.
*   **ID du Groupe de Sécurité des Services :** `sg-0b1553f902d01194c`
*   **Subnets :** `["subnet-09650ce60ec6aee63","subnet-0abe034e0cce968dc","subnet-0ded40f7696adc1f6","subnet-076f8b80777e29daa","subnet-0e6852c975bc9695b","subnet-0ee340078ad1e8fe4"]`

##### 4.3.1 Création du Groupe de Sécurité des Services

*   **Commande :**
    ```bash
    aws ec2 create-security-group --group-name ecs-services-sg --description "Security group for ECS services"
    ```

##### 4.3.2 Ajout de la Règle d'Ingress (Port 3000)

*   **Commande :**
    ```bash
    aws ec2 authorize-security-group-ingress --group-id sg-0b1553f902d01194c --protocol tcp --port 3000 --cidr 0.0.0.0/0
    ```

##### 4.3.3 Création du fichier `network-config.json`

*   **Contenu :**
    ```json
    {
      "awsvpcConfiguration": {
        "subnets": [
          "subnet-09650ce60ec6aee63",
          "subnet-0abe034e0cce968dc",
          "subnet-0ded40f7696adc1f6",
          "subnet-076f8b80777e29daa",
          "subnet-0e6852c975bc9695b",
          "subnet-0ee340078ad1e8fe4"
        ],
        "securityGroups": [
          "sg-0b1553f902d01194c"
        ],
        "assignPublicIp": "ENABLED"
      }
    }
    ```

#### 4.4 Déploiement du `auth-service`

##### 4.4.1 Création du fichier `auth-task-def.json`

*   **Contenu :**
    ```json
    {
        "family": "auth-service-task",
        "networkMode": "awsvpc",
        "requiresCompatibilities": [
            "FARGATE"
        ],
        "cpu": "256",
        "memory": "512",
        "executionRoleArn": "arn:aws:iam::946358504020:role/ecsTaskExecutionRole",
        "containerDefinitions": [
            {
                "name": "auth-service",
                "image": "946358504020.dkr.ecr.us-east-1.amazonaws.com/auth-service:latest",
                "essential": true,
                "portMappings": [
                    {
                        "containerPort": 3000,
                        "hostPort": 3000,
                        "protocol": "tcp"
                    }
                ],
                "environment": [
                    { "name": "DB_HOST", "value": "auth-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com" },
                    { "name": "DB_USER", "value": "tips_ulrich_2025" },
                    { "name": "DB_PASSWORD", "value": "[REDACTED]" },
                    { "name": "DB_NAME", "value": "auth_service_db" },
                    { "name": "DB_PORT", "value": "5432" },
                    { "name": "JWT_SECRET", "value": "[REDACTED]" },
                    { "name": "SMTP_HOST", "value": "smtp.gmail.com" },
                    { "name": "SMTP_PORT", "value": "465" },
                    { "name": "SMTP_SECURE", "value": "true" },
                    { "name": "SMTP_USER", "value": "frranklinlontsi99@gmail.com" },
                    { "name": "SMTP_PASSWORD", "value": "[REDACTED]" },
                    { "name": "SMTP_FROM_EMAIL", "value": "frranklinlontsi99@gmail.com" }
                ],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": "/ecs/auth-service",
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "ecs"
                    }
                }
            }
        ]
    }
    ```

##### 4.4.2 Enregistrement de la Task Definition

*   **Commande :**
    ```bash
    aws ecs register-task-definition --cli-input-json file://auth-task-def.json
    ```

##### 4.4.3 Création du Service ECS

*   **Commande :**
    ```bash
    aws ecs create-service --cluster tips-app-cluster --service-name auth-service --task-definition auth-service-task --desired-count 1 --launch-type FARGATE --network-configuration file://network-config.json
    ```
*   **IP Publique :** `52.90.116.209`

#### 4.5 Déploiement du `tip-service`

##### 4.5.1 Création du fichier `tip-task-def.json`

*   **Contenu :**
    ```json
    {
        "family": "tip-service-task",
        "networkMode": "awsvpc",
        "requiresCompatibilities": [
            "FARGATE"
        ],
        "cpu": "256",
        "memory": "512",
        "executionRoleArn": "arn:aws:iam::946358504020:role/ecsTaskExecutionRole",
        "taskRoleArn": "arn:aws:iam::946358504020:role/ecsTaskExecutionRole",
        "containerDefinitions": [
            {
                "name": "tip-service",
                "image": "946358504020.dkr.ecr.us-east-1.amazonaws.com/tip-service:latest",
                "essential": true,
                "portMappings": [
                    {
                        "containerPort": 4001,
                        "hostPort": 4001,
                        "protocol": "tcp"
                    }
                ],
                "environment": [
                    { "name": "PORT", "value": "4001" },
                    { "name": "DATABASE_URL", "value": "postgres://tips_ulrich_2025:123qweJesus@tip-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com:5432/tip_service_db?ssl=true&rejectUnauthorized=false" },
                    { "name": "NODE_ENV", "value": "production" },
                    { "name": "SMTP_HOST", "value": "smtp.gmail.com" },
                    { "name": "SMTP_PORT", "value": "465" },
                    { "name": "SMTP_SECURE", "value": "true" },
                    { "name": "SMTP_USER", "value": "frranklinlontsi99@gmail.com" },
                    { "name": "SMTP_PASSWORD", "value": "qkolanimwgdvtpok" },
                    { "name": "SMTP_FROM_EMAIL", "value": "frranklinlontsi99@gmail.com" },
                    { "name": "JWT_SECRET", "value": "a-very-secret-and-long-key-for-dev-only-!@#$%" },
                    { "name": "AUTH_SERVICE_ENDPOINT", "value": "http://18.206.193.5:3000" },
                    { "name": "NODE_TLS_REJECT_UNAUTHORIZED", "value": "0" }
                ],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": "/ecs/tip-service",
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "ecs"
                    }
                }
            }
        ]
    }
    ```

##### 4.5.2 Enregistrement de la Task Definition

*   **Commande :**
    ```bash
    aws ecs register-task-definition --cli-input-json file://tip-task-def.json
    ```

##### 4.5.3 Création du Service ECS

*   **Commande :**
    ```bash
    aws ecs create-service --cluster tips-app-cluster --service-name tip-service --task-definition tip-service-task --desired-count 1 --launch-type FARGATE --network-configuration file://network-config.json
    ```
*   **IP Publique :** `3.81.215.233`

#### 4.6 Déploiement du `billing-service`

##### 4.6.1 Création du dépôt ECR

*   **Commande :**
    ```bash
    aws ecr create-repository --repository-name billing-service --image-scanning-configuration scanOnPush=true
    ```

##### 4.6.2 Authentification Docker à ECR

*   **Commande :**
    ```bash
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 946358504020.dkr.ecr.us-east-1.amazonaws.com
    ```

##### 4.6.3 Construction et Push de l'image `billing-service`

*   **Commandes :**
    ```bash
    find . -name '._*' -delete
    docker buildx build --platform linux/amd64 -t billing-service:latest ./billing-service
    docker tag billing-service:latest 946358504020.dkr.ecr.us-east-1.amazonaws.com/billing-service:latest
    docker push 946358504020.dkr.ecr.us-east-1.amazonaws.com/billing-service:latest
    ```

##### 4.6.4 Création du fichier `billing-task-def.json`

*   **Contenu :**
    ```json
    {
        "family": "billing-service-task",
        "networkMode": "awsvpc",
        "requiresCompatibilities": [
            "FARGATE"
        ],
        "cpu": "256",
        "memory": "512",
        "executionRoleArn": "arn:aws:iam::946358504020:role/ecsTaskExecutionRole",
        "taskRoleArn": "arn:aws:iam::946358504020:role/ecsTaskExecutionRole",
        "containerDefinitions": [
            {
                "name": "billing-service",
                "image": "946358504020.dkr.ecr.us-east-1.amazonaws.com/billing-service:latest",
                "essential": true,
                "portMappings": [
                    {
                        "containerPort": 4002,
                        "hostPort": 4002,
                        "protocol": "tcp"
                    }
                ],
                "environment": [
                    { "name": "PORT", "value": "4002" },
                    { "name": "DB_USER", "value": "billing_user" },
                    { "name": "DB_HOST", "value": "billing-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com" },
                    { "name": "DB_NAME", "value": "billing_service_db" },
                    { "name": "DB_PASSWORD", "value": "billing_password" },
                    { "name": "DB_PORT", "value": "5432" },
                    { "name": "NODE_ENV", "value": "production" },
                    { "name": "NODE_TLS_REJECT_UNAUTHORIZED", "value": "0" },
                    { "name": "STRIPE_SECRET_KEY", "value": "sk_test_YOUR_STRIPE_SECRET_KEY" },
                    { "name": "STRIPE_WEBHOOK_SECRET", "value": "whsec_YOUR_STRIPE_WEBHOOK_SECRET" },
                    { "name": "STRIPE_WEBHOOK_SECRET_LIVE", "value": "whsec_YOUR_STRIPE_WEBHOOK_SECRET_LIVE" }
                ],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": "/ecs/billing-service",
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "ecs"
                    }
                }
            }
        ]
    }
    ```

##### 4.6.5 Enregistrement de la Task Definition

*   **Commande :**
    ```bash
    aws ecs register-task-definition --cli-input-json file://billing-task-def.json
    ```

##### 4.6.6 Création du Service ECS

*   **Commande :**
    ```bash
    aws ecs create-service --cluster tips-app-cluster --service-name billing-service --task-definition billing-service-task --desired-count 1 --launch-type FARGATE --network-configuration file://network-config.json
    ```
*   **IP Publique :** `[À DÉTERMINER APRÈS DÉPLOIEMENT]`

---

## Prochaines Étapes

*   Testez les deux services via leurs adresses IP publiques.
*   Considérez la mise en place d'un équilibreur de charge (Load Balancer) pour un accès plus stable et un nom de domaine personnalisé.
*   Implémentez AWS Secrets Manager pour gérer les informations sensibles.
*   Déployez l'application mobile pour qu'elle se connecte à ces services.

### Débogage et Configuration Post-Déploiement

Cette section détaille les étapes de débogage et les ajustements de configuration effectués après le déploiement initial des services.

#### Problèmes Communs et Solutions

##### 1. Erreur `ClusterNotFoundException` lors de la création du service ECS

*   **Problème :** Le cluster ECS n'était pas trouvé, indiquant une échec de création précédente.
*   **Solution :** Recréation du cluster.
*   **Commande :**
    ```bash
    aws ecs create-cluster --cluster-name tips-app-cluster
    ```

##### 2. Erreur `NoSuchEntity` pour le rôle `ecsTaskExecutionRole`

*   **Problème :** Le rôle IAM nécessaire pour qu'ECS exécute les tâches n'existait pas.
*   **Solution :** Création du rôle et attachement de la politique `AmazonECSTaskExecutionRolePolicy`.
*   **Commandes :**
    ```bash
    aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
    aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    ```

##### 3. Erreur `ResourceNotFoundException: The specified log group does not exist`

*   **Problème :** Les tâches Fargate échouaient au démarrage car le groupe de logs CloudWatch spécifié dans la Task Definition n'existait pas.
*   **Solution :** Création des groupes de logs pour chaque service.
*   **Commandes :**
    ```bash
    aws logs create-log-group --log-group-name /ecs/auth-service
    aws logs create-log-group --log-group-name /ecs/tip-service
    ```

##### 4. Erreur `CannotPullContainerError: image Manifest does not contain descriptor matching platform 'linux/amd64'`

*   **Problème :** L'image Docker avait été construite sur une architecture `arm64` (Mac M1/M2) et n'était pas compatible avec l'architecture `amd64` de Fargate.
*   **Solution :** Reconstruire l'image Docker en spécifiant la plateforme `linux/amd64` et la repousser sur ECR.
*   **Commandes (pour `auth-service` et `tip-service`) :**
    ```bash
    find . -name '._*' -delete
    docker buildx build --platform linux/amd64 -t <service-name>:latest ./<service-name>
    docker tag <service-name>:latest 946358504020.dkr.ecr.us-east-1.amazonaws.com/<service-name>:latest
    docker push 946358504020.dkr.ecr.us-east-1.amazonaws.com/<service-name>:latest
    ```

##### 5. Erreur `ETIMEDOUT` lors de la connexion à la base de données RDS

*   **Problème :** Le service ECS ne pouvait pas se connecter à la base de données RDS.
*   **Solution :** Ajouter une règle au groupe de sécurité RDS pour autoriser le trafic provenant du groupe de sécurité des services ECS sur le port 5432.
*   **Commande :**
    ```bash
    aws ec2 authorize-security-group-ingress \
      --group-id sg-0a5815e4c15b59501 \
      --protocol tcp \
      --port 5432 \
      --source-group sg-0b1553f902d01194c
    ```

##### 6. Erreur `relation "users" does not exist` (ou similaire)

*   **Problème :** La base de données RDS était vide et ne contenait pas le schéma de l'application.
*   **Solution :** Exécuter le script `init.sql` pour chaque base de données.
*   **Commandes :**
    ```bash
    # Pour auth-service
    psql -h auth-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com -U tips_ulrich_2025 -d auth_service_db -f auth-service/init.sql
    # Pour tip-service
    psql -h tip-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com -U tips_ulrich_2025 -d tip_service_db -f tip-service/init.sql
    ```

##### 7. Erreur `no pg_hba.conf entry ... no encryption`

*   **Problème :** Le `tip-service` tentait de se connecter à RDS sans SSL, ce qui était refusé.
*   **Solution :** Ajouter l'option `ssl: { rejectUnauthorized: false }` à la configuration du pool de connexion dans `tip-service/models/tipModel.js`, puis reconstruire et repousser l'image.
*   **Modification du fichier `tip-service/models/tipModel.js` :**
    ```javascript
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: {
            rejectUnauthorized: false
        }
    });
    ```
    *   **Commandes de reconstruction/push :** (voir point 4 ci-dessus)

##### 8. Erreur `Network request failed` / `Network request timed out` (Application Mobile)

*   **Problème :** L'application mobile n'arrivait pas à joindre les services backend.
*   **Solutions :**
    *   **Mise à jour des URLs API :** Remplacer les URLs locales par les IPs publiques des services Fargate dans `mobile-app/src/api/auth/authApi.js` et `mobile-app/src/api/tip/tipApi.js`.
        *   `auth-service` IP : `52.90.116.209`
        *   `tip-service` IP : `54.89.128.128` (Note : l'IP du `tip-service` a changé au cours du débogage)
    *   **Configuration HTTP/HTTPS Mobile :** Autoriser le trafic HTTP non sécurisé sur les plateformes mobiles.
        *   **Android (`AndroidManifest.xml`) :** Ajouter `android:usesCleartextTraffic="true"` à la balise `<application>`.
        *   **iOS (`Info.plist`) :** Ajouter la clé `NSAppTransportSecurity` avec `NSAllowsArbitraryLoads` à `true`.
    *   **Rechargement/Reconstruction de l'application mobile :** Effectuer un rechargement complet de l'application pour que les changements de code et de configuration système soient pris en compte.

---

## 9. Ajustements Récents pour la Stabilité et la Fonctionnalité (Novembre 2025)

Cette section récapitule les modifications et configurations effectuées pour résoudre les problèmes de communication entre le frontend (`manager-web-app`) et le backend (`auth-service`), ainsi que pour activer des fonctionnalités clés.

### 9.1. Modifications du `auth-service`

*   **`auth-service/routes/authRoutes.js` :**
    *   Les routes `/forgot-password` et `/reset-password` ont été décommentées et les fonctions `forgotPassword` et `resetPassword` ont été importées depuis `verificationController.js`. Cela active les fonctionnalités de réinitialisation de mot de passe côté backend.
*   **`auth-service/server.js` :**
    *   Le port d'écoute par défaut du service a été ajusté de `3001` à `3000`. Cette modification assure la cohérence avec le mappage de ports `3000:3000` configuré dans la définition de tâche ECS et le groupe cible de l'ALB.
    *   L'origine `https://www.cheftips.app` a été ajoutée à la liste des origines CORS autorisées. Cette modification est cruciale pour permettre à l'application web déployée sur Vercel de communiquer avec le `auth-service` sans rencontrer d'erreurs `Access-Control-Allow-Origin`.

### 9.2. Configuration de l'Infrastructure et du Déploiement

*   **Enregistrement DNS (`api.cheftips.app`) :**
    *   Un enregistrement CNAME pour `api.cheftips.app` a été créé dans les paramètres DNS du domaine, pointant vers le nom DNS de l'Application Load Balancer (`cheftips-alb-1697825470.us-east-1.elb.amazonaws.com`). Cela permet d'accéder au `auth-service` via un nom de domaine personnalisé et sécurisé.
*   **Variables d'Environnement (`manager-web-app`) :**
    *   La variable d'environnement `VITE_AUTH_API_URL` a été configurée :
        *   **Localement :** Dans le fichier `.env` du projet `manager-web-app`.
        *   **Sur Vercel :** Dans les paramètres des variables d'environnement du projet Vercel.
    *   La valeur de cette variable est `https://api.cheftips.app/api/auth`, assurant que le frontend cible correctement le backend via l'ALB.

### 9.3. Processus de Déploiement Post-Modifications

*   **`auth-service` :**
    1.  Reconstruction de l'image Docker du `auth-service` avec les modifications de code.
    2.  Authentification de Docker auprès d'ECR en utilisant `aws ecr get-login-password`.
    3.  Push de la nouvelle image Docker vers le dépôt ECR.
    4.  Mise à jour du service ECS `auth-service` dans la console AWS, en forçant un nouveau déploiement pour que la nouvelle image soit utilisée.
*   **`manager-web-app` :**
    1.  Redéploiement de l'application web sur Vercel après la mise à jour des variables d'environnement et la propagation DNS.

Ces ajustements garantissent une communication fluide et sécurisée entre le frontend et le backend, résolvent les problèmes CORS et activent les fonctionnalités de réinitialisation de mot de passe, améliorant ainsi la stabilité et la fonctionnalité globale du système.

---

## 10. Débogage et Résolution des Problèmes Post-Déploiement (Novembre 2025)

Cette section documente les problèmes rencontrés et les solutions appliquées pour stabiliser le déploiement du `auth-service` et assurer son bon fonctionnement.

### 10.1. Problème d'Erreur CORS Persistante

*   **Problème :** Malgré une configuration CORS initiale, l'application frontend recevait toujours une erreur `Access-Control-Allow-Origin` bloquant les requêtes.
*   **Analyse :** Le service `auth-service` plantait au démarrage, empêchant l'application des règles CORS.
*   **Solution :**
    *   **Mise à jour CORS du `tip-service` :** Ajout de `https://www.cheftips.app` aux origines autorisées dans `tip-service/server.js` pour cohérence.
    *   **Correction du plantage du `auth-service` (TypeError) :**
        *   **Cause :** Les fonctions `forgotPassword` et `resetPassword` étaient importées mais non définies/exportées dans `auth-service/controllers/verificationController.js`.
        *   **Action :** Implémentation et exportation de ces fonctions dans `auth-service/controllers/verificationController.js`.
    *   **Correction du plantage du `auth-service` (PathError) :**
        *   **Cause :** La ligne `app.options('*', cors());` ajoutée dans `auth-service/server.js` provoquait une erreur de syntaxe dans le routeur Express au démarrage.
        *   **Action :** Suppression de la ligne `app.options('*', cors());` de `auth-service/server.js`.

### 10.2. Problème d'Erreur 503 du Load Balancer et Cibles Non Saines

*   **Problème :** L'ALB renvoyait une erreur `503 Service Temporarily Unavailable` et les tâches du `auth-service` restaient "Unhealthy" ou n'étaient pas enregistrées.
*   **Analyse :** Plusieurs problèmes de configuration empêchaient l'ALB de router le trafic vers le service.
*   **Solution :**
    *   **Endpoint de vérification de santé :**
        *   **Cause :** Le service ne disposait pas d'un endpoint de vérification de santé (`/health`) et le chemin de vérification de l'ALB était incorrect.
        *   **Action :** Ajout d'un endpoint `app.get('/health', ...)` à `auth-service/server.js` et mise à jour manuelle du chemin de vérification de santé du groupe cible `cheftips-auth-tg` vers `/health` dans la console AWS.
    *   **Liaison du service ECS au groupe cible :**
        *   **Cause :** Le service ECS `auth-service` n'était pas explicitement lié au groupe cible `cheftips-auth-tg`.
        *   **Action :** Mise à jour du service ECS avec la commande `aws ecs update-service --load-balancers '[...]'` pour lier le service au groupe cible.
    *   **Règle de groupe de sécurité de l'ALB :**
        *   **Cause :** Le groupe de sécurité du `auth-service` bloquait le trafic des vérifications de santé de l'ALB.
        *   **Action :** Ajout d'une règle d'entrée au groupe de sécurité du service (`sg-0b1553f902d01194c`) pour autoriser le trafic TCP sur le port 3000 depuis le groupe de sécurité de l'ALB (`sg-0add26ebea21ae35e`).
    *   **Délai de grâce de la vérification de santé :**
        *   **Cause :** Le `healthCheckGracePeriodSeconds` était à 0, ne laissant pas le temps au service de démarrer avant les vérifications.
        *   **Action :** Mise à jour du service ECS avec `aws ecs update-service --health-check-grace-period-seconds 60`.

### 10.3. Problème d'Erreur 500 du Backend (Connexion DB)

*   **Problème :** Après la résolution des problèmes d'infrastructure, le `auth-service` renvoyait une erreur `500 Internal Server Error` lors des tentatives de connexion.
*   **Analyse :** Deux causes principales ont été identifiées.
*   **Solution :**
    *   **Tables de base de données manquantes :**
        *   **Cause :** Les tables nécessaires (`users`, `companies`, etc.) n'existaient pas dans la base de données RDS.
        *   **Action :** Exécution du script `auth-service/init.sql` sur la base de données `auth_service_db`.
    *   **Connexion `psql` impossible (timeout) :**
        *   **Cause :** L'adresse IP locale de l'utilisateur n'était pas autorisée dans le groupe de sécurité de la base de données RDS.
        *   **Action :** Ajout de l'adresse IP publique actuelle de l'utilisateur au groupe de sécurité RDS (`sg-0a5815e4c15b59501`) sur le port 5432.
    *   **Connexion DB sans SSL (`no encryption`) :**
        *   **Cause :** Le client PostgreSQL du `auth-service` tentait de se connecter sans SSL, ce qui était refusé par RDS.
        *   **Action :** Ajout de l'option `ssl: { rejectUnauthorized: false }` à la configuration du pool de connexions dans `auth-service/models/userModel.js`.

---

**Conclusion :** Après ces multiples étapes de débogage et de correction, le `auth-service` est maintenant stable, accessible via l'ALB, et capable de se connecter à la base de données. Le login renvoie désormais l'erreur `401 INVALID_CREDENTIALS` attendue en l'absence d'utilisateurs enregistrés.

# 11. Mise en place du système de migrations de base de données (Novembre 2025)

Pour améliorer la gestion des changements de schéma de la base de données et automatiser les mises à jour, un système de migrations a été mis en place pour les services **`auth-service`** et **`tip-service`**.

* **Objectif :** Remplacer la gestion manuelle du schéma via `init.sql` par un système de migrations versionnées et automatisées.
* **Outils utilisés :** `node-pg-migrate` pour la gestion des migrations, `dotenv-cli` pour le chargement des variables d'environnement dans les scripts npm.

---

## 11.1. Étapes de configuration (répétées pour `auth-service` et `tip-service`)

1.  **Installation des dépendances :**
    * Ajout de `node-pg-migrate` et `dotenv-cli` aux `devDependencies` de chaque service.
    ```bash
    npm install --save-dev node-pg-migrate dotenv-cli
    ```

2.  **Mise à jour de `package.json` :**
    * Ajout de scripts pour exécuter les migrations. Le script `start` a été modifié pour lancer les migrations avant de démarrer le serveur, assurant que la base de données est toujours à jour.
    ```json
    "scripts": {
      "test": "jest",
      "start": "npm run migrate up && node server.js",
      "migrate": "dotenv -e .env -- node-pg-migrate -m migrations"
    },
    ```

3.  **Création de la migration initiale :**
    * Le contenu des fichiers `init.sql` respectifs a été transféré dans un premier fichier de migration (ex: `..._initial-schema.js`) dans le dossier `migrations` de chaque service.
    * Ce fichier contient une fonction `up` pour créer les tables et une fonction `down` pour les supprimer.

4.  **Mise à jour du `Dockerfile` :**
    * La commande de démarrage a été modifiée pour utiliser le nouveau script `start`, automatisant ainsi l'exécution des migrations à chaque déploiement.
    * **Ancienne commande :** `CMD [ "node", "server.js" ]`
    * **Nouvelle commande :** `CMD [ "npm", "start" ]`

5.  **Synchronisation de la base de données RDS :**
    * Pour permettre au nouveau système de prendre le contrôle, les tables existantes ont été **supprimées manuellement** des bases de données RDS (`auth_service_db` et `tip_service_db`) via `psql`.
    * Les services ont ensuite été redéployés. Au démarrage, le script `npm start` a exécuté la migration initiale, recréant proprement tout le schéma de la base de données.

---

## 11.2. Futur flux de travail pour les changements de base de données

Pour toute modification future du schéma (par exemple, ajouter une colonne) :

1.  **Créer une nouvelle migration :**
    Dans le dossier du service concerné (`auth-service` ou `tip-service`)
    ```bash
    npm run migrate -- create nom_descriptif_de_la_migration
    ```

2.  **Modifier le fichier de migration :** Ajouter les changements SQL dans les fonctions `up` et `down` du nouveau fichier.

3.  **Déployer le service :** Le processus de déploiement normal (`docker build`, `docker push`, `aws ecs update-service`) appliquera **automatiquement** la nouvelle migration à la base de données.tip-service
---

# 12. Débogage des Erreurs de Connexion à la Base de Données (Novembre 2025)

Cette section documente la session de débogage intensive menée pour résoudre les erreurs de connexion entre le `auth-service` et la base de données RDS.

### 12.1. Problème 1 : Erreur de Certificat SSL (`SELF_SIGNED_CERT_IN_CHAIN`)

*   **Symptôme :** Le service échouait au démarrage avec une erreur `Error: self-signed certificate in certificate chain`. L'erreur se produisait spécifiquement lors de l'exécution du script de migration `migrate-db.js`.
*   **Analyse :**
    1.  Le script de migration (`migrate-db.js`) utilisait `node-pg-migrate` mais ne semblait pas respecter le paramètre `rejectUnauthorized=false` présent dans la `DATABASE_URL`.
    2.  Le fichier de configuration principal de la base de données (`db.js`) tentait de charger un fichier de certificat local (`dummy-ca.pem`) qui n'existe pas dans l'environnement conteneurisé.
*   **Solution Appliquée :**
    1.  **Pour le script de migration :** Modification de `auth-service/migrate-db.js` pour injecter la variable d'environnement `NODE_TLS_REJECT_UNAUTHORIZED: '0'` dans le processus `spawn` de la migration. Cela force Node.js à ignorer la validation du certificat pour ce processus spécifique.
    2.  **Pour l'application principale :** Nettoyage du fichier `auth-service/db.js` en supprimant la ligne `ca: fs.readFileSync(...)` pour éviter un crash dû à un fichier manquant.

### 12.2. Problème 2 : Timeout de Connexion Réseau (`ETIMEDOUT`)

*   **Symptôme :** Après la résolution du problème SSL, le service démarrait mais les logs affichaient rapidement une erreur `Error: connect ETIMEDOUT 172.31.xx.xx:5432`, indiquant que le service ne parvenait pas à établir une connexion réseau avec la base de données.
*   **Analyse et Investigation :**
    1.  **Groupes de Sécurité (Security Groups) :** Vérification que le groupe de sécurité de la base de données (`sg-0a5815e4c15b59501`) avait bien une règle d'entrée autorisant le trafic sur le port `5432` depuis le groupe de sécurité du service ECS (`sg-0b1553f902d01194c`). La règle était déjà présente, confirmant que ce n'était pas la cause.
    2.  **Sous-réseaux (Subnets) :** Vérification que le service ECS et l'instance RDS étaient configurés pour utiliser les mêmes sous-réseaux. C'était bien le cas.
    3.  **Listes de Contrôle d'Accès Réseau (NACLs) :** Vérification des NACLs associées aux sous-réseaux. Celles-ci utilisaient les règles par défaut (ALLOW ALL), excluant un blocage à ce niveau.
    4.  **Configuration de la Connexion :** L'hypothèse a été émise que la combinaison d'une `connectionString` dans la variable d'environnement `DATABASE_URL` et d'options de configuration SSL dans le code pouvait être mal interprétée par le client `node-postgres`.

*   **Tentative de Résolution :**
    1.  **Modification du code :** Le fichier `auth-service/db.js` a été modifié pour ne plus utiliser de `connectionString`. À la place, la configuration du `Pool` utilise désormais des variables d'environnement distinctes : `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`.
    2.  **Modification de la Task Definition :** Le fichier `auth-task-def.json` a été mis à jour pour supprimer la variable `DATABASE_URL` et la remplacer par les variables individuelles correspondantes (`DB_HOST`, `DB_USER`, etc.).
    3.  **Redéploiement :** L'image Docker a été reconstruite, la nouvelle définition de tâche a été enregistrée (`:22`), et le service ECS a été mis à jour pour utiliser cette nouvelle configuration.

### 12.3. Problème 3 : `relation "users" does not exist` et `relation "companies" already exists`

*   **Symptôme :** Le service se connecte à la DB, mais les tables n'existent pas, indiquant un échec de migration. Lors d'une tentative de migration manuelle, l'erreur `relation "companies" already exists` est apparue, confirmant que la connectivité DB est OK mais que les migrations sont soit partiellement appliquées, soit mal gérées.
*   **Analyse :** La base de données était dans un état incohérent, probablement dû à des tentatives de migration précédentes ou à l'exécution partielle de `init.sql`.
*   **Solution :** Suppression et recréation de la base de données `auth_service_db` pour garantir un état propre, puis exécution manuelle des migrations avec succès.

### 12.4. Problème 4 : `CannotPullContainerError: pull image manifest does not contain descriptor matching platform 'linux/amd64'`

*   **Symptôme :** L'image Docker avait été construite pour la mauvaise architecture (probablement `arm64` sur un Mac M1/M2) et Fargate ne pouvait pas la tirer.
*   **Analyse :** L'image Docker n'était pas compatible avec l'architecture `linux/amd64` requise par AWS Fargate.
*   **Solution :** Reconstruite l'image Docker avec `--platform linux/amd64` et ajout de `node_modules` au `.dockerignore` pour forcer `npm install` à l'intérieur du conteneur Docker pendant la construction de l'image pour la bonne architecture.

### 12.5. Problème 5 : `Error: DATABASE_URL environment variable is not set.` dans les logs ECS

*   **Symptôme :** Le service plantait au démarrage avec cette erreur, indiquant que la variable d'environnement `DATABASE_URL` n'était pas correctement passée au conteneur.
*   **Analyse :** La variable `DATABASE_URL` n'était pas présente dans la définition de tâche ECS.
*   **Solution :** La variable `DATABASE_URL` a été ajoutée à la définition de tâche `auth-task-def.json`.

### 12.6. Problème 6 : `Error loading shared library ... bcrypt_lib.node: Exec format error`

*   **Symptôme :** Le service plantait au démarrage avec cette erreur, indiquant que les dépendances natives `bcrypt` étaient construites pour la mauvaise architecture.
*   **Analyse :** Les `node_modules` locaux (potentiellement compilés pour `arm64`) étaient copiés dans l'image Docker, causant une incompatibilité.
*   **Solution :** Ajout de `node_modules` au `.dockerignore` pour forcer `npm install` à l'intérieur du conteneur Docker pendant la construction de l'image pour la bonne architecture.

### 12.7. Problème 7 : `Fargate requires that the task definition has a task role ARN specified.`

*   **Symptôme :** Le service ne pouvait pas être déployé avec l'erreur "Fargate requires that the task definition has a task role ARN specified."
*   **Analyse :** La définition de tâche manquait de la propriété `taskRoleArn`.

# 13. Débogage et Résolution des Problèmes du tip-service (Novembre 2025)

Cette section documente les problèmes rencontrés et les solutions appliquées pour stabiliser le déploiement du `tip-service` et assurer son bon fonctionnement.

### 13.1. Problème 1 : Erreur `getaddrinfo ENOTFOUND tip_postgres`

*   **Symptôme :** Le `tip-service` échouait au démarrage avec l'erreur `Error: getaddrinfo ENOTFOUND tip_postgres`. Cela indiquait que le service tentait de se connecter à un hôte `tip_postgres` qui ne pouvait pas être résolu.
*   **Analyse :** Le script `migrate` dans `tip-service/package.json` n'était pas configuré pour charger les variables d'environnement à partir du fichier `.env` avant d'exécuter `node-pg-migrate`. Par conséquent, la variable `DATABASE_URL` n'était pas définie, et `node-pg-migrate` tentait de se connecter à un hôte par défaut.
*   **Solution :** Modification du script `migrate` dans `tip-service/package.json` pour inclure `dotenv -e .env --`.
    *   **Modification du fichier `tip-service/package.json` :**
        ```json
        "scripts": {
          "test": "jest",
          "start": "npm run migrate && node server.js",
          "migrate": "dotenv -e .env -- node-pg-migrate -m migrations up"
        },
        ```

### 13.2. Problème 2 : Erreur de Certificat SSL (`SELF_SIGNED_CERT_IN_CHAIN`)

*   **Symptôme :** Après la résolution du problème `ENOTFOUND`, le service échouait avec l'erreur `Error: self-signed certificate in certificate chain`, similaire à celle rencontrée par le `auth-service`.
*   **Analyse :**
    1.  Bien que `&ssl=true&rejectUnauthorized=false` ait été ajouté à la `DATABASE_URL` dans `tip-task-def.json`, le client `node-pg` ou `node-pg-migrate` ne semblait pas toujours respecter ce paramètre lorsqu'il était intégré à la chaîne de connexion.
    2.  L'environnement d'exécution du conteneur ne désactivait pas globalement la vérification des certificats auto-signés pour les connexions TLS.
*   **Solutions Appliquées :**
    1.  **Ajout de `NODE_TLS_REJECT_UNAUTHORIZED='0'` au script `start` :** Modification du script `start` dans `tip-service/package.json` pour définir cette variable d'environnement spécifiquement pour la commande `npm run migrate`.
        *   **Modification du fichier `tip-service/package.json` :**
            ```json
            "scripts": {
              "test": "jest",
              "start": "NODE_TLS_REJECT_UNAUTHORIZED='0' npm run migrate && node server.js",
              "migrate": "dotenv -e .env -- node-pg-migrate -m migrations up"
            },
            ```
    2.  **Ajout de `NODE_TLS_REJECT_UNAUTHORIZED='0'` à la Task Definition :** Pour une application plus globale au sein du conteneur, la variable d'environnement a été ajoutée directement à la définition de tâche `tip-task-def.json`.
        *   **Modification du fichier `tip-task-def.json` :**
            ```json
            {
                "name": "tip-service",
                "image": "946358504020.dkr.ecr.us-east-1.amazonaws.com/tip-service:latest",
                "essential": true,
                "portMappings": [
                    {
                        "containerPort": 4001,
                        "hostPort": 4001,
                        "protocol": "tcp"
                    }
                ],
                "environment": [
                    { "name": "PORT", "value": "4001" },
                    { "name": "DATABASE_URL", "value": "postgres://tips_ulrich_2025:123qweJesus@tip-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com:5432/tip_service_db?ssl=true&rejectUnauthorized=false" },
                    { "name": "NODE_ENV", "value": "production" },
                    { "name": "SMTP_HOST", "value": "smtp.gmail.com" },
                    { "name": "SMTP_PORT", "value": "465" },
                    { "name": "SMTP_SECURE", "value": "true" },
                    { "name": "SMTP_USER", "value": "frranklinlontsi99@gmail.com" },
                    { "name": "SMTP_PASSWORD", "value": "qkolanimwgdvtpok" },
                    { "name": "SMTP_FROM_EMAIL", "value": "frranklinlontsi99@gmail.com" },
                    { "name": "JWT_SECRET", "value": "a-very-secret-and-long-key-for-dev-only-!@#$%" },
                    { "name": "AUTH_SERVICE_ENDPOINT", "value": "http://18.206.193.5:3000" },
                    { "name": "NODE_TLS_REJECT_UNAUTHORIZED", "value": "0" }
                ],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": "/ecs/tip-service",
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "ecs"
                    }
                }
            }
        ]
    }
            ```

### 13.3. Problème 3 : `Fargate requires that the task definition has a task role ARN specified.`

*   **Symptôme :** Le service ne pouvait pas être déployé avec l'erreur "Fargate requires that the task definition has a task role ARN specified."
*   **Analyse :** La définition de tâche manquait de la propriété `taskRoleArn`.
*   **Solution :** Ajout de `"taskRoleArn": "arn:aws:iam::946358504020:role/ecsTaskExecutionRole"` à la définition de tâche `tip-task-def.json`.

### 13.4. Recréation de la Base de Données et du Service

*   **Contexte :** Pour garantir un état propre et s'assurer que toutes les modifications de configuration étaient appliquées, la base de données RDS `tip-db-instance` et le service ECS `tip-service` ont été supprimés puis recréés.
*   **Étapes :**
    1.  **Arrêt et suppression du service ECS `tip-service` :**
        ```bash
        aws ecs update-service --cluster tips-app-cluster --service tip-service --desired-count 0
        aws ecs delete-service --cluster tips-app-cluster --service tip-service
        ```
    2.  **Suppression de l'instance RDS `tip-db-instance` :**
        ```bash
        aws rds delete-db-instance --db-instance-identifier tip-db-instance --skip-final-snapshot
        ```
    3.  **Attente de la suppression complète de l'instance RDS.**
    4.  **Recréation de l'instance RDS `tip-db-instance` :**
        ```bash
        aws rds create-db-instance \
          --db-instance-identifier tip-db-instance \
          --db-instance-class db.t3.micro \
          --engine postgres \
          --master-username tips_ulrich_2025 \
          --master-user-password 123qweJesus \
          --allocated-storage 20 \
          --db-name tip_service_db \
          --vpc-security-group-ids sg-0a5815e4c15b59501 \
          --db-subnet-group-name default \
          --publicly-accessible
        ```
    5.  **Attente de la disponibilité de l'instance RDS.**
    6.  **Reconstruction et push de l'image Docker du `tip-service`** (avec les dernières modifications de `package.json`).
    7.  **Enregistrement de la nouvelle définition de tâche `tip-service-task`** (avec `taskRoleArn` et `NODE_TLS_REJECT_UNAUTHORIZED`).
    8.  **Recréation du service ECS `tip-service` :**
        ```bash
        aws ecs create-service --cluster tips-app-cluster --service-name tip-service --task-definition tip-service-task:21 --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-09650ce60ec6aee63,subnet-0abe034e0cce968dc,subnet-0ded40f7696adc1f6,subnet-076f8b80777e29daa,subnet-0e6852c975bc9695b,subnet-0ee340078ad1e8fe4],securityGroups=[sg-0b1553f902d01194c],assignPublicIp=ENABLED}"
        ```

---

**Conclusion :** Après ces étapes, le `tip-service` démarre correctement, les migrations s'exécutent sans erreur de certificat SSL, et le service est opérationnel.

