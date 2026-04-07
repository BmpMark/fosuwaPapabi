import { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: "reservation" | "order";
  itemId: number;
  amount: number;
}

export function PaymentModal({ open, onClose, onSuccess, type, itemId, amount }: PaymentModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    if (!stripe || !elements) return;
    setLoading(true);

    try {
      // 1. Create payment intent on backend
      const endpoint = type === "reservation"
        ? "/api/payments/reservation-intent"
        : "/api/payments/order-intent";
      const idKey = type === "reservation" ? "reservationId" : "orderId";

      const res = await apiRequest("POST", endpoint, { [idKey]: itemId });
      const { clientSecret } = await res.json();

      // 2. Confirm card payment with Stripe
      const card = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: card! },
      });

      if (error) {
        toast({ title: "Payment failed", description: error.message, variant: "destructive" });
        return;
      }

      // 3. Notify backend to mark as paid
      await apiRequest("POST", "/api/payments/confirm", {
        paymentIntentId: paymentIntent!.id,
      });

      toast({ title: "Payment successful!", description: "Your payment has been processed." });
      onSuccess();
      onClose();
    } catch (err) {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Amount due: <span className="font-semibold text-foreground">GH₵{amount}</span>
          </p>
          <div className="border rounded-md p-3 bg-muted/30">
            <CardElement options={{ style: { base: { fontSize: "16px" } } }} />
          </div>
          <Button onClick={handlePay} disabled={loading || !stripe} className="w-full">
            {loading ? "Processing..." : `Pay GH₵${amount}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}