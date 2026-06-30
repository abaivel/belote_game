<?php

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error('Méthode non autorisée', 405);
}

$userId = (int)($_GET['userId'] ?? 0);
if (!$userId) error('userId requis');

$db = getDB();

$totalRoundsTakenWonStmt = $db->prepare('SELECT COUNT(*) AS total_games, 
                                                COUNT(CASE g.winner_team WHEN p.team THEN 1 ELSE NULL END) AS total_games_won, 
                                                IFNULL(SUM(p.nb_rounds_taken), 0) AS total_rounds_taken, 
                                                IFNULL(SUM(p.nb_rounds_taken_won), 0) AS total_rounds_taken_won 
                                        FROM players p, games g 
                                        WHERE p.game_id = g.Id 
                                        AND p.user_id = ?');
$totalRoundsTakenWonStmt->execute([$userId]);
$totalRoundsTakenWon = $totalRoundsTakenWonStmt->fetch();

$totalRoundsTakenWithEachTrumpStmt = $db->prepare("SELECT r.trump_suit, 
                                                    COUNT(*) AS total_taken, 
                                                    COUNT(CASE p.team 
                                                            WHEN 1 
                                                            THEN (CASE 
                                                                    WHEN team1_score>team2_score 
                                                                    THEN 1 
                                                                    ELSE NULL 
                                                                    END) 
                                                            ELSE (CASE 
                                                                    WHEN team1_score<team2_score 
                                                                    THEN 1 
                                                                    ELSE NULL 
                                                                    END) 
                                                            END) AS nb_victory 
                                                    FROM rounds r, players p 
                                                    WHERE r.game_id=p.game_id
                                                    AND p.user_id=? 
                                                    AND r.trump_player_id=p.id 
                                                    GROUP BY r.trump_suit");

$totalRoundsPlayedStmt = $db->prepare('SELECT IFNULL(COUNT(*), 0) AS total_rounds,
                                                AVG(CASE r.trump_player_id WHEN p.id THEN (
                                                CASE p.team 
                                                    WHEN 1 
                                                    THEN team1_score
                                                    ELSE team2_score
                                                    END) ELSE NULL END) AS avg_points_rounds,
                                                IFNULL(COUNT(CASE r.belote_player_id WHEN p.id THEN 1 ELSE NULL END),0) AS nb_belote,
                                                IFNULL(COUNT(CASE r.trump_player_id WHEN p.id THEN 1 ELSE NULL END),0) AS total_rounds_taken,
                                                IFNULL(COUNT(CASE WHEN trump_player.team <> p.team THEN 1 ELSE NULL END),0) AS total_rounds_taken_by_other_team,
                                                IFNULL(COUNT(CASE r.trump_player_id 
                                                            WHEN p.id 
                                                            THEN (CASE p.team 
                                                                    WHEN 1 
                                                                    THEN (CASE 
                                                                            WHEN team1_score>team2_score 
                                                                            THEN 1 
                                                                            ELSE NULL 
                                                                            END) 
                                                                    ELSE (CASE 
                                                                            WHEN team1_score<team2_score 
                                                                            THEN 1 
                                                                            ELSE NULL 
                                                                            END) 
                                                                    END) 
                                                            ELSE NULL 
                                                            END),0) AS total_rounds_taken_won,
                                                IFNULL(COUNT(CASE 
                                                            WHEN trump_player.team <> p.team
                                                            THEN (CASE p.team 
                                                                    WHEN 1 
                                                                    THEN (CASE 
                                                                            WHEN team1_score>team2_score 
                                                                            THEN 1 
                                                                            ELSE NULL 
                                                                            END) 
                                                                    ELSE (CASE 
                                                                            WHEN team1_score<team2_score 
                                                                            THEN 1 
                                                                            ELSE NULL 
                                                                            END) 
                                                                    END) 
                                                            ELSE NULL 
                                                            END),0) AS total_rounds_taken_by_other_team_won
                                        FROM rounds r
                                        JOIN players p
                                            ON p.game_id = r.game_id
                                        LEFT JOIN players trump_player
                                            ON trump_player.id = r.trump_player_id
                                        WHERE p.user_id = ?');
$totalRoundsPlayedStmt->execute([$userId]);
$totalRoundsPlayed = $totalRoundsPlayedStmt->fetch();

$totalGamesWithEachPlayersStmt = $db->prepare("SELECT p2.user_id, 
                                                        u.pseudo, 
                                                        COUNT(CASE g.winner_team WHEN p.team THEN 1 ELSE NULL END) AS nb_victory, 
                                                        COUNT(CASE g.winner_team WHEN p.team THEN NULL ELSE 1 END) AS nb_fail, 
                                                        COUNT(CASE g.winner_team WHEN p.team THEN 1 ELSE NULL END)/COUNT(g.id) AS ratio 
                                                        FROM players p 
                                                        JOIN games g 
                                                        ON g.id = p.game_id 
                                                        JOIN players p2 
                                                        ON p2.game_id=g.id 
                                                        AND p.team=p2.team 
                                                        AND p.id!=p2.id 
                                                        JOIN users u 
                                                        ON u.id=p2.user_id 
                                                        WHERE g.status='finished' 
                                                        AND p.user_id=? 
                                                        GROUP BY p2.user_id 
                                                        ORDER BY ratio");
$totalGamesWithEachPlayersStmt->execute([$userId]);
$totalGamesWithEachPlayers = $totalGamesWithEachPlayersStmt->fetchAll();
    

$playersWithHighestAndLowestVictory = [];
if (count($totalGamesWithEachPlayers) > 0) {
    $playersWithHighestAndLowestVictory = ['best' => $totalGamesWithEachPlayers[count($totalGamesWithEachPlayers) -1],
                                            'worst' => $totalGamesWithEachPlayers[0]
                                            ];
}

$totalRoundsTakenWithEachTrumpStmt = $db->prepare("SELECT r.trump_suit, 
                                                    COUNT(*) AS total_taken, 
                                                    COUNT(CASE p.team 
                                                            WHEN 1 
                                                            THEN (CASE 
                                                                    WHEN team1_score>team2_score 
                                                                    THEN 1 
                                                                    ELSE NULL 
                                                                    END) 
                                                            ELSE (CASE 
                                                                    WHEN team1_score<team2_score 
                                                                    THEN 1 
                                                                    ELSE NULL 
                                                                    END) 
                                                            END) AS nb_victory 
                                                    FROM rounds r, players p 
                                                    WHERE r.game_id=p.game_id
                                                    AND p.user_id=? 
                                                    AND r.trump_player_id=p.id 
                                                    GROUP BY r.trump_suit");
$totalRoundsTakenWithEachTrumpStmt->execute([$userId]);
$totalRoundsTakenWithEachTrump = $totalRoundsTakenWithEachTrumpStmt->fetchAll();

$avgPlayerNbCardsWhenTakenStmt = $db->prepare("SELECT AVG(nb_cards_trump) 
                                                FROM (SELECT r.id, COUNT(c.id) AS nb_cards_trump 
                                                        FROM rounds r 
                                                        JOIN players p 
                                                        ON p.game_id = r.game_id 
                                                        JOIN ( SELECT id, player_id, suit, round_id, ROW_NUMBER() 
                                                                OVER (PARTITION BY round_id ORDER BY id) AS rn FROM cards ) c 
                                                        ON c.player_id = p.id 
                                                        AND c.suit = r.trump_suit 
                                                        AND c.round_id = r.id 
                                                        WHERE p.user_id = ? 
                                                        AND r.trump_player_id = p.id 
                                                        AND c.rn <= 21 
                                                        GROUP BY r.id) AS t;");
$avgPlayerNbCardsWhenTakenStmt->execute([$userId]);
$avgPlayerNbCardsWhenTaken = $avgPlayerNbCardsWhenTakenStmt->fetchColumn();

$totalPlayerTakenCardValueStmt = $db->prepare("SELECT c.value, COUNT(c.id) AS nb_cards_trump 
                                                        FROM rounds r 
                                                        JOIN players p 
                                                        ON p.game_id = r.game_id 
                                                        JOIN ( SELECT id, player_id, value, suit, round_id, ROW_NUMBER() 
                                                                OVER (PARTITION BY round_id ORDER BY id) AS rn FROM cards ) c 
                                                        ON c.player_id = p.id 
                                                        AND c.suit = r.trump_suit 
                                                        AND c.round_id = r.id 
                                                        WHERE p.user_id = ? 
                                                        AND r.trump_player_id = p.id 
                                                        AND c.rn <= 21 
                                                        GROUP BY c.value
                                                        ORDER BY nb_cards_trump DESC 
                                                        LIMIT 1");
$totalPlayerTakenCardValueStmt->execute([$userId]);
$totalPlayerTakenCardValue = $totalPlayerTakenCardValueStmt->fetch();


$groupingScoresUserStmt = $db->prepare("SELECT ((CASE p.team 
                                                    WHEN 1 
                                                    THEN team1_score
                                                    ELSE team2_score
                                                    END) DIV 10) * 10 AS dizaine,
                                                COUNT(*) AS nb_rounds
                                        FROM rounds r, players p
                                        WHERE r.trump_player_id = p.id
                                        AND ((p.team=1 AND r.team1_score>r.team2_score) OR (p.team=2 AND r.team1_score<r.team2_score))
                                        AND p.user_id=?
                                        GROUP BY dizaine");
$groupingScoresUserStmt->execute([$userId]);
$groupingScoresUser= $groupingScoresUserStmt->fetchAll();


// calcul du profil de personnalité
$user_profil="";

if ($totalRoundsPlayed["total_rounds"]>0){
    $proportionRoundsTaken = $totalRoundsPlayed["total_rounds_taken"]/$totalRoundsPlayed["total_rounds"];
    $proportionRoundsTakenWon = $totalRoundsPlayed["total_rounds_taken_won"]/$totalRoundsPlayed["total_rounds_taken"];
    $proportionRoundsNotTakenWon = $totalRoundsPlayed["total_rounds_taken_by_other_team_won"]/$totalRoundsPlayed["total_rounds_taken_by_other_team"];

    $nbRoundsWonWithLessThan90Points = 0;
    $nbRoundsWonWithMoreThan140Points = 0;
    foreach ($groupingScoresUser as $grouping) {
        if ($grouping["dizaine"]==80){
            $nbRoundsWonWithLessThan90Points = $grouping["nb_rounds"];
        }if ($grouping["dizaine"]>=140){
            $nbRoundsWonWithMoreThan140Points += $grouping["nb_rounds"];
            break;
        }
    }
    $proportionRoundsWonWithLessThan90Points = $nbRoundsWonWithLessThan90Points/$totalRoundsPlayed["total_rounds_taken_won"];
    $proportionRoundsWonWithMoreThan140Points = $nbRoundsWonWithMoreThan140Points/$totalRoundsPlayed["total_rounds_taken_won"];

    $seuils = [
        'Stratège' => [0.1, 0.9],
        'Flambeur' => 0.6,
        'Défenseur' => 0.4,
        'Pyromane' => 0.5,
        'Chanceux' => [3, 0.75],
        'Voleur' => 0.6
    ];

    $profils = [
        'Stratège'=>$seuils['Stratège'][0]-$proportionRoundsTaken+$proportionRoundsTakenWon-$seuils['Stratège'][1],
        'Flambeur'=>$proportionRoundsWonWithMoreThan140Points-$seuils['Flambeur'],
        'Défenseur'=>$proportionRoundsNotTakenWon-$seuils['Défenseur'],
        'Pyromane' =>$proportionRoundsTaken-$seuils['Pyromane'],
        'Chanceux'=>$seuils['Chanceux'][0]-$avgPlayerNbCardsWhenTaken + $proportionRoundsTakenWon-$seuils['Chanceux'][1],
        'Voleur'=>$proportionRoundsWonWithLessThan90Points-$seuils['Voleur'],
    ];
    $user_profil_value = -100;
    foreach($profils as $key => $value) {
        if ($user_profil_value < $value) {
            $user_profil_value = $value;
            $user_profil = $key;
        }
    }
}


success(['stats' => [
    'total_games'=> $totalRoundsTakenWon["total_games"],
    'total_games_won'=> $totalRoundsTakenWon['total_games_won'],
    'total_rounds' => $totalRoundsPlayed["total_rounds"],
    'total_rounds_taken'=> $totalRoundsPlayed["total_rounds_taken"],
    "total_rounds_taken_won"=> $totalRoundsPlayed["total_rounds_taken_won"],
    'total_rounds_taken_by_other_team'=> $totalRoundsPlayed["total_rounds_taken_by_other_team"],
    "total_rounds_taken_by_other_team_won"=> $totalRoundsPlayed["total_rounds_taken_by_other_team_won"],
    "best_and_worst_players"=>$playersWithHighestAndLowestVictory,
    'total_belote_re'=> $totalRoundsPlayed['nb_belote'],
    'total_with_each_trump'=> $totalRoundsTakenWithEachTrump,
    'avg_nb_trump_cards_when_taken'=>$avgPlayerNbCardsWhenTaken,
    'trump_most_taken_card'=> $totalPlayerTakenCardValue,
    'user_profil'=> $user_profil,
]]);