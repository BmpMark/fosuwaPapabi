import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Smartphone, Loader2 } from "lucide-react";

interface PaystackPaymentProps {
  email: string;
  amount: number; // in GH₵ (e.g. 400)
  label?: string;
  metadata?: Record<string, unknown>;
  disabled?: boolean;
  onSuccess: (reference: string) => void;
  onClose?: () => void;
}

export function PaystackPayment({
  email,
  amount,
  label = "Pay with Mobile Money / Card",
  metadata,
  disabled,
  onSuccess,
  onClose,
}: PaystackPaymentProps) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!(window as any).PaystackPop) {
      alert("Paystack is not loaded. Please refresh the page and try again.");
      return;
    }

    setLoading(true);

    try {
      // Initialize on backend so secret key stays hidden
      const res = await apiRequest("POST", "/api/paystack/initialize", {
        email,
        amount,
        metadata,
      });
      const data = await res.json();

      if (!data.reference) throw new Error("Could not initialize payment");

      const handler = (window as any).PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email,
        amount: Math.round(amount * 100), // pesewas
        currency: "GHS",
        ref: data.reference,
        channels: ["mobile_money", "card"],
        label: "Fosua Papabi Hotel",
        callback: (response: { reference: string }) => {
          onSuccess(response.reference);
        },
        onClose: () => {
          setLoading(false);
          onClose?.();
        },
      });

      handler.openIframe();
    } catch (err) {
      console.error("Paystack init error:", err);
      alert("Could not start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      className="w-full gap-2"
      onClick={handlePay}
      disabled={disabled || loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Smartphone className="h-4 w-4" />
      )}
      {loading ? "Opening payment..." : label}
    </Button>
  );
}