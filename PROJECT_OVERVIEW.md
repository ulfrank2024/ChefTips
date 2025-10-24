# Synthèse du Projet : Système de Gestion de Pourboires

Ce document fournit une vue d'ensemble du Système de Gestion de Pourboires, décrivant son architecture fonctionnelle, sa stack technologique et sa feuille de route.

---

## 1. Architecture Générale

Le système est basé sur une **architecture de microservices** pour la scalabilité et la séparation des responsabilités :

* **Service d'Authentification (`auth-service`)**: Backend Node.js/Express gérant les utilisateurs, les entreprises, et les appartenances. C'est la source unique de vérité pour les informations sur les employés.
* **Service de Pourboires (`tip-service`)**: Backend Node.js/Express gérant toute la logique métier des pourboires (rapports, calculs, pools, etc.). Il communique avec l'`auth-service` pour obtenir les listes d'employés.
* **Application Web Manager (`manager-web-app`)**: SPA React (Vite) pour l'administration par les managers.
* **Application Mobile (`mobile-app`)**: Application React Native (Expo) pour les employés.

## 2. Stack Technologique

* **Backend**: Node.js, Express.js
* **Frontend (Web)**: React, Vite, Material-UI (MUI)
* **Frontend (Mobile)**: React Native, Expo
* **Bases de données**: PostgreSQL
* **Conteneurisation**: Docker, Docker Compose

## 3. Architecture Fonctionnelle Clé (Nouvelle Vision)

Le système est conçu pour être simple et efficace, en se basant sur des rôles prédéfinis et une permission d'encaissement.

### Rôles Prédéfinis

Le système utilise un ensemble fixe de rôles :
* `CUISINIER`
* `SERVEUR`
* `COMMIS`
* `GERANT`
* `BARMAN`
* `HOTE`

### Permission d'Encaissement (`can_cash_out`)

Chaque employé peut se voir attribuer ou non la permission d'encaisser ses pourboires. Cette permission est gérée par le manager et détermine si l'employé peut soumettre un rapport de pourboires journalier.

### Règles de Tip-Out Améliorées

Les règles de tip-out peuvent désormais spécifier un `distribution_type`:

* `DEPARTMENT_POOL`: Le montant du tip-out est alloué à un rôle de destination (ex: `CUISINIER`) et géré via les pools de paie.
* `INDIVIDUAL_SELECTION`: Le collecteur sélectionne des employés individuels qui recevront une part du tip-out pour cette règle. Le montant est réparti équitablement entre les employés sélectionnés.

## 4. Flux des Utilisateurs

### A. Le Manager

1.  **Configuration Initiale**:
    * Invite les employés.
    * Assigne un **Rôle** prédéfini et la permission **`can_cash_out`** à l'employé.
2.  **Définition des Règles de Tip-Out**:
    * Crée des règles de répartition automatiques (basées sur un pourcentage des **ventes totales** ou des **pourboires bruts**).
    * Définit le **type de distribution** (`DEPARTMENT_POOL` ou `INDIVIDUAL_SELECTION`) et spécifie les rôles source et destination.
3.  **Gestion de la Paie (Pools)**:
    * Crée un **"Pool de paie"** pour un rôle et une période donnés.
    * Le système calcule le **montant total des tip-outs** alloués, qui est ensuite distribué.

### B. L'Employé (Collecteur - avec `can_cash_out`)

1.  **Saisie du Rapport Journalier**:
    * Saisit : `Ventes Nourriture`, `Ventes Alcool`, `Pourboires Bruts`, `Différence de Caisse`.
    * Sélectionne les collègues pour les règles de tip-out de type `INDIVIDUAL_SELECTION`.
2.  **Calcul Automatique**: Le système calcule `Total des Ventes`, applique les règles de tip-out, calcule les `Pourboires Nets` et détermine le `Solde Final` (`Pourboires Nets` + `Différence de Caisse`).
3.  **Tableau de Bord Personnel**: L'employé consulte l'historique de ses services.

#### Procédure de Clôture du Serveur (Calcul du "Due Back")

Cette procédure vise à calculer automatiquement le montant exact que le serveur doit remettre ou recevoir de la caisse à la fin de son service.

**Phase 1 : Saisie de Fin de Service par le Serveur**

* Ventes Totales Nourriture : Montant du reçu.
* Ventes Totales Alcool : Montant du reçu.
* Comptant (Solde de Caisse) : Montant de la caisse à ajuster.
* Sélection des destinataires pour les règles de type `INDIVIDUAL_SELECTION`.

**Phase 2 : Les Calculs Automatiques par Shef Tips**

1.  Définition de la Base de Tip-Out
    $$\text{Base du Tip-Out} = \text{Ventes Nourriture} + \text{Ventes Alcool}$$

