import clsx from "clsx";
import { formatDay, formatPrice } from "@/lib/labels";
import { paymentStatusLabels, type DeliveryMoney } from "@/types/supplier";

/** Paid / Partly paid / Not paid, red when the pay-by date has passed */
export function PaymentBadge({ payment, withLeft = true }: { payment: DeliveryMoney; withLeft?: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        payment.status === "paid" && "bg-emerald-50 text-emerald-800",
        payment.status !== "paid" && (payment.isOverdue ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"),
      )}
      title={payment.payByDate ? `Pay by ${formatDay(payment.payByDate)}` : undefined}
    >
      {paymentStatusLabels[payment.status]}
      {withLeft && payment.status !== "paid" && ` · ${formatPrice(payment.left)} left`}
      {payment.isOverdue && " · overdue"}
    </span>
  );
}
