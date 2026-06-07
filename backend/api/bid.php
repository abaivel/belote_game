<?php
// ============================================================
// api/bid.php — Phase d'enchères belote CLASSIQUE
//
// Tour 1 : chaque joueur peut "prendre" à la couleur retournée ou "passer"
// Tour 2 : si personne n'a pris au tour 1, chaque joueur peut prendre
//          à n'importe quelle autre couleur, ou passer
// Si personne ne prend au tour 2 → redistribution
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
$action = $body['action'] ?? ''; // 'pass' ou 'take'
$suit   = $body['suit']   ?? null;

$db = getDB();

// ---- Charger la partie ----
$gStmt = $db->prepare('SELECT * FROM games WHERE id = ?');
$gStmt->execute([$gameId]);
$g = $gStmt->fetch();
if (!$g)                          error('Partie introuvable');
if ($g['status'] !== 'bidding')   error('La partie n\'est pas en phase d\'enchères');

// ---- Joueur dans la partie ----
$pStmt = $db->prepare('SELECT * FROM players WHERE game_id = ? AND user_id = ?');
$pStmt->execute([$gameId, $user['id']]);
$player = $pStmt->fetch();
if (!$player) error('Vous n\'êtes pas dans cette partie');

// ---- C'est bien son tour ? ----
if ((int)$g['current_player_id'] !== (int)$player['id']) {
    error('Ce n\'est pas votre tour');
}

// ---- Valider l'action ----
if (!in_array($action, ['pass', 'take'])) {
    error('Action invalide (pass ou take)');
}

$bidTurn      = (int)$g['bid_turn'];        // 1 ou 2
$proposedSuit = $g['bid_suit_proposed'];    // couleur de la carte retournée
$bidOrderCount = (int)$g['bid_order_count'];

// Helper pour recharger la liste des sièges
$seatsStmt = $db->prepare('SELECT id, seat, nb_rounds_taken FROM players WHERE game_id=? ORDER BY seat');
$seatsStmt->execute([$gameId]);
$seats  = $seatsStmt->fetchAll();
$bySeat = [];
foreach ($seats as $s) $bySeat[(int)$s['seat']] = $s;
$idToSeat = [];
foreach ($bySeat as $seatNum => $pl) $idToSeat[(int)$pl['id']] = $seatNum;

