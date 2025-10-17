# Synthèse du Projet : Système de Gestion de Pourboires

Ce document fournit une vue d'ensemble du Système de Gestion de Pourboires, décrivant son architecture fonctionnelle, sa stack technologique et sa feuille de route.

## 1. Architecture Générale

Le système est basé sur une **architecture de microservices** pour la scalabilité et la séparation des responsabilités :
-   **Service d'Authentification (`auth-service`)**: Backend Node.js/Express gérant les utilisateurs, les entreprises, et les appartenances. Il est désormais la source unique de vérité pour les informations sur les employés.
-   **Service de Pourboires (`tip-service`)**: Backend Node.js/Express gérant toute la logique métier des pourboires (rapports, calculs, pools, etc.). Il communique avec l'`auth-service` pour obtenir les listes d'employés.
-   **Application Web Manager (`manager-web-app`)**: SPA React (Vite) pour l'administration par les managers.
-   **Application Mobile (`mobile-app`)**: Application React Native (Expo) pour les employés.

## 2. Stack Technologique

-   **Backend**: Node.js, Express.js
-   **Frontend (Web)**: React, Vite, Material-UI (MUI)
-   **Frontend (Mobile)**: React Native, Expo
-   **Bases de données**: PostgreSQL
-   **Conteneurisation**: Docker, Docker Compose

## 3. Architecture Fonctionnelle Clé (Nouvelle Vision)

Le système est conçu pour être extrêmement flexible, en se basant sur trois concepts fondamentaux : les Départements, les Catégories et les Règles de Tip-Out.

-   **Départements**: Il existe deux départements fonctionnels qui dictent les permissions des employés.
    -   **Avant du Restaurant (Collecteurs)**: Regroupe les employés qui saisissent un rapport de pourboires.
    -   **Arrière du Restaurant (Receveurs)**: Regroupe les employés qui reçoivent une part des pourboires automatiquement, sans rien saisir.

-   **Catégories (Postes)**: Ce sont les postes spécifiques créés par le manager (ex: `Serveur`, `Barman`, `Cuisinier`, `Commis`). Le manager assigne chaque catégorie à l'un des deux départements. Cette architecture permet une grande flexibilité : un `Barman` peut être configuré comme `Collecteur` dans un restaurant et comme `Receveur` dans un autre.

-   **Polyvalence des Postes**: Le système reconnaît que les employés, surtout ceux de l'Avant du Restaurant, peuvent occuper différents postes d'un jour à l'autre. Un employé n'a pas de catégorie fixe, mais choisit son poste au début de chaque saisie de rapport.

-   **Règles de Tip-Out Améliorées**: Les règles de tip-out peuvent désormais spécifier un `distribution_type`:
    -   `DEPARTMENT_POOL`: Le montant du tip-out est alloué au département de destination (ex: Cuisine) et géré via les pools de paie.
    -   `INDIVIDUAL_SELECTION`: Le collecteur sélectionne des employés individuels qui recevront une part du tip-out pour cette règle (ex: Bar, Commis, Gérant). Le montant est réparti équitablement entre les employés sélectionnés.

## 4. Flux des Utilisateurs

### A. Le Manager
1.  **Configuration Initiale**:
    -   Invite les employés.
    -   Crée les **Catégories** (postes) de son restaurant.
    -   Classe chaque Catégorie dans un **Département** (`Avant` ou `Arrière`).
    -   Pour les postes très polyvalents (ex: `Barman`), il peut activer une option "double-rôle" qui forcera l'employé à préciser son mode de travail (Collecteur ou Receveur) à chaque service.
2.  **Définition des Règles de Tip-Out**:
    -   Le manager crée des règles de répartition automatiques.
    -   Ces règles peuvent être basées sur un pourcentage des **ventes totales** ou des **pourboires bruts**.
    -   Il définit également le **type de distribution** pour chaque règle (`DEPARTMENT_POOL` ou `INDIVIDUAL_SELECTION`).
