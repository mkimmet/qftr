export class Pathfinder2D {
  static isPointInPolygon(px, py, points) {
    if (!points || points.length < 3) return false;
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;
      const intersect = ((yi > py) !== (yj > py)) &&
          (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  static isPointInObstacle(px, py, obstacle) {
    if (!obstacle) return false;
    if (obstacle.type === 'circle') {
      const dx = px - obstacle.x;
      const dy = py - obstacle.y;
      return (dx * dx + dy * dy) <= (obstacle.radius * obstacle.radius);
    } else if (obstacle.type === 'rect') {
      return px >= obstacle.x && px <= obstacle.x + obstacle.w &&
             py >= obstacle.y && py <= obstacle.y + obstacle.h;
    } else if (obstacle.type === 'polygon' && obstacle.points) {
      return this.isPointInPolygon(px, py, obstacle.points);
    }
    return false;
  }

  static clampToWalkableArea(px, py, bounds = { xMin: 50, xMax: 1230, yMin: 280, yMax: 660 }) {
    return {
      x: Math.max(bounds.xMin, Math.min(bounds.xMax, px)),
      y: Math.max(bounds.yMin, Math.min(bounds.yMax, py))
    };
  }

  static findPath(startX, startY, targetX, targetY, obstacles = [], bounds = { xMin: 50, xMax: 1230, yMin: 280, yMax: 660 }) {
    let safeTarget = this.clampToWalkableArea(targetX, targetY, bounds);

    // Only obstacles marked isSolid !== false block physical movement!
    const solidObstacles = obstacles.filter(obs => obs && obs.isSolid !== false);

    for (const obs of solidObstacles) {
      if (this.isPointInObstacle(safeTarget.x, safeTarget.y, obs)) {
        if (obs.type === 'circle') {
          const angle = Math.atan2(safeTarget.y - obs.y, safeTarget.x - obs.x);
          safeTarget.x = obs.x + Math.cos(angle) * (obs.radius + 25);
          safeTarget.y = obs.y + Math.sin(angle) * (obs.radius + 25);
        } else if (obs.type === 'rect') {
          if (safeTarget.y < obs.y + obs.h / 2) safeTarget.y = obs.y - 25;
          else safeTarget.y = obs.y + obs.h + 25;
        } else if (obs.type === 'polygon' && obs.points && obs.points.length > 0) {
          const maxY = Math.max(...obs.points.map(p => p.y));
          safeTarget.y = maxY + 25;
        }
      }
    }

    // Direct path line check against solid physical obstacles
    let isDirectPathClear = true;
    const steps = 30;
    for (let i = 1; i <= steps; i++) {
      const px = startX + (safeTarget.x - startX) * (i / steps);
      const py = startY + (safeTarget.y - startY) * (i / steps);
      for (const obs of solidObstacles) {
        if (this.isPointInObstacle(px, py, obs)) {
          isDirectPathClear = false;
          break;
        }
      }
      if (!isDirectPathClear) break;
    }

    if (isDirectPathClear) {
      return [{ x: startX, y: startY }, safeTarget];
    }

    // Generate perimeter detour waypoints around solid obstacles
    const waypoints = [];
    solidObstacles.forEach(obs => {
      if (obs.type === 'circle') {
        waypoints.push({ x: obs.x - obs.radius - 30, y: obs.y });
        waypoints.push({ x: obs.x + obs.radius + 30, y: obs.y });
        waypoints.push({ x: obs.x, y: obs.y - obs.radius - 30 });
        waypoints.push({ x: obs.x, y: obs.y + obs.radius + 30 });
      } else if (obs.type === 'rect') {
        waypoints.push({ x: obs.x - 30, y: obs.y - 30 });
        waypoints.push({ x: obs.x + obs.w + 30, y: obs.y - 30 });
        waypoints.push({ x: obs.x - 30, y: obs.y + obs.h + 30 });
        waypoints.push({ x: obs.x + obs.w + 30, y: obs.y + obs.h + 30 });
      } else if (obs.type === 'polygon' && obs.points) {
        const cx = obs.points.reduce((acc, p) => acc + p.x, 0) / obs.points.length;
        const cy = obs.points.reduce((acc, p) => acc + p.y, 0) / obs.points.length;
        obs.points.forEach(pt => {
          const angle = Math.atan2(pt.y - cy, pt.x - cx);
          waypoints.push({ x: pt.x + Math.cos(angle) * 35, y: pt.y + Math.sin(angle) * 35 });
        });
      }
    });

    let bestWaypoint = null;
    let minTotalDist = Infinity;

    for (const wp of waypoints) {
      let startClear = true;
      for (let i = 1; i <= 10; i++) {
        const px = startX + (wp.x - startX) * (i / 10);
        const py = startY + (wp.y - startY) * (i / 10);
        if (solidObstacles.some(obs => this.isPointInObstacle(px, py, obs))) { startClear = false; break; }
      }

      let targetClear = true;
      for (let i = 1; i <= 10; i++) {
        const px = wp.x + (safeTarget.x - wp.x) * (i / 10);
        const py = wp.y + (safeTarget.y - wp.y) * (i / 10);
        if (solidObstacles.some(obs => this.isPointInObstacle(px, py, obs))) { targetClear = false; break; }
      }

      if (startClear && targetClear) {
        const dist = Math.hypot(wp.x - startX, wp.y - startY) + Math.hypot(safeTarget.x - wp.x, safeTarget.y - wp.y);
        if (dist < minTotalDist) {
          minTotalDist = dist;
          bestWaypoint = wp;
        }
      }
    }

    if (bestWaypoint) {
      return [{ x: startX, y: startY }, bestWaypoint, safeTarget];
    }

    return [{ x: startX, y: startY }, safeTarget];
  }
}
