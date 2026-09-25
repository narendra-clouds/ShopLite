# ShopLite Cancellation & Revenue Rules

## Customer cancellation
Customers can cancel their own orders while the order is in `PLACED`, `CONFIRMED`, or `PACKED` status.

Once an order is `SHIPPED` or `DELIVERED`, customer cancellation is blocked.

Cancelling an order restores the reserved product quantities to Product Service inventory.

## Admin cancellation
Admins can cancel an eligible order from the Admin Orders section. The same inventory restoration rules apply.

A cancelled order cannot be reopened through the status selector.

## Revenue
ShopLite now shows **Net Sales**, which excludes cancelled orders.

The dashboard also shows **Cancelled Value** separately so the owner can see how much order value was cancelled without counting it as net sales.

Because ShopLite does not have a real payment gateway yet, cancellation does not perform a real monetary refund. A future Payment Service can add payment/refund states when payments are introduced.