2.  Calcul du Tip-Out Total (Dépense du Serveur)
    Le système applique les pourcentages définis (ex: Cuisine 1%, Bar 2%, Commis & Hôte(sse) 1%, Gérant 0.5%).
    $$\text{Tip-Out Total} = \sum (\text{Tips Cuisine, Bar, Commis/Hôte, Gérant})$$

3.  Calcul du "Due Back" (Solde Final)
    $$\mathbf{\text{Due Back} = \text{Tip-Out Total} + \text{Comptant (Solde de Caisse)}}$$

**Phase 3 : Interprétation du Solde Final**

| Résultat du Due Back | Signification | Action |
| :------------------------ | :--------------------------------------------- | :------------------------------------------------------------------ |
| Montant Positif (ex. $150,00$) | Le serveur doit cette somme au restaurant. | Le Serveur doit remettre ce montant à la caisse ou au manager. |
| Montant Négatif (ex. $-25,00$) | Le restaurant doit cette somme au serveur. | La Caisse doit rembourser ce montant au Serveur. |

### C. L'Employé (Bénéficiaire - sans `can_cash_out`)

1.  **Aucune Action Requise**.
2.  **Consultation des Gains**: Dispose d'un tableau de bord pour consulter l'historique des montants de tip-out qu'il a reçus.

### D. Connexion et Redirection des Employés (Application Web)

La redirection est basée sur la permission `can_cash_out` dans le token d'authentification (JWT).

* **Avec `can_cash_out: true` (Collecteur)**: Redirection vers le tableau de bord des collecteurs (déclaration des pourboires).
* **Avec `can_cash_out: false` (Bénéficiaire)**: Redirection vers le tableau de bord des bénéficiaires (consultation des gains).

## 5. Feuille de Route Future (Exemples)

* **v1.2: Résumé Quotidien pour le Manager**: Envoi d'un e-mail récapitulatif de l'activité de la journée.
* **v1.3: Intégration d'Agendrix**: Synchronisation des horaires pour automatiser la sélection des employés dans les pools de paie.
* **Futur: Traitement des Paiements**: Intégration d'un système de paiement pour distribuer financièrement les pourboires.

---

## Logique Métier Détaillée et Flux de Vérification

### 1. Gestion des Rôles et des Accès

La logique de la vue (Collecteur vs. Bénéficiaire) est conditionnée par la permission `can_cash_out`.

| Rôle de l'Employé | Permission `can_cash_out` | Logique de la Vue |
| :---------------- | :------------------------ | :---------------- |
| `CUISINIER` | `false` | Vue "**Bénéficiaire**" par défaut : accès direct au tableau de bord des gains. |
| `SERVEUR` | `true` | Vue "**Collecteur**" par défaut : accès direct au formulaire de déclaration de pourboires. |
| `COMMIS` | `false` | Vue "**Bénéficiaire**" par défaut. |
| `GERANT` | `false` | Vue "**Bénéficiaire**" par défaut. |
| `BARMAN` | `true` ou `false` | Vue "**Collecteur**" ou "**Bénéficiaire**" selon la permission. |
| `HOTE` | `false` | Vue "**Bénéficiaire**" par défaut. |

### 2. Le Dashboard Unique (Employé)

L'affichage est conditionné par la permission `can_cash_out`.

* **Scénario A : Employé avec `can_cash_out = true` (Collecteur)**
    * Bouton "Déclarer Pourboires" : Visible.
    * Affichage Principal : Vue "Collecteur" (Accès au formulaire de déclaration de pourboires et à l'historique de ses rapports).
* **Scénario B : Employé avec `can_cash_out = false` (Bénéficiaire)**
    * Bouton "Déclarer Pourboires" : Masqué.
    * Affichage Principal : Vue "Bénéficiaire" (Affiche le total des Tip-Outs reçus).

### 3. Le Flux de Clôture et de Vérification Financière

**A. Calcul Final (Due Back)**

$$\mathbf{\text{Due Back} = \text{Tip-Out Total} + \text{Comptant}}$$

* Si $\text{Due Back}$ est positif : "Le Serveur doit remettre cette somme au restaurant."
* Si $\text{Due Back}$ est négatif : "Le Restaurant doit rembourser cette somme au Serveur."

**B. Vérification du Manager (Approbation)**

| Scénario du Due Back | Action du Manager | Statut dans le Système |
| :------------------- | :---------------- | :--------------------- |
| Serveur doit le restaurant ($\text{Due Back} > 0$) | Le Manager vérifie l'enveloppe et coche "**Bien Reçu**" dans l'application. | Le système marque la transaction comme "**Financement Approuvé**". |
| Restaurant doit le serveur ($\text{Due Back} < 0$) | Le Manager rembourse le Serveur, puis clique sur "**Remboursement Fait**". | Le système marque l'opération comme **réglée** et met à jour le solde de trésorerie. |