#!/usr/bin/env node
/* eslint-disable */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Affiche l'aide du script
 */
function showHelp() {
    console.log(`
    Usage: node ${path.basename(__filename)} <chemin_source> <repertoire_sortie> [options]
    
Arguments requis:
  <chemin_source>      Chemin du répertoire à parcourir récursivement
  <repertoire_sortie>  Répertoire de sortie où stocker les fichiers (créé s'il n'existe pas)

Options:
  -e, --extensions <ext1,ext2>  Extensions des fichiers à inclure (défaut: js)
                                Exemple: -e js,ts,jsx ou --extensions js,ts,jsx
  -l, --lines <nombre>          Nombre de lignes par fichier de sortie (défaut: 4000)
                                Exemple: -l 5000 ou --lines 5000
  -i, --ignore <dossier1,dossier2>  Dossiers à ignorer, séparés par des virgules
                                    Exemple: -i node_modules,dist,build
  -g, --group-by-folder         Regrouper les fichiers par sous-dossiers
  -d, --depth <niveau>          Profondeur de regroupement (défaut: 1, nécessite -g)
                                Exemple: -d 2 ou --depth 2
  -m, --max-files <nombre>      Nombre maximal de fichiers de sortie (nécessite -g)
                                Exemple: -m 10 ou --max-files 10
  -c, --clean                   Nettoyer le répertoire de sortie avant génération
                                (supprime tous les fichiers existants)
  -h, --help                    Affiche cette aide

Exemples:
  # Mode normal (comportement original)
  node ${path.basename(__filename)} ./mon_projet ./sortie
  node ${path.basename(__filename)} ./mon_projet ./sortie -e js,ts -l 5000

  # Avec nettoyage du répertoire de sortie
  node ${path.basename(__filename)} ./mon_projet ./sortie -c
  node ${path.basename(__filename)} ./mon_projet ./sortie -e js,ts -l 5000 -c

  # Regroupement par sous-dossiers
  node ${path.basename(__filename)} ./src ./output -g
  node ${path.basename(__filename)} ./src ./output -g -e js,ts,jsx -l 3000

  # Regroupement avec profondeur, limite et nettoyage
  node ${path.basename(__filename)} ./src ./output -g -d 2 -m 10 -c
  node ${path.basename(__filename)} ./src ./output -g -e js,ts -l 3000 -i node_modules -m 15 -c
`);
}

/**
 * Parse les arguments de ligne de commande
 * @returns {Object} Configuration parsée
 */
