<?php
// ============================================================
// api/leave-game.php — Quitter une partie
//
// - Si la partie est en 'waiting' : on supprime le joueur
//   (il peut rejoindre à nouveau ou une autre partie)
// - Si la partie est en cours (bidding/playing) : on marque
//   le joueur comme déconnecté ; la partie continue
//   (les autres joueurs peuvent continuer, le joueur peut
//   se reconnecter avec /join-game en utilisant le même code)
// - Si c'était le créateur et la partie était en 'waiting'
//   avec un seul joueur : on supprime la partie
// ============================================================

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';

setCorsHeaders();
$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Méthode non autorisée', 405);
}

$body   = getJsonBody();
$gameId = (int)($body['gameId'] ?? 0);
if (!$gameId) error('gameId requis');

$db = getDB();

// Charger la partie
$gStmt = $db->prepare('SELECT * FROM games WHERE id = ?');
$gStmt->execute([$gameId]);
$g = $gStmt->fetch();
if (!$g) error('Partie introuvable');

// Vérifier que le joueur est bien dans la partie
$pStmt = $db->prepare('SELECT * FROM players WHERE game_id = ? AND user_id = ?');
$pStmt->execute([$gameId, $user['id']]);
$player = $pStmt->fetch();
if (!$player) error('Vous n\'êtes pas dans cette partie');

if ($g['status'] === 'waiting') {
    // ---- Partie pas encore commencée : on retire vraiment le joueur ----
    $db->prepare('DELETE FROM players WHERE game_id = ? AND user_id = ?')
       ->execute([$gameId, $user['id']]);

    // Compter les joueurs restants
    $countStmt = $db->prepare('SELECT COUNT(*) FROM players WHERE game_id = ?');
    $countStmt->execute([$gameId]);
    $remaining = (int)$countStmt->fetchColumn();

    if ($remaining === 0) {
        // Plus personne → supprimer la partie
        $db->prepare('DELETE FROM games WHERE id = ?')->execute([$gameId]);
        success(['left' => true, 'gameDeleted' => true]);
    }

    success(['left' => true, 'gameDeleted' => false]);

} else {
    // ---- Partie en cours : marquer déconnecté sans supprimer ----
    // Le joueur pourra se reconnecter en utilisant /join-game avec le même code
    $db->prepare('UPDATE players SET is_connected = 0 WHERE game_id = ? AND user_id = ?')
       ->execute([$gameId, $user['id']]);

    success(['left' => true, 'canRejoin' => true, 'code' => $g['code']]);
}
