<?php
// ============================================================
// lib/helpers.php — Fonctions utilitaires
// ============================================================

require_once __DIR__ . '/../config/config.php';

// ---------- Réponses JSON ----------

/**
 * Envoie une réponse JSON et termine l'exécution
 */
function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function success(array $data = []): void {
    jsonResponse(array_merge(['success' => true], $data));
}

function error(string $message, int $status = 400): void {
    jsonResponse(['success' => false, 'error' => $message], $status);
}

// ---------- Authentification ----------

/**
 * Vérifie le token Bearer et retourne le user, ou stoppe avec 401
 */
function requireAuth(): array {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) {
        error('Non authentifié', 401);
    }
    $token = trim($m[1]);
    $db    = getDB();
    $stmt  = $db->prepare('SELECT id, pseudo FROM users WHERE token = ? AND last_seen > DATE_SUB(NOW(), INTERVAL ? SECOND)');
    $stmt->execute([$token, SESSION_TTL]);
    $user = $stmt->fetch();
    if (!$user) {
        error('Session expirée ou invalide', 401);
    }
    // Rafraîchir last_seen
    $db->prepare('UPDATE users SET last_seen = NOW() WHERE id = ?')->execute([$user['id']]);
    return $user;
}

/**
 * Génère un token aléatoire sécurisé
 */
function generateToken(): string {
    return bin2hex(random_bytes(32));
}

/**
 * Génère un code de partie unique (6 chars majuscules)
 */
function generateGameCode(): string {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    do {
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= $chars[random_int(0, strlen($chars) - 1)];
        }
        $exists = getDB()->prepare('SELECT 1 FROM games WHERE code = ?');
        $exists->execute([$code]);
    } while ($exists->fetchColumn());
    return $code;
}

// ---------- CORS ----------

function setCorsHeaders(): void {
    header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ---------- Input ----------

/**
 * Récupère le body JSON de la requête
 */
function getJsonBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
