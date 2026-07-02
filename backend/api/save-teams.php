<?php

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/helpers.php';

setCorsHeaders();
$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    error('Méthode non autorisée', 405);
}

$body = getJsonBody();

$db = getDB();

foreach ($body as $player) {
    $db->prepare('UPDATE players SET team=?, seat=? WHERE id=?')->execute([$player['team'], $player["seat"], $player["id"]]);
}

success();