if ($action === 'take') {
    // ---- Le joueur PREND ----
    if ($bidTurn === 1) {
        $chosenSuit = $proposedSuit; // Obligatoirement la couleur retournée
    } else {
        // Tour 2 : doit spécifier une couleur ≠ proposée
        if (!$suit || !in_array($suit, SUITS)) {
            error('Vous devez choisir une couleur valide au deuxième tour');
        }
        if ($suit === $proposedSuit) {
            error('Au deuxième tour vous ne pouvez pas choisir la couleur retournée');
        }
        $chosenSuit = $suit;
    }

    $bidTeam = (int)$player['team'];

    // Fixer l'atout et passer en 'playing'
    $db->prepare(
        'UPDATE games SET status=\'playing\', trump_suit=?, bid_team=?, trump_player_id=? WHERE id=?'
    )->execute([$chosenSuit, $bidTeam, $player['id'], $gameId]);

    //TODO : incrementer le nombre de parties prises
    $db->prepare(
        'UPDATE players SET nb_rounds_taken=? WHERE id=?'
    )->execute([$bySeat[$idToSeat[$player['id']]]["nb_rounds_taken"]+1, $player['id']]);

    // --- Phase 2 de la distribution ---
    // Récupérer les 11 cartes du talon dans l'ordre d'insertion
    $talonStmt = $db->prepare(
        'SELECT id FROM cards WHERE game_id=? AND status=\'talon\' ORDER BY id ASC'
    );
    $talonStmt->execute([$gameId]);
    $talonIds = array_column($talonStmt->fetchAll(), 'id');

    // Ordre de distribution phase 2 : commence par le joueur après le donneur
    $dealerSeatP2 = null;
    foreach ($bySeat as $seatNum => $pl) {
        if ($pl['id'] == $g['dealer_id']) { $dealerSeatP2 = $seatNum; break; }
    }
    $orderedP2 = [];
    for ($i = 1; $i <= 4; $i++) {
        $orderedP2[] = $bySeat[($dealerSeatP2 + $i) % 4]['id'];
    }

    // Le preneur reçoit 2 cartes du talon (+ la carte retournée = 8 en tout)
    // Les autres reçoivent 3 cartes chacun (5 + 3 = 8)
    $tIdx = 0;
    foreach ($orderedP2 as $pid) {
        $count = ($pid == $player['id']) ? 2 : 3;
        for ($i = 0; $i < $count; $i++) {
            $db->prepare('UPDATE cards SET player_id=?, status=\'hand\' WHERE id=?')
               ->execute([$pid, $talonIds[$tIdx++]]);
        }
    }

    $db->prepare(
        'UPDATE cards SET player_id=?, status=\'hand\' WHERE game_id=? AND status=\'talon_visible\''
    )->execute([$player['id'], $gameId]);
    /*
    // Donner la carte retournée au preneur (tour 1) ou la mettre hors jeu (tour 2)
    if ($bidTurn === 1) {
        $db->prepare(
            'UPDATE cards SET player_id=?, status=\'hand\' WHERE game_id=? AND status=\'talon_visible\''
        )->execute([$player['id'], $gameId]);
    } else {
        $db->prepare(
            'UPDATE cards SET status=\'talon\' WHERE game_id=? AND status=\'talon_visible\''
        )->execute([$gameId]);
    }*/

    // Le joueur à gauche du donneur commence à jouer
    $dealerSeat = null;
    foreach ($bySeat as $seatNum => $pl) {
        if ($pl['id'] == $g['dealer_id']) { $dealerSeat = $seatNum; break; }
    }
    $firstPlayerId = $bySeat[($dealerSeat + 1) % 4]['id'];

    $db->prepare('UPDATE games SET current_player_id=?, current_trick=0 WHERE id=?')
       ->execute([$firstPlayerId, $gameId]);

    success([
        'status'     => 'playing',
        'trump'      => $chosenSuit,
        'taker'      => $user['pseudo'],
        'taker_team' => $bidTeam,
    ]);

} else {
    // ---- Le joueur PASSE ----
    $newCount = $bidOrderCount + 1;

    $currentSeat  = $idToSeat[(int)$player['id']];
    $nextSeat     = ($currentSeat + 1) % 4;
    $nextPlayerId = $bySeat[$nextSeat]['id'];

    if ($newCount >= 4) {
        // Tous les joueurs ont parlé à ce tour
        if ($bidTurn === 1) {
            // Passer au tour 2
            $dealerSeat = null;
            foreach ($bySeat as $seatNum => $pl) {
                if ($pl['id'] == $g['dealer_id']) { $dealerSeat = $seatNum; break; }
            }
            $firstTurn2Id = $bySeat[($dealerSeat + 1) % 4]['id'];

            $db->prepare(
                'UPDATE games SET bid_turn=2, bid_order_count=0, current_player_id=? WHERE id=?'
            )->execute([$firstTurn2Id, $gameId]);

            success(['status' => 'bidding', 'bidTurn' => 2]);

        } else {
            // Tour 2 : tout le monde a passé → redistribuer, donneur suivant
            $dealerSeat = null;
            foreach ($bySeat as $seatNum => $pl) {
                if ($pl['id'] == $g['dealer_id']) { $dealerSeat = $seatNum; break; }
            }
            $newDealerSeat = ($dealerSeat + 1) % 4;
            $newDealerId   = $bySeat[$newDealerSeat]['id'];
            $newFirstBidder = $bySeat[($newDealerSeat + 1) % 4]['id'];

            $db->prepare('DELETE FROM cards WHERE game_id=?')->execute([$gameId]);
            $db->prepare('DELETE FROM bids WHERE game_id=?')->execute([$gameId]);

            // Réinitialiser l'état de la partie AVANT de redistribuer
            $db->prepare(
                'UPDATE games SET status=\'bidding\', trump_suit=NULL, bid_team=NULL,
                 trump_player_id=NULL, bid_suit_proposed=NULL, bid_turn=1, bid_order_count=0,
                 dealer_id=?, current_player_id=? WHERE id=?'
            )->execute([$newDealerId, $newFirstBidder, $gameId]);

            // Redistribuer (écrit bid_suit_proposed avec la nouvelle carte retournée)
            $orderedIds = [];
            for ($i = 1; $i <= 4; $i++) {
                $orderedIds[] = $bySeat[($newDealerSeat + $i) % 4]['id'];
            }
            dealCards($gameId, $orderedIds);

            success(['status' => 'redeal', 'message' => 'Redistribution']);
        }
    } else {
        // Prochain joueur
        $db->prepare(
            'UPDATE games SET bid_order_count=?, current_player_id=? WHERE id=?'
        )->execute([$newCount, $nextPlayerId, $gameId]);

        success(['status' => 'bidding', 'bidTurn' => $bidTurn, 'nextPlayer' => $nextPlayerId]);
    }
}
