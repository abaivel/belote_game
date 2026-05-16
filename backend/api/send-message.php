<?php
// ============================================================
// api/send-message.php — Envoyer un message dans le chat
// ============================================================

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';

setCorsHeaders();
$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') error('Méthode non autorisée', 405);

$body    = getJsonBody();
$gameId  = (int)($body['gameId'] ?? 0);
$content = trim($body['content'] ?? '');

if (!$gameId) error('gameId requis');
if (strlen($content) < 1 || strlen($content) > 500) error('Message invalide');

$db = getDB();

// Vérifier que le joueur est dans la partie
$check = $db->prepare('SELECT 1 FROM players WHERE game_id=? AND user_id=?');
$check->execute([$gameId, $user['id']]);
if (!$check->fetchColumn()) error('Vous n\'êtes pas dans cette partie');

$db->prepare('INSERT INTO messages (game_id, user_id, pseudo, content) VALUES (?,?,?,?)')
   ->execute([$gameId, $user['id'], $user['pseudo'], $content]);

success(['messageId' => (int)$db->lastInsertId()]);
