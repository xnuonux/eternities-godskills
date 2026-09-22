export function coalesce(items) {
  if (!Array.isArray(items)) throw new TypeError("items must be an array");
  const positions = new Map();
  const result = [];
  for (const item of items) {
    if (item === null || typeof item !== "object") throw new TypeError("each item must be an object");
    if (typeof item.id !== "string" || item.id.length === 0) throw new TypeError("id must be a nonempty string");
    if (typeof item.amount !== "number" || !Number.isFinite(item.amount)) throw new TypeError("amount must be a finite number");
    const key = item.id.toLowerCase();
    if (positions.has(key)) result[positions.get(key)].amount += item.amount;
    else { positions.set(key, result.length); result.push({ id: item.id, amount: item.amount }); }
  }
  return result;
}
