# Three-week cash forecast

All amounts use the common fictional currency and units. The perimeter is total unrestricted cash; buckets are calculated at each week-end. Opening cash is **500**. The reconciliation is `closing cash = opening cash + receipts - payments`. The invoice is recognized in W1, but recognition is non-cash. Its collection is **700**. Payments are **100** in W1, **200** in W2, and **300** in W3. There are no other transactions or adjustments, financing, tax effects, or specified minimum-cash threshold.

## Base case: invoice collected in W2

| Week | Opening cash | Receipts | Payments | Net cash movement | Closing cash |
|---|---:|---:|---:|---:|---:|
| W1 | 500 | 0 | 100 | -100 | 400 |
| W2 | 400 | 700 | 200 | +500 | 900 |
| W3 | 900 | 0 | 300 | -300 | 600 |

## Alternative: collection delayed to W3

| Week | Opening cash | Receipts | Payments | Net cash movement | Closing cash |
|---|---:|---:|---:|---:|---:|
| W1 | 500 | 0 | 100 | -100 | 400 |
| W2 | 400 | 0 | 200 | -200 | 200 |
| W3 | 200 | 700 | 300 | +400 | 600 |

## Scenario differences: alternative minus base

| Week | Receipt difference | Payment difference | Net-movement difference | Closing-cash difference |
|---|---:|---:|---:|---:|
| W1 | 0 | 0 | 0 | 0 |
| W2 | -700 | 0 | -700 | -700 |
| W3 | +700 | 0 | +700 | 0 |

The only changed driver is settlement timing: the **700** invoice amount and W1 recognition remain unchanged. The delayed case therefore has **700 less receipts and closing cash in W2**, then **700 more receipts in W3**. Both scenarios collect the full invoice within the horizon and end with the same labeled final closing cash of **600**. Because no minimum-cash threshold was supplied, the W2 balance of **200** is a scenario difference, not a declared liquidity shortfall.
