# Déploiement de l'Application Android (APK)

Ce document récapitule les étapes pour générer un fichier APK installable à partir de l'application mobile Expo, après son build sur EAS.

## Prérequis

*   Node.js et npm installés.
*   `eas-cli` installé globalement (`npm install -g eas-cli`).
*   Java Development Kit (JDK) installé (via Homebrew : `brew install openjdk`).
*   Android SDK Build-Tools installés (via Android Studio).
*   `bundletool.jar` téléchargé.

## Étapes de Génération de l'APK

### Étape 1 : Build de l'Application sur EAS (Android App Bundle - AAB)

*   **Objectif :** Générer le fichier `.aab` (Android App Bundle) via le service de build cloud d'Expo.
*   **Commandes :**
    1.  **Installation de `eas-cli` (si nécessaire) :**
        ```bash
        npm install -g eas-cli
        ```
    2.  **Configuration de `npm` pour les paquets globaux (si erreur `EACCES`) :**
        ```bash
        mkdir ~/.npm-global
        npm config set prefix '~/.npm-global'
        # Ajouter à ~/.zshrc : export PATH=~/.npm-global/bin:$PATH
        # Puis : source ~/.zshrc
        ```
    3.  **Connexion à EAS :**
        ```bash
        eas login
        ```
    4.  **Lancement du build Android :**
        ```bash
        eas build -p android --profile production
        ```
        *   Confirmer la création du projet EAS (`Y`).
        *   Confirmer l'ID de l'application Android (ex: `com.ulrich_app.mobileapp`).
        *   Confirmer la génération d'un nouveau Keystore Android (`Y`).
*   **Résultat :** Un lien vers le fichier `.aab` (ex: `https://expo.dev/artifacts/eas/... .aab`). Téléchargez ce fichier.

### Étape 2 : Conversion de l'AAB en APK (avec `bundletool`)

*   **Objectif :** Extraire un fichier `.apk` installable à partir du fichier `.aab`.

#### 2.1 Préparation de l'environnement

1.  **Installation de Java (OpenJDK) :**
    ```bash
    brew install openjdk
    # Ajouter à ~/.zshrc : export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
    # Puis : source ~/.zshrc
    ```
2.  **Téléchargement de `bundletool.jar` :**
    *   Allez sur `https://github.com/google/bundletool/releases`.
    *   Téléchargez `bundletool-all-X.Y.Z.jar` (ex: `bundletool-all-1.18.2.jar`).
3.  **Création du Keystore de débogage :**
    ```bash
    mkdir -p ~/.android
    keytool -genkeypair -v -keystore ~/.android/debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US" -storepass android -keypass android
    ```

#### 2.2 Exécution de `bundletool`

1.  **Naviguez vers le dossier** contenant votre `.aab` et `bundletool.jar`.
    ```bash
    cd "/chemin/vers/votre/dossier/"
    ```
2.  **Générez le fichier `.apks` :**
    ```bash
    /opt/homebrew/opt/openjdk/bin/java -jar bundletool-all-X.Y.Z.jar build-apks --bundle=votre_app.aab --output=ChefTips.apks --mode=universal
    ```
    *   Remplacez `X.Y.Z` par la version de `bundletool`.
    *   Remplacez `votre_app.aab` par le nom de votre fichier AAB.

#### 2.3 Extraction de l'APK universel

1.  **Renommez le fichier `.apks` en `.zip` :**
    ```bash
    mv ChefTips.apks ChefTips.zip
    ```
2.  **Décompressez le fichier `.zip` :**
    ```bash
    unzip ChefTips.zip
    ```
*   **Résultat :** Un fichier `universal.apk` est créé dans le dossier.

### Étape 3 : Installation de l'APK sur un Appareil Android

*   **Objectif :** Transférer et installer le fichier `universal.apk` sur un téléphone Android.
*   **Méthode :** Transférez le fichier `universal.apk` sur votre appareil Android (via USB, email, cloud, etc.) et ouvrez-le pour l'installer.

---
