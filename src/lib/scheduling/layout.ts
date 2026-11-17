export interface LayoutItem {
  id: string;
  start: number;
  end: number;
}

export interface LaneInfo {
  lane: number;
  lanes: number;
}

/**
 * Side-by-side lanes for overlapping items in one column. Items that overlap (directly or through
 * a chain) share a cluster; each cluster is split into as many lanes as its peak concurrency.
 */
export function layoutLanes(items: readonly LayoutItem[]): Map<string, LaneInfo> {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const result = new Map<string, LaneInfo>();
  let cluster: Array<{ id: string; lane: number }> = [];
  let laneEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    cluster.forEach(({ id, lane }) => result.set(id, { lane, lanes: laneEnds.length }));
    cluster = [];
    laneEnds = [];
  };

  for (const item of sorted) {
    if (item.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.end);
    } else {
      laneEnds[lane] = item.end;
    }
    cluster.push({ id: item.id, lane });
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  flush();
  return result;
}