function parseArguments() {
    const args = process.argv.slice(2);
    const config = {
        sourcePath: null,
        outputDir: null,
        extensions: ['js'],
        linesPerFile: 4000,
        ignoredFolders: new Set(),
        groupByFolder: false,
        depth: 1,
        maxFiles: null,
        cleanOutput: false
    };

    // Vérifier si l'aide est demandée
    if (args.includes('-h') || args.includes('--help')) {
        showHelp();
        process.exit(0);
    }

    // Les deux premiers arguments doivent être les chemins
    if (args.length < 2) {
        console.error('Erreur: Chemin source et répertoire de sortie requis');
        showHelp();
        process.exit(1);
    }

    config.sourcePath = args[0];
    config.outputDir = args[1];

    // Parser les options
    for (let i = 2; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '-e':
            case '--extensions':
                if (i + 1 < args.length) {
                    config.extensions = args[i + 1]
                        .split(',')
                        .map(ext => ext.trim())
                        .filter(ext => ext.length > 0);
                    i++; // Skip next argument
                } else {
                    console.error(`Erreur: ${arg} nécessite une valeur`);
                    process.exit(1);
                }
                break;

            case '-l':
            case '--lines':
                if (i + 1 < args.length) {
                    const linesValue = parseInt(args[i + 1], 10);
                    if (isNaN(linesValue) || linesValue <= 0) {
                        console.error(`Erreur: ${arg} doit être un nombre positif`);
                        process.exit(1);
                    }
                    config.linesPerFile = linesValue;
                    i++; // Skip next argument
                } else {
                    console.error(`Erreur: ${arg} nécessite une valeur`);
                    process.exit(1);
                }
                break;

            case '-i':
            case '--ignore':
                if (i + 1 < args.length) {
                    const ignoredList = args[i + 1]
                        .split(',')
                        .map(folder => folder.trim())
                        .filter(folder => folder.length > 0);
                    config.ignoredFolders = new Set(ignoredList);
                    i++; // Skip next argument
                } else {
                    console.error(`Erreur: ${arg} nécessite une valeur`);
                    process.exit(1);
                }
                break;

            case '-g':
            case '--group-by-folder':
                config.groupByFolder = true;
                break;

            case '-d':
            case '--depth':
                if (i + 1 < args.length) {
                    const depthValue = parseInt(args[i + 1], 10);
                    if (isNaN(depthValue) || depthValue <= 0) {
                        console.error(`Erreur: ${arg} doit être un nombre positif`);
                        process.exit(1);
                    }
                    config.depth = depthValue;
                    i++; // Skip next argument
                } else {
                    console.error(`Erreur: ${arg} nécessite une valeur`);
                    process.exit(1);
                }
                break;

            case '-m':
            case '--max-files':
                if (i + 1 < args.length) {
                    const maxFilesValue = parseInt(args[i + 1], 10);
                    if (isNaN(maxFilesValue) || maxFilesValue <= 0) {
                        console.error(`Erreur: ${arg} doit être un nombre positif`);
                        process.exit(1);
                    }
                    config.maxFiles = maxFilesValue;
                    i++; // Skip next argument
                } else {
                    console.error(`Erreur: ${arg} nécessite une valeur`);
                    process.exit(1);
                }
                break;

            case '-c':
            case '--clean':
                config.cleanOutput = true;
                break;

            default:
                console.error(`Erreur: Option inconnue "${arg}"`);
                showHelp();
                process.exit(1);
        }
    }

    // Validation des dépendances entre options
    if (config.depth > 1 && !config.groupByFolder) {
        console.error('Erreur: --depth ne peut être utilisé qu\'avec --group-by-folder');
        process.exit(1);
    }

    if (config.maxFiles !== null && !config.groupByFolder) {
        console.error('Erreur: --max-files ne peut être utilisé qu\'avec --group-by-folder');
        process.exit(1);
    }

    return config;
}

/**
 * Lit récursivement tous les fichiers d'un répertoire avec les extensions spécifiées
 * @param {string} directoryPath - Chemin du répertoire à explorer
 * @param {Array} extensions - Extensions des fichiers à inclure
 * @param {Set} ignoredFolders - Ensemble des dossiers à ignorer
 * @returns {Array} Liste des chemins de fichiers correspondants
 */
function findFilesRecursively(directoryPath, extensions, ignoredFolders) {
    let filesList = [];

    try {
        const items = fs.readdirSync(directoryPath);

        for (const item of items) {
            const itemPath = path.join(directoryPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                // Vérifier si le dossier doit être ignoré
                if (ignoredFolders.has(item)) {
                    console.log(`Dossier ignoré: ${itemPath}`);
                    continue;
                }
                // Parcours récursif des sous-répertoires
                filesList = filesList.concat(findFilesRecursively(itemPath, extensions, ignoredFolders));
            } else if (stats.isFile()) {
                // Vérifier si le fichier a une extension autorisée
                const fileExt = path.extname(item).slice(1); // Enlever le point
                if (extensions.includes(fileExt)) {
                    filesList.push(itemPath);
                }
            }
        }
    } catch (error) {
        console.error(`Erreur lors de la lecture du répertoire ${directoryPath}: ${error.message}`);
    }

    return filesList;
}

/**
 * Groupe les fichiers par sous-dossiers selon la profondeur spécifiée
 * @param {Array} filesList - Liste des chemins de fichiers
 * @param {string} sourcePath - Chemin du répertoire source
 * @param {number} depth - Profondeur de regroupement
 * @returns {Object} Dictionnaire avec les groupes de fichiers
 */
