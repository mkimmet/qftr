export class CombatAI {
  static evaluateTurn(enemyEntity, playerEntity, gridMap) {
    const actions = [];
    let apLeft = enemyEntity.ap;

    const colDiff = Math.abs(enemyEntity.col - playerEntity.col);
    const rowDiff = Math.abs(enemyEntity.row - playerEntity.row);
    const isAdjacent = (colDiff <= 1 && rowDiff <= 1);

    // 1. If adjacent, perform melee attack (2 AP)
    if (isAdjacent && apLeft >= 2) {
      actions.push({ type: 'attack', target: playerEntity, cost: 2 });
      apLeft -= 2;
    } 
    // 2. If range <= 4 and enemy has magic spell, cast spell
    else if ((colDiff + rowDiff) <= 4 && enemyEntity.spells && enemyEntity.spells.length > 0 && apLeft >= 4) {
      actions.push({ type: 'spell', spell: enemyEntity.spells[0], target: playerEntity, cost: 4 });
      apLeft -= 4;
    }
    // 3. Otherwise move closer to player
    else {
      // Find adjacent empty tiles next to player
      const adjTiles = [
        { col: playerEntity.col + 1, row: playerEntity.row },
        { col: playerEntity.col - 1, row: playerEntity.row },
        { col: playerEntity.col, row: playerEntity.row + 1 },
        { col: playerEntity.col, row: playerEntity.row - 1 },
        { col: playerEntity.col + 1, row: playerEntity.row + 1 },
        { col: playerEntity.col - 1, row: playerEntity.row - 1 }
      ].filter(t => gridMap.getTile(t.col, t.row) && !gridMap.getTile(t.col, t.row).obstacle && (!gridMap.getTile(t.col, t.row).occupiedBy || gridMap.getTile(t.col, t.row).occupiedBy.id === enemyEntity.id));

      if (adjTiles.length > 0) {
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

          // If reached player, perform attack if AP allows (>= 2 AP)
          const newColDiff = Math.abs(finalTile.col - playerEntity.col);
          const newRowDiff = Math.abs(finalTile.row - playerEntity.row);
          if (newColDiff <= 1 && newRowDiff <= 1 && apLeft >= 2) {
            actions.push({ type: 'attack', target: playerEntity, cost: 2 });
            apLeft -= 2;
          }
        }
      }
    }

    return actions;
  }
}
