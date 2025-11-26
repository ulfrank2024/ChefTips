# Détails de Connexion aux Bases de Données AWS RDS (pour pgAdmin)

Ce document récapitule les informations nécessaires pour vous connecter à vos bases de données PostgreSQL sur AWS RDS en utilisant pgAdmin ou tout autre client SQL.

## Étape 1 : Autoriser votre adresse IP dans le Groupe de Sécurité AWS

Avant de pouvoir vous connecter, vous devez vous assurer que votre adresse IP publique est autorisée par le groupe de sécurité (pare-feu) de vos instances RDS. Si votre IP change, vous devrez répéter cette étape.

1.  **Trouvez votre adresse IP publique actuelle** (par exemple, en cherchant "what is my IP" sur Google).
2.  **Exécutez la commande AWS CLI suivante** dans votre terminal, en remplaçant `VOTRE_IP_PUBLIQUE_ACTUELLE` par l'adresse IP que vous avez trouvée :

    ```bash
    VOTRE_IP=$(curl -s https://ifconfig.me/ip) && aws ec2 authorize-security-group-ingress --group-id sg-0a5815e4c15b59501 --protocol tcp --port 5432 --cidr $VOTRE_IP/32
    ```

    Cette commande ajoute une règle pour autoriser les connexions depuis votre IP actuelle sur le port `5432`.

## Étape 2 : Informations de connexion pour pgAdmin

Voici les détails pour chaque base de données. Vous devrez créer une nouvelle connexion ("Register a new server") dans pgAdmin pour chacune.

**Détails Communs à toutes les bases de données :**

*   **Port :** `5432`
*   **Username (utilisateur maître) :** `tips_ulrich_2025`
*   **Password :** Utilisez le mot de passe que vous avez défini lors de la création de vos instances RDS.
*   **Onglet SSL (dans pgAdmin) :** Réglez le **SSL mode** sur `Allow` ou `Prefer`.

---

### 1. Base de Données d'Authentification (`auth_service_db`)

*   **Nom dans pgAdmin :** `auth-service-db (AWS)`
*   **Host name/address :** `auth-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com`
*   **Maintenance database :** `auth_service_db`

---

### 2. Base de Données des Pourboires (`tip_service_db`)

*   **Nom dans pgAdmin :** `tip-service-db (AWS)`
*   **Host name/address :** `tip-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com`
*   **Maintenance database :** `tip_service_db`

---

### 3. Base de Données de Facturation (`billing_service_db`)

*   **Nom dans pgAdmin :** `billing-service-db (AWS)`
*   **Host name/address :** `billing-db-instance.cgt80m8q6ayi.us-east-1.rds.amazonaws.com`
*   **Maintenance database :** `billing_service_db`

---

Une fois ces informations configurées dans pgAdmin, vous devriez pouvoir vous connecter et gérer vos données.
