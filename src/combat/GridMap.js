export class GridMap {
  constructor(cols = 10, rows = 8) {
    this.cols = cols;
    this.rows = rows;
    this.tiles = [];
    this.resetGrid();
  }

  resetGrid() {
    this.tiles = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        // Randomize slight terrain obstacles (boulders, tree stumps)
        const isObstacle = (r === 2 && c === 4) || (r === 5 && c === 7);
        row.push({
          col: c,
          row: r,
          obstacle: isObstacle,
          occupiedBy: null // entity id or object
        });
      }
      this.tiles.push(row);
    }
  }

  getTile(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return null;
    return this.tiles[row][col];
  }

  getDistance(c1, r1, c2, r2) {
    return Math.abs(c1 - c2) + Math.abs(r1 - r2); // Manhattan distance for grid
  }

  // A* Pathfinding for grid movement
  findPath(startCol, startRow, targetCol, targetRow, maxAP = 99) {
    const startTile = this.getTile(startCol, startRow);
    const targetTile = this.getTile(targetCol, targetRow);
    if (!startTile || !targetTile || targetTile.obstacle || targetTile.occupiedBy) return [];

    const openList = [startTile];
    const closedList = new Set();
    const gScore = new Map();
    const fScore = new Map();
    const cameFrom = new Map();

    const tileKey = (t) => `${t.col},${t.row}`;

    gScore.set(tileKey(startTile), 0);
    fScore.set(tileKey(startTile), this.getDistance(startCol, startRow, targetCol, targetRow));

    while (openList.length > 0) {
      // Get tile with lowest fScore
      openList.sort((a, b) => (fScore.get(tileKey(a)) || Infinity) - (fScore.get(tileKey(b)) || Infinity));
      const current = openList.shift();

      if (current.col === targetCol && current.row === targetRow) {
        // Reconstruct path
        const path = [];
        let curr = current;
        while (cameFrom.has(tileKey(curr))) {
          path.unshift(curr);
          curr = cameFrom.get(tileKey(curr));
        }
        return path;
      }

      closedList.add(tileKey(current));

      // Neighbors (Up, Down, Left, Right)
      const neighbors = [
        this.getTile(current.col + 1, current.row),
        this.getTile(current.col - 1, current.row),
        this.getTile(current.col, current.row + 1),
        this.getTile(current.col, current.row - 1)
      ].filter(t => t && !t.obstacle && (!t.occupiedBy || (t.col === targetCol && t.row === targetRow)));

      for (const neighbor of neighbors) {
        const nKey = tileKey(neighbor);
        if (closedList.has(nKey)) continue;

        const tentativeG = (gScore.get(tileKey(current)) || 0) + 1;
        if (tentativeG > maxAP) continue; // exceed AP budget

        if (!openList.includes(neighbor)) {
          openList.push(neighbor);
        } else if (tentativeG >= (gScore.get(nKey) || Infinity)) {
          continue;
        }

        cameFrom.set(nKey, current);
        gScore.set(nKey, tentativeG);
        fScore.set(nKey, tentativeG + this.getDistance(neighbor.col, neighbor.row, targetCol, targetRow));
      }
    }

    return []; // No path found
  }

  // Get reachable tiles within AP budget
  getReachableTiles(startCol, startRow, apBudget) {
    const reachable = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (c === startCol && r === startRow) continue;
        const path = this.findPath(startCol, startRow, c, r, apBudget);
        if (path.length > 0 && path.length <= apBudget) {
          reachable.push({ col: c, row: r, cost: path.length, path });
        }
      }
    }
    return reachable;
  }
}
