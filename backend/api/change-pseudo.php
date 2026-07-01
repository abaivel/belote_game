<?php
// ============================================================
// api/login.php — Authentification (register + login)
// ============================================================

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';

setCorsHeaders();
$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    error('Méthode non autorisée', 405);
}

$body   = getJsonBody();
$pseudo = trim($body['pseudo'] ?? '');

$db = getDB();

$stmt = $db->prepare('SELECT id FROM users WHERE pseudo = ? AND id != ?');
$stmt->execute([$pseudo, $user["id"]]);
if ($stmt->fetch()) {
    error('Ce pseudo est déjà pris');
}

$db->prepare('UPDATE users SET pseudo = ? WHERE id = ?')
       ->execute([$pseudo, $user["id"]]);

success(['pseudo' => $pseudo]);