3.  **Gestion de la Paie (Pools)**:
    -   Pour une période de paie donnée (ex: une semaine), le manager crée un **"Pool de paie"** pour un département ou une catégorie (ex: Pool des Cuisiniers).
    -   Le système calcule automatiquement le **montant total des tip-outs** qui ont été alloués à cette catégorie pendant la période.
    -   Ce montant total est ensuite distribué aux employés concernés.

### B. L'Employé "Avant du Restaurant" (Collecteur)
1.  **Saisie du Rapport Journalier**:
    -   À la fin de son service, l'employé ouvre l'application mobile (ou l'application web manager si configuré pour la saisie).
    -   **Choix du Poste**: L'application demande quel poste (`Catégorie`) il a occupé.
    -   **Cas du "Double-Rôle"**: S'il choisit un poste comme `Barman`, l'application demande s'il a travaillé comme `Collecteur` ou `Receveur`. S'il était `Receveur`, son action s'arrête ici.
    -   **Données de Vente et Caisse**: Le formulaire permet de saisir :
        -   `Ventes Nourriture`
        -   `Ventes Alcool`
        -   `Pourboires Bruts`
        -   `Différence de Caisse` (Comptant : positif si dû au restaurant, négatif si le restaurant doit à l'employé).
    -   **Sélection des Destinataires Individuels**: Pour les règles de tip-out de type `INDIVIDUAL_SELECTION` (ex: Bar, Commis, Gérant), l'employé sélectionne les collègues concernés qui ont travaillé dans ces rôles.
2.  **Calcul Automatique**: Le système calcule automatiquement le `Total des Ventes` (`Ventes Nourriture` + `Ventes Alcool`), applique les règles de tip-out, calcule les `Pourboires Nets` et détermine le `Solde Final` (`Pourboires Nets` + `Différence de Caisse`).
3.  **Tableau de Bord Personnel**:
    -   L'employé peut consulter un historique de tous ses services.
    -   Pour chaque jour, il voit le poste occupé, le statut (Collecteur/Receveur), le détail du rapport soumis ou le montant des pourboires reçus.

### C. L'Employé "Arrière du Restaurant" (Receveur)
1.  **Aucune Action Requise**: Cet employé ne saisit aucune information.
2.  **Consultation des Gains**: Il dispose d'un tableau de bord simple pour consulter l'historique des montants de tip-out qu'il a reçus pour chaque période de paie.

### D. Connexion et Redirection des Employés (Application Web)

La logique de redirection après la connexion d'un employé sur l'application web est conçue pour s'adapter à la polyvalence des postes, en particulier pour les collecteurs.

1.  **Identification de l'Employé au Login**:
    -   Lorsqu'un employé se connecte, le système examine le token d'authentification (JWT).
    -   La distinction entre un "collecteur" (devant choisir sa fonction) et un employé à poste fixe (comme un "receveur") se base sur la présence ou l'absence d'un `category_id` dans ce token.

2.  **Flux du Collecteur (sans catégorie prédéfinie)**:
    -   Si un employé se connecte et que son token **ne contient pas** de `category_id`, il est identifié comme un collecteur devant spécifier sa fonction pour la journée.
    -   Il est automatiquement redirigé vers une page de **sélection de catégorie**.
    -   Après avoir choisi sa catégorie pour le service, il est ensuite dirigé vers le tableau de bord des collecteurs.

3.  **Flux de l'Employé à Poste Fixe (ex: Receveur)**:
    -   Si un employé se connecte et que son token **contient** un `category_id`, il est considéré comme ayant un poste fixe.
    -   Il est directement redirigé vers le tableau de bord standard des employés, où il peut consulter les informations relatives à son poste (ex: les pourboires qu'il a reçus).

## 5. Feuille de Route Future (Exemples)

-   **v1.2: Résumé Quotidien pour le Manager**: Envoi d'un e-mail récapitulatif de l'activité de la journée.
-   **v1.3: Intégration d'Agendrix**: Synchronisation des horaires pour automatiser la sélection des employés dans les pools de paie.
-   **Futur: Traitement des Paiements**: Intégration d'un système de paiement pour distribuer financièrement les pourboires.