/** "1 prenda" / "3 prendas". */
export function textoPrendas(n: number): string {
  return `${n} ${n === 1 ? "prenda" : "prendas"}`;
}