function groupFilesByFolder(filesList, sourcePath, depth) {
    const groups = {};

    for (const filePath of filesList) {
        // Obtenir le chemin relatif par rapport au répertoire source
        const relativePath = path.relative(sourcePath, filePath);
        const pathParts = relativePath.split(path.sep);

        // Construire la clé de groupe basée sur la profondeur
        let groupKey = '';
        if (pathParts.length === 1) {
            // Fichier à la racine
            groupKey = 'root';
        } else {
            // Prendre les N premiers dossiers selon la profondeur
            const folderParts = pathParts.slice(0, Math.min(depth, pathParts.length - 1));
            groupKey = folderParts.join('_');
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(filePath);
    }

    return groups;
}

/**
 * Applique la limitation du nombre de fichiers en regroupant les plus petits groupes
 * @param {Object} groups - Dictionnaire des groupes de fichiers
 * @param {number} maxFiles - Nombre maximal de fichiers de sortie
 * @returns {Object} Dictionnaire des groupes limités
 */
function limitGroups(groups, maxFiles) {
    const groupKeys = Object.keys(groups);

    if (groupKeys.length <= maxFiles) {
        return groups;
    }

    console.log(`Avertissement: ${groupKeys.length} groupes trouvés, limitation à ${maxFiles} fichiers`);

    // Calculer la taille de chaque groupe (nombre de fichiers)
    const groupSizes = groupKeys.map(key => ({
        key,
        size: groups[key].length,
        files: groups[key]
    }));

    // Trier par taille croissante
    groupSizes.sort((a, b) => a.size - b.size);

    // Garder les plus grands groupes
    const keptGroups = groupSizes.slice(-(maxFiles - 1));
    const mergedGroups = groupSizes.slice(0, -(maxFiles - 1));

    // Créer le nouveau dictionnaire de groupes
    const limitedGroups = {};

    // Ajouter les groupes conservés
    for (const group of keptGroups) {
        limitedGroups[group.key] = group.files;
    }

    // Fusionner les petits groupes dans un groupe "misc"
    if (mergedGroups.length > 0) {
        limitedGroups['misc'] = [];
        for (const group of mergedGroups) {
            limitedGroups['misc'] = limitedGroups['misc'].concat(group.files);
        }
        console.log(`${mergedGroups.length} petits groupes fusionnés dans "misc" (${limitedGroups['misc'].length} fichiers)`);
    }

    return limitedGroups;
}

/**
 * Crée un répertoire s'il n'existe pas
 * @param {string} directoryPath - Chemin du répertoire à créer
 * @returns {boolean} - Indique si le répertoire existe ou a été créé avec succès
 */
function ensureDirectoryExists(directoryPath) {
    try {
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
            console.log(`Répertoire créé: ${directoryPath}`);
        }
        return true;
    } catch (error) {
        console.error(`Erreur lors de la création du répertoire ${directoryPath}: ${error.message}`);
        return false;
    }
}

/**
 * Nettoie le contenu d'un répertoire sans supprimer le répertoire lui-même
 * @param {string} directoryPath - Chemin du répertoire à nettoyer
 */
function cleanDirectory(directoryPath) {
    try {
        if (fs.existsSync(directoryPath)) {
            const files = fs.readdirSync(directoryPath);

            for (const file of files) {
                const filePath = path.join(directoryPath, file);
                const stats = fs.statSync(filePath);

                if (stats.isDirectory()) {
                    // Supprimer récursivement les sous-répertoires
                    fs.rmSync(filePath, { recursive: true, force: true });
                } else {
                    // Supprimer les fichiers
                    fs.unlinkSync(filePath);
                }
            }

            console.log(`Répertoire nettoyé: ${directoryPath}`);
        }
    } catch (error) {
        console.error(`Erreur lors du nettoyage du répertoire ${directoryPath}: ${error.message}`);
    }
}

