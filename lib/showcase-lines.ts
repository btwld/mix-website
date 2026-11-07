export function sourceRanges(hash: string, lines: number): [number, number][] {
  return hash.replace(/^#/, '').split(',').flatMap(part => {
    const match = /^L([1-9]\d*)(?:-L([1-9]\d*))?$/.exec(part);
    if (!match) return [];
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    return start <= end && start <= lines ? [[start, Math.min(end, lines)] as [number, number]] : [];
  });
}
