<?php
// ============================================================
// config.php — Configuration centrale
// Modifiez ces valeurs selon votre hébergement
// ============================================================

function loadEnv($path)
{
    if (!file_exists($path)) {
        return false;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // On ignore les commentaires (lignes commençant par #)
        if (strpos(trim($line), '#') === 0) continue;

        // On sépare la clé et la valeur
        list($name, $value) = explode('=', $line, 2);
        
        $name = trim($name);
        $value = trim($value);

        // On définit la variable d'environnement
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
    return true;
}

// Utilisation
loadEnv(__DIR__ . '/../.env');

define('DB_HOST',     $_ENV['DB_HOST']);
define('DB_NAME',     $_ENV['DB_NAME']);
define('DB_USER',     $_ENV['DB_USER']);
define('DB_PASS',     $_ENV['DB_PASS']);
define('DB_CHARSET',  'utf8mb4');

// Durée de session (secondes)
define('SESSION_TTL', 86400); // 24h

// Délai avant de considérer un joueur déconnecté (secondes)
define('DISCONNECT_TIMEOUT', 30);

// Activer les erreurs en développement (mettre false en production)
define('DEBUG_MODE', true); // Mettre false en production

// Origines autorisées pour CORS
define('ALLOWED_ORIGIN', $_ENV['ALLOWED_ORIGIN']);

// ---- Gestionnaires d'erreurs globaux ----
// Toute erreur/exception PHP renvoie du JSON au lieu d'une page HTML 500

set_exception_handler(function(Throwable $e) {
    // 1. Enregistrement dans le fichier de log sur le serveur
    $logFile = __DIR__ . '\..\log\exceptions.log'; // Chemin du fichier (ici à la racine du script)
    
    // Formatage d'un message détaillé pour le log (Date, Type, Message, Fichier, Ligne, Stack Trace)
    $logMessage = sprintf(
        "[%s] [%s] %s dans %s à la ligne %d\nStack trace:\n%s\n%s\n",
        date('Y-m-d H:i:s'),
        get_class($e),
        $e->getMessage(),
        $e->getFile(),
        $e->getLine(),
        $e->getTraceAsString(),
        str_repeat('-', 80) // Ligne de séparation pour la lisibilité
    );
    
    // Écrit dans le fichier (crée le fichier s'il n'existe pas, ou ajoute à la fin 'FILE_APPEND')
    // Le verrou 'LOCK_EX' évite les conflits d'écriture simultanée
    file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
    $msg = DEBUG_MODE
        ? '[' . get_class($e) . '] ' . $e->getMessage()
          . ' — ' . basename($e->getFile()) . ':' . $e->getLine()
        : 'Erreur serveur. Si le problème persiste, exécutez sql/migration_v2.sql.';
    echo json_encode(['success' => false, 'error' => $msg]);
    exit;
});

set_error_handler(function(int $errno, string $errstr, string $errfile, int $errline) {
    throw new ErrorException($errstr, $errno, $errno, $errfile, $errline);
});

ini_set('display_errors', DEBUG_MODE ? '1' : '0');
error_reporting(E_ALL);