/**
 * Concatène tous les fichiers spécifiés et les divise en plusieurs fichiers
 * @param {Array} filesList - Liste des chemins de fichiers à concaténer
 * @param {string} outputDir - Répertoire de sortie
 * @param {number} linesPerFile - Nombre de lignes par fichier de sortie
 * @param {boolean} cleanOutput - Indique si le répertoire de sortie doit être nettoyé
 */
function concatenateAndSliceFiles(filesList, outputDir, linesPerFile, cleanOutput) {
    try {
        // S'assurer que le répertoire de sortie existe
        if (!ensureDirectoryExists(outputDir)) {
            return;
        }

        // Nettoyer le répertoire de sortie si demandé
        if (cleanOutput) {
            cleanDirectory(outputDir);
        }

        // Variables pour la gestion des lignes
        let allContent = '';
        let totalFiles = 0;

        // Parcourir tous les fichiers et collecter le contenu
        for (const filePath of filesList) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const stats = fs.statSync(filePath);
                const header = `\n/*
${'*'.repeat(78)}
* FICHIER: ${filePath}
* TAILLE: ${stats.size} octets
* MODIFIÉ: ${stats.mtime.toISOString()}
${'*'.repeat(78)}
*/\n\n`;

                // Ajouter le contenu au buffer
                allContent += header + content;
                totalFiles++;

            } catch (error) {
                console.error(`Erreur lors de la lecture du fichier ${filePath}: ${error.message}`);
            }
        }

        // Diviser le contenu en lignes
        const allLines = allContent.split('\n');

        // Créer les fichiers de sortie
        let fileCounter = 1;
        let startLine = 0;

        while (startLine < allLines.length) {
            const endLine = Math.min(startLine + linesPerFile, allLines.length);
            const chunkContent = allLines.slice(startLine, endLine).join('\n');

            // Nom du fichier de sortie
            const outputFileName = path.join(outputDir, `output_part_${String(fileCounter).padStart(3, '0')}.txt`);

            // Écrire le contenu dans le fichier
            fs.writeFileSync(outputFileName, chunkContent);

            console.log(`Fichier créé: ${outputFileName} (lignes ${startLine + 1} à ${endLine})`);

            // Préparer pour le prochain fichier
            startLine = endLine;
            fileCounter++;
        }

        console.log(`Concaténation terminée. ${totalFiles} fichiers ont été traités et divisés en ${fileCounter - 1} fichiers de sortie`);

    } catch (error) {
        console.error(`Erreur lors de la concaténation des fichiers: ${error.message}`);
    }
}

/**
 * Concatène les fichiers groupés par dossier
 * @param {Object} groups - Dictionnaire des groupes de fichiers
 * @param {string} outputDir - Répertoire de sortie
 * @param {number} linesPerFile - Nombre de lignes par fichier de sortie
 * @param {boolean} cleanOutput - Indique si le répertoire de sortie doit être nettoyé
 */
