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
*   **Mot de passe RDS :** `123qweJesus` (⚠️ **ATTENTION :** Pour la production, utilisez AWS Secrets Manager !)
*   **Adresse IP Publique Locale :** `24.203.93.101` (utilisée pour la configuration initiale du pare-feu RDS)
*   **Email SMTP :** `frranklinlontsi99@gmail.com`
*   **Mot de passe SMTP :** `qkolanimwgdvtpok` (⚠️ **ATTENTION :** Pour la production, utilisez AWS Secrets Manager !)
*   **JWT Secret :** `a-very-secret-and-long-key-for-dev-only-!@#$%` (⚠️ **ATTENTION :** Pour la production, utilisez AWS Secrets Manager !)

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
      --master-user-password 123qweJesus \
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
      --master-user-password 123qweJesus \
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
    SMTP_PASSWORD=qkolanimwgdvtpok
    SMTP_FROM_EMAIL=frranklinlontsi99@gmail.com

    # PostgreSQL Configuration for AWS RDS
    DB_USER=tips_ulrich_2025
    DB_HOST=auth-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com
    DB_NAME=auth_service_db
    DB_PASSWORD=123qweJesus
    DB_PORT=5432

    # JWT Secret
    JWT_SECRET="a-very-secret-and-long-key-for-dev-only-!@#$%"
    ```

##### `tip-service/.env`
*   **Contenu mis à jour :**
    ```
    PORT=4001

    # PostgreSQL Configuration for AWS RDS
    DB_USER=tips_ulrich_2025
    DB_HOST=tip-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com
    DB_NAME=tip_service_db
    DB_PASSWORD=123qweJesus
    DB_PORT=5432

    # SMTP Configuration
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=465
    SMTP_SECURE=true
    SMTP_USER=frranklinlontsi99@gmail.com
    SMTP_PASSWORD=qkolanimwgdvtpok
    SMTP_FROM_EMAIL=frranklinlontsi99@gmail.com

    JWT_SECRET=a-very-secret-and-long-key-for-dev-only-!@#$%
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
                    { "name": "DB_PASSWORD", "value": "123qweJesus" },
                    { "name": "DB_NAME", "value": "auth_service_db" },
                    { "name": "DB_PORT", "value": "5432" },
                    { "name": "JWT_SECRET", "value": "a-very-secret-and-long-key-for-dev-only-!@#$%" },
                    { "name": "SMTP_HOST", "value": "smtp.gmail.com" },
                    { "name": "SMTP_PORT", "value": "465" },
                    { "name": "SMTP_SECURE", "value": "true" },
                    { "name": "SMTP_USER", "value": "frranklinlontsi99@gmail.com" },
                    { "name": "SMTP_PASSWORD", "value": "qkolanimwgdvtpok" },
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
                    { "name": "DB_USER", "value": "tips_ulrich_2025" },
                    { "name": "DB_HOST", "value": "tip-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com" },
                    { "name": "DB_NAME", "value": "tip_service_db" },
                    { "name": "DB_PASSWORD", "value": "123qweJesus" },
                    { "name": "DB_PORT", "value": "5432" },
                    { "name": "SMTP_HOST", "value": "smtp.gmail.com" },
                    { "name": "SMTP_PORT", "value": "465" },
                    { "name": "SMTP_SECURE", "value": "true" },
                    { "name": "SMTP_USER", "value": "frranklinlontsi99@gmail.com" },
                    { "name": "SMTP_PASSWORD", "value": "qkolanimwgdvtpok" },
                    { "name": "SMTP_FROM_EMAIL", "value": "frranklinlontsi99@gmail.com" },
                    { "name": "JWT_SECRET", "value": "a-very-secret-and-long-key-for-dev-only-!@#$%" }
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