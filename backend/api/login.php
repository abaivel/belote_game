<?php
// ============================================================
// api/login.php — Authentification (register + login)
// ============================================================

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Méthode non autorisée', 405);
}

$body   = getJsonBody();
$action = $body['action'] ?? 'login'; // 'login' ou 'register'
$pseudo = trim($body['pseudo'] ?? '');
$pass   = $body['password'] ?? '';

// Validation
if (strlen($pseudo) < 2 || strlen($pseudo) > 32) {
    error('Le pseudo doit faire entre 2 et 32 caractères');
}
if (!preg_match('/^[a-zA-Z0-9_\-\.]+$/', $pseudo)) {
    error('Le pseudo ne peut contenir que des lettres, chiffres, _, - ou .');
}
if (strlen($pass) < 4) {
    error('Le mot de passe doit faire au moins 4 caractères');
}

$db = getDB();

if ($action === 'register') {
    // Vérifier si pseudo disponible
    $stmt = $db->prepare('SELECT id FROM users WHERE pseudo = ?');
    $stmt->execute([$pseudo]);
    if ($stmt->fetch()) {
        error('Ce pseudo est déjà pris');
    }

    $hash  = password_hash($pass, PASSWORD_DEFAULT);
    $token = generateToken();

    $db->prepare('INSERT INTO users (pseudo, password, token, last_seen) VALUES (?,?,?,NOW())')
       ->execute([$pseudo, $hash, $token]);

    $userId = (int)$db->lastInsertId();
    success(['token' => $token, 'userId' => $userId, 'pseudo' => $pseudo]);

} else {
    // Login
    $stmt = $db->prepare('SELECT id, pseudo, password FROM users WHERE pseudo = ?');
    $stmt->execute([$pseudo]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($pass, $user['password'])) {
        error('Pseudo ou mot de passe incorrect');
    }

    $token = generateToken();
    $db->prepare('UPDATE users SET token = ?, last_seen = NOW() WHERE id = ?')
       ->execute([$token, $user['id']]);

    success(['token' => $token, 'userId' => $user['id'], 'pseudo' => $user['pseudo']]);
}
