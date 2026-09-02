export class CombatAI {
  static evaluateTurn(enemyEntity, playerEntity, gridMap) {
    const actions = [];
    let apLeft = enemyEntity.ap;

    // Temporary copy of position for AI path simulation
    let simCol = enemyEntity.col;
    let simRow = enemyEntity.row;

    while (apLeft >= 1) {
      const colDiff = Math.abs(simCol - playerEntity.col);
      const rowDiff = Math.abs(simRow - playerEntity.row);
      const isAdjacent = (colDiff <= 1 && rowDiff <= 1);

      // 1. If adjacent and has 2 AP, attack!
      if (isAdjacent && apLeft >= 2) {
        actions.push({ type: 'attack', target: playerEntity, cost: 2 });
        apLeft -= 2;
        break; // Finished turn after attack
      }
      // 2. If range <= 4 and has magic spell, cast spell!
      else if ((colDiff + rowDiff) <= 4 && enemyEntity.spells && enemyEntity.spells.length > 0 && apLeft >= 4) {
        actions.push({ type: 'spell', spell: enemyEntity.spells[0], target: playerEntity, cost: 4 });
        apLeft -= 4;
        break;
      }
      // 3. Move 1 step closer to player
      else {
        const neighbors = [
          { col: simCol + 1, row: simRow },
          { col: simCol - 1, row: simRow },
          { col: simCol, row: simRow + 1 },
          { col: simCol, row: simRow - 1 },
          { col: simCol + 1, row: simRow + 1 },
          { col: simCol - 1, row: simRow - 1 },
          { col: simCol + 1, row: simRow - 1 },
          { col: simCol - 1, row: simRow + 1 }
        ];

        let bestStep = null;
        let bestDist = Math.hypot(simCol - playerEntity.col, simRow - playerEntity.row);

        for (const n of neighbors) {
          const tile = gridMap.getTile(n.col, n.row);
          if (tile && !tile.obstacle && (!tile.occupiedBy || tile.occupiedBy.id === enemyEntity.id || tile.occupiedBy === enemyEntity)) {
            const dist = Math.hypot(n.col - playerEntity.col, n.row - playerEntity.row);
            if (dist < bestDist) {
              bestDist = dist;
              bestStep = n;
            }
          }
        }

        if (bestStep) {
          actions.push({ type: 'move', targetTile: bestStep, cost: 1 });
          simCol = bestStep.col;
          simRow = bestStep.row;
          apLeft -= 1;
        } else {
          break; // No valid path step available
        }
      }
    }

    return actions;
  }
}
