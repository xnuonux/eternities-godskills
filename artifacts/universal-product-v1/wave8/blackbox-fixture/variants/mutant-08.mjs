export function coalesce(items) {
  if (!Array.isArray(items)) throw new TypeError("items must be an array");
  const positions = new Map();
  const result = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (i === 0) {
      if (item === null || typeof item !== "object") throw new TypeError("each item must be an object");
      if (typeof item.id !== "string" || item.id.length === 0) throw new TypeError("id must be a nonempty string");
      if (typeof item.amount !== "number" || !Number.isFinite(item.amount)) throw new TypeError("amount must be a finite number");
    }
    if (positions.has(item.id)) result[positions.get(item.id)].amount += item.amount;
    else { positions.set(item.id, result.length); result.push({ id: item.id, amount: item.amount }); }
  }
  return result;
}