function concatenateGroupedFiles(groups, outputDir, linesPerFile, cleanOutput) {
    try {
        // S'assurer que le répertoire de sortie existe
        if (!ensureDirectoryExists(outputDir)) {
            return;
        }

        // Nettoyer le répertoire de sortie si demandé
        if (cleanOutput) {
            cleanDirectory(outputDir);
        }

        const groupKeys = Object.keys(groups);
        let totalOutputFiles = 0;

        for (const groupKey of groupKeys) {
            const filesList = groups[groupKey];
            let groupContent = '';
            let totalFiles = 0;

            console.log(`\nTraitement du groupe "${groupKey}" (${filesList.length} fichiers):`);

            // Parcourir tous les fichiers du groupe et collecter le contenu
            for (const filePath of filesList) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const stats = fs.statSync(filePath);
                    const header = `\n/*
${'*'.repeat(78)}
* FICHIER: ${filePath}
* TAILLE: ${stats.size} octets
* MODIFIÉ: ${stats.mtime.toISOString()}
${'*'.repeat(78)}
*/\n\n`;

                    // Ajouter le contenu au buffer
                    groupContent += header + content;
                    totalFiles++;

                } catch (error) {
                    console.error(`Erreur lors de la lecture du fichier ${filePath}: ${error.message}`);
                }
            }

            // Diviser le contenu en lignes
            const allLines = groupContent.split('\n');

            // Créer les fichiers de sortie pour ce groupe
            let fileCounter = 1;
            let startLine = 0;

            while (startLine < allLines.length) {
                const endLine = Math.min(startLine + linesPerFile, allLines.length);
                const chunkContent = allLines.slice(startLine, endLine).join('\n');

                // Nom du fichier de sortie avec le nom du groupe
                const outputFileName = path.join(outputDir, `output_${groupKey}_${String(fileCounter).padStart(3, '0')}.txt`);

                // Écrire le contenu dans le fichier
                fs.writeFileSync(outputFileName, chunkContent);

                console.log(`  Fichier créé: ${path.basename(outputFileName)} (lignes ${startLine + 1} à ${endLine})`);

                // Préparer pour le prochain fichier
                startLine = endLine;
                fileCounter++;
                totalOutputFiles++;
            }

            console.log(`  Groupe "${groupKey}": ${totalFiles} fichiers traités → ${fileCounter - 1} fichiers de sortie`);
        }

        console.log(`\nConcaténation groupée terminée. ${groupKeys.length} groupes traités → ${totalOutputFiles} fichiers de sortie`);

    } catch (error) {
        console.error(`Erreur lors de la concaténation groupée des fichiers: ${error.message}`);
    }
}

/**
 * Fonction principale
 */
function main() {
    // Parser les arguments
    const config = parseArguments();

    // Vérifier que le chemin source existe
    if (!fs.existsSync(config.sourcePath)) {
        console.error(`Erreur: Le chemin "${config.sourcePath}" n'existe pas`);
        process.exit(1);
    }

    // Afficher la configuration
    console.log(`Configuration:`);
    console.log(`  Chemin source: ${config.sourcePath}`);
    console.log(`  Répertoire de sortie: ${config.outputDir}`);
    console.log(`  Extensions: ${config.extensions.join(', ')}`);
    console.log(`  Lignes par fichier: ${config.linesPerFile}`);
    console.log(`  Mode de regroupement: ${config.groupByFolder ? 'activé' : 'désactivé'}`);
    console.log(`  Nettoyage du répertoire de sortie: ${config.cleanOutput ? 'activé' : 'désactivé'}`);

    if (config.groupByFolder) {
        console.log(`  Profondeur de regroupement: ${config.depth}`);
        if (config.maxFiles) {
            console.log(`  Limite de fichiers: ${config.maxFiles}`);
        }
    }

    if (config.ignoredFolders.size > 0) {
        console.log(`  Dossiers ignorés: ${Array.from(config.ignoredFolders).join(', ')}`);
    }

    // Trouver tous les fichiers correspondants
    const filesList = findFilesRecursively(config.sourcePath, config.extensions, config.ignoredFolders);

    if (filesList.length === 0) {
        console.warn(`Aucun fichier avec les extensions "${config.extensions.join(', ')}" n'a été trouvé dans ${config.sourcePath}`);
        process.exit(0);
    }

    console.log(`\nFichiers trouvés: ${filesList.length}`);

    if (config.groupByFolder) {
        // Mode regroupement par dossiers
        let groups = groupFilesByFolder(filesList, config.sourcePath, config.depth);

        console.log(`Groupes détectés: ${Object.keys(groups).length}`);

        // Afficher les groupes trouvés
        for (const [groupKey, files] of Object.entries(groups)) {
            console.log(`  ${groupKey}: ${files.length} fichiers`);
        }

        // Appliquer la limitation si spécifiée
        if (config.maxFiles && Object.keys(groups).length > config.maxFiles) {
            groups = limitGroups(groups, config.maxFiles);
        }

        // Concaténer les fichiers groupés
        concatenateGroupedFiles(groups, config.outputDir, config.linesPerFile, config.cleanOutput);
    } else {
        // Mode normal (comportement original)
        concatenateAndSliceFiles(filesList, config.outputDir, config.linesPerFile, config.cleanOutput);
    }
}

// Exécuter le programme
main();

