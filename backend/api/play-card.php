<?php
// ============================================================
// api/play-card.php — Jouer une carte
// ============================================================

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';
require_once __DIR__ . '/../lib/belote.php';

setCorsHeaders();
$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Méthode non autorisée', 405);
}

$body   = getJsonBody();
$gameId = (int)($body['gameId'] ?? 0);
$suit   = $body['suit'] ?? '';
$value  = $body['value'] ?? '';

$db = getDB();

// Charger la partie
$gStmt = $db->prepare('SELECT * FROM games WHERE id = ?');
$gStmt->execute([$gameId]);
$g = $gStmt->fetch();
if (!$g) error('Partie introuvable');
if ($g['status'] !== 'playing') error('La partie n\'est pas en cours');

// Charger le tour
$rStmt = $db->prepare('SELECT * FROM rounds WHERE game_id = ? order by id desc limit 1');
$rStmt->execute([$gameId]);
$r = $rStmt->fetch();
if (!$r) error('Tour introuvable');

$trumpSuit = $r['trump_suit'];

// Joueur dans la partie
$pStmt = $db->prepare('SELECT * FROM players WHERE game_id = ? AND user_id = ?');
$pStmt->execute([$gameId, $user['id']]);
$player = $pStmt->fetch();
if (!$player) error('Vous n\'êtes pas dans cette partie');

// C'est son tour ?
if ((int)$r['current_player_id'] !== (int)$player['id']) {
    error('Ce n\'est pas votre tour');
}

// Vérifier que la carte est jouable
if (!isCardPlayable($r["id"], $player['id'], $suit, $value, $trumpSuit)) {
    error('Vous ne pouvez pas jouer cette carte (règle de belote)');
}

// Compter les cartes dans ce pli
$trickNum = (int)$r['current_trick'];
$countStmt = $db->prepare('SELECT COUNT(*) FROM cards WHERE round_id=? AND trick_num=? AND status=\'played\'');
$countStmt->execute([$r["id"], $trickNum]);
$playOrder = (int)$countStmt->fetchColumn() + 1;

// Belote/Rebelote ?
$beloteAnnounce = checkBeloteRebelote($r["id"], $player['id'], $suit, $value, $trumpSuit);
if ($beloteAnnounce === 'belote') {
    $db->prepare('UPDATE rounds SET belote_player_id=? WHERE id=?')->execute([$player['id'], $r["id"]]);
} elseif ($beloteAnnounce === 'rebelote') {
    $db->prepare('UPDATE rounds SET rebelote_done=1 WHERE id=?')->execute([$r["id"]]);
}

// Jouer la carte
$db->prepare(
    'UPDATE cards SET status=\'played\', trick_num=?, play_order=?, played_at=NOW()
     WHERE round_id=? AND player_id=? AND suit=? AND value=? AND status=\'hand\''
)->execute([$trickNum, $playOrder, $r["id"], $player['id'], $suit, $value]);

$nextData = [];

// Si 4 cartes jouées → terminer le pli
if ($playOrder === 4) {
    $result   = finalizeTrick($r["id"], $trickNum, $trumpSuit);
    $nextTrick = $trickNum + 1;

    if ($nextTrick >= 8) {
        // Fin de la manche
        $scores = finalizeRound($r["id"]);

        // Vérifier si la partie est terminée (ex: 1000 pts)
        $totals = $db->prepare('SELECT SUM(team1_score) AS team1_total, SUM(team2_score) AS team2_total FROM rounds WHERE game_id=?');
        $totals->execute([$gameId]);
        $t = $totals->fetch();
        $gameOver = ($t['team1_total'] >= 1000 || $t['team2_total'] >= 1000);

        if ($gameOver) {
            $winnerTeam = 1;
            if ($t['team1_total'] < $t['team2_total']){
                $winnerTeam = 2;
            }else if ($t['team1_total'] == $t['team2_total']){
                $winnerTeam = 0;
            }
            $db->prepare('UPDATE games SET status=\'finished\', winner_team=? WHERE id=?')->execute([$winnerTeam, $gameId]);
            //$db->prepare('DELETE FROM cards WHERE game_id=?')->execute([$gameId]);
            //$db->prepare('DELETE FROM bids WHERE game_id=?')->execute([$gameId]);
            //$db->prepare('DELETE FROM turns WHERE game_id=?')->execute([$gameId]);
        } else {
            // Nouvelle manche : changer le donneur et redistribuer
            $seatsStmt = $db->prepare('SELECT id, seat FROM players WHERE game_id=? ORDER BY seat');
            $seatsStmt->execute([$gameId]);
            $seats    = $seatsStmt->fetchAll();
            $seatMap  = array_column($seats, 'id', 'seat');
            $idToSeat = array_flip($seatMap);

            $oldDealerSeat  = $idToSeat[(int)$r['dealer_id']];
            $newDealerSeat  = ($oldDealerSeat + 1) % 4;
            $newDealer      = $seatMap[$newDealerSeat];
            $newFirstBidder = $seatMap[($newDealerSeat + 1) % 4];

            //$db->prepare('DELETE FROM cards WHERE game_id=?')->execute([$gameId]);
            //$db->prepare('DELETE FROM bids WHERE game_id=?')->execute([$gameId]);
            //$db->prepare('DELETE FROM turns WHERE game_id=?')->execute([$gameId]);

            // Réinitialiser AVANT dealCards (qui va écrire bid_suit_proposed)

            $db->prepare('INSERT INTO rounds (game_id, dealer_id, current_player_id) VALUES (?,?,?)')
            ->execute([$gameId,$newDealer, $newFirstBidder]);

            $newRoundId = (int)$db->lastInsertId();

            $db->prepare(
                'UPDATE games SET status=\'bidding\' WHERE id=?'
            )->execute([$gameId]);

            $ordered = [];
            for ($i = 1; $i <= 4; $i++) $ordered[] = $seatMap[($newDealerSeat + $i) % 4];
            dealCards($newRoundId, $ordered);
        }

        $nextData = ['roundOver' => true, 'scores' => $scores, 'gameOver' => $gameOver ?? false];
    } else {
        // Prochain pli : le gagnant du pli joue en premier
        $db->prepare(
            'UPDATE rounds SET current_trick=?, current_player_id=? WHERE id=?'
        )->execute([$nextTrick, $result['winner_player_id'], $r["id"]]);
        $nextData = ['trickWinner' => $result];
    }
} else {
    // Prochain joueur dans le pli
    $seatsStmt = $db->prepare('SELECT id, seat FROM players WHERE game_id=? ORDER BY seat');
    $seatsStmt->execute([$gameId]);
    $seats    = $seatsStmt->fetchAll();
    $seatMap  = array_column($seats, 'id', 'seat');
    $idToSeat = array_flip($seatMap);

    $currentSeat  = $idToSeat[$player['id']];
    $nextSeat     = ($currentSeat + 1) % 4;
    $nextPlayerId = $seatMap[$nextSeat];

    $db->prepare('UPDATE rounds SET current_player_id=? WHERE id=?')->execute([$nextPlayerId, $r["id"]]);
}

success(array_merge([
    'played'   => ['suit' => $suit, 'value' => $value],
    'belote'   => $beloteAnnounce,
], $nextData));
