import { useState, useEffect } from 'react'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { api } from '../services/api'

interface PaymentModalProps {
  groupId: number
  onSuccess: () => void
  onClose: () => void
}

function CheckoutForm({ paymentId, onSuccess }: { paymentId: number; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    })

    if (submitError) {
      setError(submitError.message || 'Le paiement a echoue')
      setProcessing(false)
    } else {
      // Poll status to confirm
      try {
        const status = await api.getPaymentStatus(paymentId)
        if (status.status === 'succeeded') {
          onSuccess()
        } else {
          // Webhook may not have arrived yet, wait and retry
          await new Promise((r) => setTimeout(r, 2000))
          const retryStatus = await api.getPaymentStatus(paymentId)
          if (retryStatus.status === 'succeeded') {
            onSuccess()
          } else {
            onSuccess() // Payment confirmed by Stripe, webhook will update DB
          }
        }
      } catch {
        onSuccess() // Payment was confirmed by Stripe
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />

      {error && (
        <div className="modal-error" style={{ marginTop: '1rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn btn-primary"
        style={{ marginTop: '1rem', width: '100%' }}
      >
        {processing ? 'Traitement en cours...' : 'Payer 1\u20AC'}
      </button>
    </form>
  )
}

export default function PaymentModal({ groupId, onSuccess, onClose }: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<number | null>(null)
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initPayment = async () => {
      try {
        const response = await api.createPaymentIntent(groupId)
        setClientSecret(response.client_secret)
        setPaymentId(response.payment_id)
        setStripePromise(loadStripe(response.publishable_key))
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de l\'initialisation du paiement')
        setLoading(false)
      }
    }

    initPayment()
  }, [groupId])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-settings" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ajouter 100 photos</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)' }}>
            Ajoutez 100 photos supplementaires a votre groupe pour seulement 1{'\u20AC'}.
          </p>

          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Chargement du paiement...</p>
            </div>
          )}

          {error && (
            <div className="modal-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {clientSecret && stripePromise && paymentId && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm paymentId={paymentId} onSuccess={onSuccess} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  )
}
