export class CombatAI {
  static evaluateTurn(enemyEntity, playerEntity, gridMap) {
    const actions = [];
    let apLeft = enemyEntity.ap;

    const dist = gridMap.getDistance(enemyEntity.col, enemyEntity.row, playerEntity.col, playerEntity.row);

    // 1. If adjacent (dist === 1), perform melee attack
    if (dist === 1 && apLeft >= 3) {
      actions.push({ type: 'attack', target: playerEntity, cost: 3 });
      apLeft -= 3;
    } 
    // 2. If range <= 4 and enemy has magic spell, cast spell
    else if (dist <= 4 && enemyEntity.spells && enemyEntity.spells.length > 0 && apLeft >= 4) {
      actions.push({ type: 'spell', spell: enemyEntity.spells[0], target: playerEntity, cost: 4 });
      apLeft -= 4;
    }
    // 3. Otherwise move closer to player
    else {
      // Find tile adjacent to player
      const adjTiles = [
        { col: playerEntity.col + 1, row: playerEntity.row },
        { col: playerEntity.col - 1, row: playerEntity.row },
        { col: playerEntity.col, row: playerEntity.row + 1 },
        { col: playerEntity.col, row: playerEntity.row - 1 }
      ].filter(t => gridMap.getTile(t.col, t.row) && !gridMap.getTile(t.col, t.row).obstacle && !gridMap.getTile(t.col, t.row).occupiedBy);

      if (adjTiles.length > 0) {
        // Find best path
        let shortestPath = null;
        for (const target of adjTiles) {
          const path = gridMap.findPath(enemyEntity.col, enemyEntity.row, target.col, target.row, apLeft);
          if (path.length > 0 && (!shortestPath || path.length < shortestPath.length)) {
            shortestPath = path;
          }
        }

        if (shortestPath && shortestPath.length > 0) {
          const moveSteps = shortestPath.slice(0, apLeft);
          const finalTile = moveSteps[moveSteps.length - 1];
          actions.push({ type: 'move', targetTile: finalTile, path: moveSteps, cost: moveSteps.length });
          apLeft -= moveSteps.length;

          // If reached player, perform attack if AP allows
          const newDist = gridMap.getDistance(finalTile.col, finalTile.row, playerEntity.col, playerEntity.row);
          if (newDist === 1 && apLeft >= 3) {
            actions.push({ type: 'attack', target: playerEntity, cost: 3 });
            apLeft -= 3;
          }
        }
      }
    }

    return actions;
  }
}
