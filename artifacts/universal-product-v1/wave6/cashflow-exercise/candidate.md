# Three-week operating cash forecast

This is a small fictional-data forecast, not investment advice or an account
instruction. Amounts use the supplied common currency and units. The perimeter
opens with total cash of 1,200, of which 200 remains restricted and unavailable
for operating payments. Therefore opening unrestricted cash is 1,000. I define
headroom as closing unrestricted cash minus the requested floor of 150; positive
headroom is above the floor.

## Event and disposition ledger

Signs are from the perimeter's perspective: `+` is an external receipt and `-`
is an external payment.

| ID | Event and amount | Recognition/acquisition | Base settlement | Downside settlement | Cash disposition |
|---|---|---|---|---|---|
| A | Customer invoice `+900` | W1 | W2 | W4 | External receipt; downside receipt is outside the displayed horizon |
| B | Old customer invoice `+300` | Before W1 | W1 | W1 | External receipt |
| R | Rent `-400` | W1 | W1 | W1 | External operating payment |
| P1 | Payroll `-500` | W1 | W1 | W1 | External operating payment |
| P2 | Payroll `-500` | W2 | W2 | W2 | External operating payment |
| P3 | Payroll `-500` | W3 | W3 | W3 | External operating payment |
| E | Equipment purchase `-250` | Asset acquired W3 | W3 | W3 | External investing payment |
| D | Depreciation entry `100` | W2 | No cash settlement | No cash settlement | Non-cash entry; excluded from receipts and payments |
| T | Internal transfer `200` | No revenue/expense | W2 | W2 | Internal to the perimeter; no total-cash or restriction change |

## Base case

The tables are end-of-week calculations. Receipts contain only external cash
receipts; external payments contain rent, payroll and equipment. Closing total
cash equals opening total cash plus receipts less external payments. Closing
unrestricted cash equals closing total cash less the fixed restricted 200.

| Week | Opening total cash | Receipts | External payments | Closing total cash | Closing unrestricted cash | Headroom vs 150 |
|---|---:|---:|---:|---:|---:|---:|
| W1 | 1,200 | 300 (B) | 900 (R+P1) | 600 | 400 | +250 |
| W2 | 600 | 900 (A) | 500 (P2) | 1,000 | 800 | +650 |
| W3 | 1,000 | 0 | 750 (P3+E) | 250 | 50 | -100 |

The base case is 100 below the stated unrestricted floor at W3, although total
cash remains positive at 250. The end-of-week view does not reveal any
intraweek low point.

## Downside case

The sole changed driver is A's collection moving from W2 to W4. No haircut,
recognition change, borrowing or other event is introduced.

| Week | Opening total cash | Receipts | External payments | Closing total cash* | Closing unrestricted cash* | Headroom vs 150* |
|---|---:|---:|---:|---:|---:|---:|
| W1 | 1,200 | 300 (B) | 900 (R+P1) | 600 | 400 | +250 |
| W2 | 600 | 0 | 500 (P2) | 100 | -100 | -250 |
| W3 | 100 | 0 | 750 (P3+E) | -650 | -850 | -1,000 |

`*` A negative result is a modeled residual if every listed settlement is
imposed with no financing or payment deferral; it is not a claimed negative
bank balance or evidence that a payment cleared. In particular, W2 has only
400 modeled unrestricted cash before P2 but a 500 payment, so preserving the
restricted 200 is not feasible under the supplied schedule. The unspecified
unpaid-payment sequence remains unresolved.

## Scenario deltas and outstanding items

Downside minus base is zero in W1. In W2 and W3, the receipt delta is -900 and
the closing-total-cash, closing-unrestricted-cash and headroom deltas are each
-900. The delay changes timing only; it does not change recognized revenue or
total collectibility in the supplied assumptions.

At the end of W3, downside event A (`900`) remains outstanding and is scheduled
for W4, beyond the displayed horizon. No other listed cash event is
out-of-horizon in the base case. D has no cash settlement and T is not a
perimeter cash inflow or outflow. W4 events other than A are not supplied.

## Assumptions, evidence limits and next checks

- The 200 restriction stays fixed throughout; all listed external receipts and
  payments are treated as affecting unrestricted cash because no account-level
  allocation is supplied. T does not release or consume restricted cash.
- Buckets are ordered and measured only at week end. Intraweek timing, taxes,
  fees, other events and exact account balances are unknown.
- The 1,000 credit line is undrawn and its availability is unconfirmed, so it
  is excluded. No scenario probability is assigned.
- Check A's collection date and collectibility, the supplied payment dates,
  account-level restricted balances, and whether the floor is tested
  continuously or only at week end.
- Confirm the credit-line commitment, conditions, lead time and usable amount
  before treating it as liquidity; extend the ladder through W4 with all other
  events before deciding how any modeled shortfall would be handled.
