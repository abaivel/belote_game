<?php
// ============================================================
// api/join-game.php — Rejoindre une partie existante
// ============================================================

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';
require_once __DIR__ . '/../lib/belote.php';

// Handler global : toute exception PHP renvoie du JSON lisible
set_exception_handler(function(Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    // En production, ne pas exposer le message complet
    $msg = defined('DEBUG_MODE') && DEBUG_MODE
        ? $e->getMessage() . ' (ligne ' . $e->getLine() . ' dans ' . basename($e->getFile()) . ')'
        : 'Erreur serveur interne. Vérifiez que migration_v2.sql a été exécuté.';
    echo json_encode(['success' => false, 'error' => $msg]);
    exit;
});

setCorsHeaders();
$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Méthode non autorisée', 405);
}

$body = getJsonBody();
$code = strtoupper(trim($body['code'] ?? ''));

if (strlen($code) !== 6) {
    error('Code de partie invalide');
}

$db = getDB();

// Trouver la partie
$stmt = $db->prepare('SELECT * FROM games WHERE code = ?');
$stmt->execute([$code]);
$game = $stmt->fetch();

if (!$game) {
    error('Partie introuvable');
}

// Vérifier si le joueur est déjà inscrit dans cette partie (reconnexion possible)
$check = $db->prepare('SELECT id, seat, team FROM players WHERE game_id = ? AND user_id = ?');
$check->execute([$game['id'], $user['id']]);
$existing = $check->fetch();

if ($existing) {
    // Reconnexion : remettre le joueur comme connecté, peu importe le statut
    $db->prepare('UPDATE players SET last_ping = NOW(), is_connected = 1 WHERE id = ?')
       ->execute([$existing['id']]);
    success([
        'gameId'      => $game['id'],
        'code'        => $game['code'],
        'seat'        => (int)$existing['seat'],
        'team'        => (int)$existing['team'],
        'reconnected' => true,
        'status'      => $game['status'],
    ]);
}

// Nouveau joueur : la partie doit être en attente
if ($game['status'] !== 'waiting') {
    error('La partie a déjà commencé et vous n\'en faites pas partie');
}

// Compter les joueurs actuels
$countStmt = $db->prepare('SELECT seat FROM players WHERE game_id = ? ORDER BY seat');
$countStmt->execute([$game['id']]);
$takenSeats = array_column($countStmt->fetchAll(), 'seat');

if (count($takenSeats) >= 4) {
    error('La partie est complète (4 joueurs maximum)');
}

// Trouver un siège libre et assigner l'équipe
// Sièges : 0=Nord(eq1), 1=Est(eq2), 2=Sud(eq1), 3=Ouest(eq2)
$seatTeam = [0 => 1, 1 => 2, 2 => 1, 3 => 2];
$seat     = null;
$team     = null;
for ($s = 0; $s <= 3; $s++) {
    if (!in_array($s, $takenSeats)) {
        $seat = $s;
        $team = $seatTeam[$s];
        break;
    }
}

$db->prepare('INSERT INTO players (game_id, user_id, seat, team, last_ping) VALUES (?,?,?,?,NOW())')
   ->execute([$game['id'], $user['id'], $seat, $team]);

/*$newCount = count($takenSeats) + 1;

// Si 4 joueurs présents → démarrer la partie
if ($newCount === 4) {
    // Récupérer les joueurs dans l'ordre des sièges
    $pStmt = $db->prepare('SELECT id, seat FROM players WHERE game_id = ? ORDER BY seat');
    $pStmt->execute([$game['id']]);
    $players = $pStmt->fetchAll();

    // Tableau indexé par siège
    $bySeat = [];
    foreach ($players as $p) {
        $bySeat[(int)$p['seat']] = $p;
    }

    $dealerSeat      = 0;
    $dealerPlayerId  = $bySeat[$dealerSeat]['id'];
    $firstBidderId   = $bySeat[($dealerSeat + 1) % 4]['id'];

    // Ordre de distribution : commence par le joueur après le donneur
    $orderedIds = [];
    for ($i = 1; $i <= 4; $i++) {
        $orderedIds[] = $bySeat[($dealerSeat + $i) % 4]['id'];
    }

    $firstRoundStmt = $db->prepare("SELECT id FROM rounds WHERE game_id=? limit 1");
    $firstRoundStmt->execute([$game['id']]);
    $firstRoundId = $firstRoundStmt->fetchColumn();

    $db->prepare('UPDATE rounds SET dealer_id=?, current_player_id=? WHERE id=?')
   ->execute([$dealerPlayerId, $firstBidderId,$firstRoundId]);

    $db->prepare('UPDATE games SET status=\'bidding\' WHERE id=?')
       ->execute([$game['id']]);

    dealCards($firstRoundId, $orderedIds);
}*/

success(['gameId' => $game['id'], 'code' => $code, 'seat' => $seat, 'team' => $team]);
