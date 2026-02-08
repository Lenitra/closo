# Plan d'Implémentation : Système de Paiement Stripe

## Contexte

L'application Closo permet aux utilisateurs de créer des groupes photo avec un quota par défaut de 200 photos. Nous voulons permettre l'achat de 100 photos supplémentaires pour 1€ via paiement Stripe.

**Architecture actuelle :**
- Backend : FastAPI + SQLModel + PostgreSQL
- Frontend : React 19 + TypeScript + Vite
- Auth : JWT (localStorage)
- Quota : `Group.max_photos` (défaut : 200)
- Aucun système de paiement existant

## Approche Recommandée : Payment Intents API

**Pourquoi Payment Intents plutôt que Checkout ?**
- ✅ Meilleur contrôle du flux utilisateur (reste dans l'application)
- ✅ UI customisable avec Stripe Elements
- ✅ Moins de redirections (meilleure UX)
- ✅ Support des paiements 3D Secure
- ❌ Checkout : redirige vers page Stripe (UX dégradée pour paiement simple)

## Architecture Backend

### 1. Nouvelles Dépendances

**`backend/pyproject.toml`** - Ajouter :
```toml
stripe = "^11.3.0"  # SDK Stripe Python officiel
```

### 2. Configuration Stripe

**`backend/app/utils/core/config.py`** - Ajouter variables d'environnement :
```python
STRIPE_SECRET_KEY: str
STRIPE_PUBLISHABLE_KEY: str
STRIPE_WEBHOOK_SECRET: str
```

**`.env`** - Nouvelles variables :
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Entité Base de Données

**Nouveau fichier : `backend/app/entities/payment.py`**

```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional
from enum import Enum

class PaymentStatus(str, Enum):
    PENDING = "pending"              # Payment Intent créé
    PROCESSING = "processing"        # En cours de traitement
    SUCCEEDED = "succeeded"          # Paiement réussi, quota mis à jour
    FAILED = "failed"                # Échec du paiement
    CANCELED = "canceled"            # Annulé par l'utilisateur

class Payment(SQLModel, table=True):
    __tablename__ = "payment"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Références
    user_id: int = Field(foreign_key="user.id")
    group_id: int = Field(foreign_key="group.id")

    # Stripe
    stripe_payment_intent_id: str = Field(unique=True, index=True)
    stripe_client_secret: str  # Pour frontend

    # Montant et quota
    amount_cents: int = Field(default=100)  # 1€ = 100 centimes
    photos_added: int = Field(default=100)  # Photos ajoutées si succès

    # État
    status: PaymentStatus = Field(default=PaymentStatus.PENDING)

    # Audit
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(default=None)

    # Métadonnées
    error_message: Optional[str] = Field(default=None)

    # Relations
    user: Optional["User"] = Relationship()
    group: Optional["Group"] = Relationship()
```

**Pourquoi ce modèle ?**
- `stripe_payment_intent_id` : Clé unique pour réconcilier avec Stripe
- `status` : Suivi de l'état du paiement (essentiel pour webhooks)
- `photos_added` : Trace combien de photos ont été ajoutées (audit)
- `completed_at` : Timestamp de finalisation (métriques)
- `error_message` : Debug des échecs

### 4. Repository

**Nouveau fichier : `backend/app/repositories/payment_repository.py`**

```python
from app.repositories.base_repository import BaseRepository
from app.entities.payment import Payment, PaymentStatus
from sqlmodel import select, Session

class PaymentRepository(BaseRepository[Payment]):
    def __init__(self, db: Session):
        super().__init__(Payment, db)

    def get_by_payment_intent_id(self, intent_id: str) -> Payment | None:
        """Récupère un paiement par son Stripe Payment Intent ID"""
        return self.db.exec(
            select(Payment).where(Payment.stripe_payment_intent_id == intent_id)
        ).first()

    def get_group_payments(self, group_id: int) -> list[Payment]:
        """Liste tous les paiements pour un groupe"""
        return self.db.exec(
            select(Payment)
            .where(Payment.group_id == group_id)
            .where(Payment.status == PaymentStatus.SUCCEEDED)
            .order_by(Payment.created_at.desc())
        ).all()
```

### 5. Service Stripe

**Nouveau fichier : `backend/app/services/stripe_service.py`**

```python
import stripe
from app.utils.core.config import settings
from app.entities.payment import Payment, PaymentStatus
from app.repositories.payment_repository import PaymentRepository
from app.repositories.group_repository import GroupRepository
from sqlmodel import Session
from fastapi import HTTPException
from datetime import datetime

stripe.api_key = settings.STRIPE_SECRET_KEY

class StripeService:
    def __init__(self, db: Session):
        self.db = db
        self.payment_repo = PaymentRepository(db)
        self.group_repo = GroupRepository(db)

    def create_payment_intent(
        self,
        group_id: int,
        user_id: int,
        amount_cents: int = 100,
        photos_to_add: int = 100
    ) -> Payment:
        """Crée un Payment Intent Stripe et un enregistrement Payment"""

        # Vérifier que le groupe existe
        group = self.group_repo.get_by_id(group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        # Créer Payment Intent sur Stripe
        try:
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency="eur",
                metadata={
                    "group_id": group_id,
                    "user_id": user_id,
                    "photos_to_add": photos_to_add
                },
                automatic_payment_methods={"enabled": True}
            )
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")

        # Enregistrer dans la base de données
        payment = Payment(
            user_id=user_id,
            group_id=group_id,
            stripe_payment_intent_id=payment_intent.id,
            stripe_client_secret=payment_intent.client_secret,
            amount_cents=amount_cents,
            photos_added=photos_to_add,
            status=PaymentStatus.PENDING
        )

        self.payment_repo.save(payment)
        self.db.commit()

        return payment

    def handle_payment_success(self, payment_intent_id: str) -> Payment:
        """Appelé par webhook quand paiement réussit - met à jour quota"""

        # Récupérer le paiement
        payment = self.payment_repo.get_by_payment_intent_id(payment_intent_id)
        if not payment:
            raise ValueError(f"Payment not found: {payment_intent_id}")

        # Vérifier idempotence (évite double application)
        if payment.status == PaymentStatus.SUCCEEDED:
            return payment  # Déjà traité

        # Récupérer le groupe
        group = self.group_repo.get_by_id(payment.group_id)
        if not group:
            payment.status = PaymentStatus.FAILED
            payment.error_message = "Group not found"
            self.db.commit()
            raise ValueError(f"Group {payment.group_id} not found")

        # Mettre à jour le quota
        group.max_photos += payment.photos_added

        # Mettre à jour le statut du paiement
        payment.status = PaymentStatus.SUCCEEDED
        payment.completed_at = datetime.utcnow()

        self.db.commit()

        return payment

    def handle_payment_failed(self, payment_intent_id: str, error: str = None) -> Payment:
        """Appelé par webhook quand paiement échoue"""

        payment = self.payment_repo.get_by_payment_intent_id(payment_intent_id)
        if not payment:
            raise ValueError(f"Payment not found: {payment_intent_id}")

        payment.status = PaymentStatus.FAILED
        payment.error_message = error
        payment.completed_at = datetime.utcnow()

        self.db.commit()

        return payment
```

### 6. Routes API

**Nouveau fichier : `backend/app/routers/payment.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlmodel import Session
from app.utils.core.database import get_session
from app.utils.auth.dependencies import get_current_user
from app.entities.user import User
from app.entities.payment import Payment, PaymentStatus
from app.services.stripe_service import StripeService
from app.repositories.group_repository import GroupRepository
from app.repositories.groupmember_repository import GroupMemberRepository
from app.utils.core.config import settings
from pydantic import BaseModel
import stripe

router = APIRouter(prefix="/payments", tags=["payments"])

# Schémas Pydantic
class CreatePaymentRequest(BaseModel):
    group_id: int

class CreatePaymentResponse(BaseModel):
    client_secret: str
    payment_id: int
    publishable_key: str

class PaymentStatusResponse(BaseModel):
    payment_id: int
    status: PaymentStatus
    group_id: int
    photos_added: int
    new_max_photos: int

@router.post("/create-payment-intent", response_model=CreatePaymentResponse)
async def create_payment_intent(
    request: CreatePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """Crée un Payment Intent pour acheter 100 photos (1€)"""

    # Vérifier que l'utilisateur est membre du groupe
    member_repo = GroupMemberRepository(db)
    membership = member_repo.get_member(request.group_id, current_user.id)

    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    # Créer le Payment Intent
    stripe_service = StripeService(db)
    payment = stripe_service.create_payment_intent(
        group_id=request.group_id,
        user_id=current_user.id,
        amount_cents=100,  # 1€
        photos_to_add=100
    )

    return CreatePaymentResponse(
        client_secret=payment.stripe_client_secret,
        payment_id=payment.id,
        publishable_key=settings.STRIPE_PUBLISHABLE_KEY
    )

@router.get("/status/{payment_id}", response_model=PaymentStatusResponse)
async def get_payment_status(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """Vérifie le statut d'un paiement"""

    from app.repositories.payment_repository import PaymentRepository
    payment_repo = PaymentRepository(db)

    payment = payment_repo.get_by_id(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Vérifier que l'utilisateur est autorisé
    if payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Récupérer le groupe pour avoir le nouveau quota
    group_repo = GroupRepository(db)
    group = group_repo.get_by_id(payment.group_id)

    return PaymentStatusResponse(
        payment_id=payment.id,
        status=payment.status,
        group_id=payment.group_id,
        photos_added=payment.photos_added,
        new_max_photos=group.max_photos if group else 0
    )

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    db: Session = Depends(get_session)
):
    """Webhook Stripe pour traiter les événements de paiement"""

    payload = await request.body()

    # Vérifier la signature (CRITIQUE pour la sécurité)
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    stripe_service = StripeService(db)

    # Traiter l'événement
    if event.type == "payment_intent.succeeded":
        payment_intent = event.data.object
        stripe_service.handle_payment_success(payment_intent.id)

    elif event.type == "payment_intent.payment_failed":
        payment_intent = event.data.object
        error = payment_intent.last_payment_error.message if payment_intent.last_payment_error else None
        stripe_service.handle_payment_failed(payment_intent.id, error)

    return {"status": "success"}
```

## Architecture Frontend

### 1. Installation Stripe Elements

**`front/package.json`** - Ajouter :
```json
{
  "dependencies": {
    "@stripe/stripe-js": "^5.8.0",
    "@stripe/react-stripe-js": "^3.2.0"
  }
}
```

### 2. Types TypeScript

**`front/src/types/index.ts`** - Ajouter :

```typescript
export interface Payment {
  payment_id: number
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  group_id: number
  photos_added: number
  new_max_photos: number
}

export interface CreatePaymentResponse {
  client_secret: string
  payment_id: number
  publishable_key: string
}
```

### 3. Service API

**`front/src/services/api.ts`** - Ajouter méthodes :

```typescript
async createPaymentIntent(groupId: number): Promise<CreatePaymentResponse> {
  return this.request<CreatePaymentResponse>('/payments/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({ group_id: groupId })
  })
}

async getPaymentStatus(paymentId: number): Promise<Payment> {
  return this.request<Payment>(`/payments/status/${paymentId}`)
}
```

### 4. Modal de Paiement

**Nouveau fichier : `front/src/components/PaymentModal.tsx`**

```typescript
import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import api from '../services/api'
import type { CreatePaymentResponse } from '../types'

interface PaymentModalProps {
  groupId: number
  onSuccess: () => void
  onClose: () => void
}

function CheckoutForm({ paymentId, onSuccess }: { paymentId: number, onSuccess: () => void }) {
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
      redirect: 'if_required'
    })

    if (submitError) {
      setError(submitError.message || 'Payment failed')
      setProcessing(false)
    } else {
      // Vérifier le statut
      const status = await api.getPaymentStatus(paymentId)
      if (status.status === 'succeeded') {
        onSuccess()
      } else {
        setError('Payment processing...')
        setProcessing(false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />

      {error && (
        <div className="error-message" style={{ marginTop: '1rem', color: 'red' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        style={{ marginTop: '1rem', width: '100%' }}
      >
        {processing ? 'Processing...' : 'Pay 1€'}
      </button>
    </form>
  )
}

export default function PaymentModal({ groupId, onSuccess, onClose }: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<number | null>(null)
  const [stripePromise, setStripePromise] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    const initPayment = async () => {
      try {
        const response = await api.createPaymentIntent(groupId)
        setClientSecret(response.client_secret)
        setPaymentId(response.payment_id)
        setStripePromise(loadStripe(response.publishable_key))
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize payment')
        setLoading(false)
      }
    }

    initPayment()
  }, [groupId])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add 100 Photos</h2>
          <button onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {loading && <p>Loading payment...</p>}
          {error && <p className="error">{error}</p>}

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
```

### 5. Intégration dans Group.tsx

**`front/src/pages/Group.tsx`** - Modifications :

```typescript
import PaymentModal from '../components/PaymentModal'

// Dans le composant
const [showPaymentModal, setShowPaymentModal] = useState(false)

// Fonction de succès
const handlePaymentSuccess = async () => {
  setShowPaymentModal(false)
  // Recharger les données du groupe pour avoir le nouveau quota
  await fetchGroup()
  // Afficher un message de succès
  setSuccessMessage('100 photos added successfully!')
}

// Dans le JSX, ajouter bouton dans le header du groupe
<button
  className="upgrade-button"
  onClick={() => setShowPaymentModal(true)}
  title="Add 100 photos for 1€"
>
  + 100 Photos (1€)
</button>

{/* Modal de paiement */}
{showPaymentModal && (
  <PaymentModal
    groupId={groupId}
    onSuccess={handlePaymentSuccess}
    onClose={() => setShowPaymentModal(false)}
  />
)}
```

## Séquence d'Implémentation

### Phase 1 : Backend Base (Critique)
1. ✅ Ajouter dépendance `stripe` dans `pyproject.toml`
2. ✅ Créer entité `Payment` dans `backend/app/entities/payment.py`
3. ✅ Créer `PaymentRepository` dans `backend/app/repositories/payment_repository.py`
4. ✅ Ajouter variables Stripe dans `backend/app/utils/core/config.py`
5. ✅ Créer `StripeService` dans `backend/app/services/stripe_service.py`
6. ✅ Créer router `backend/app/routers/payment.py`
7. ✅ Tester avec Postman/curl (mode test Stripe)

### Phase 2 : Webhook Stripe
8. ✅ Configurer webhook dans Stripe Dashboard
9. ✅ Tester webhook avec Stripe CLI : `stripe listen --forward-to localhost:8000/api/payments/webhook`
10. ✅ Vérifier que le quota s'incrémente après paiement test

### Phase 3 : Frontend
11. ✅ Installer `@stripe/stripe-js` et `@stripe/react-stripe-js`
12. ✅ Ajouter types dans `front/src/types/index.ts`
13. ✅ Ajouter méthodes API dans `front/src/services/api.ts`
14. ✅ Créer `PaymentModal.tsx`
15. ✅ Intégrer bouton et modal dans `Group.tsx`
16. ✅ Tester avec carte test : `4242 4242 4242 4242`

### Phase 4 : Polish & Test
17. ✅ Ajouter gestion d'erreurs robuste
18. ✅ Ajouter loading states
19. ✅ Tester scénarios d'échec (carte refusée, réseau coupé)
20. ✅ Vérifier idempotence (double-clic sur "Pay")

## Complications Probables & Solutions

### 1. Webhook arrive AVANT confirmation frontend
**Problème :** Le webhook Stripe peut arriver avant que le frontend ne reçoive la confirmation.

**Solution :**
- Le webhook met à jour `payment.status = SUCCEEDED` et incrémente `max_photos`
- Le frontend poll `/payments/status/{payment_id}` après `confirmPayment()`
- Idempotence dans `handle_payment_success()` : si déjà `SUCCEEDED`, return early

### 2. Serveur crash après paiement Stripe mais avant update DB
**Problème :** Paiement réussi sur Stripe, mais `max_photos` pas mis à jour.

**Solution :**
- Le webhook Stripe retentera automatiquement (jusqu'à 3 jours)
- À la prochaine tentative, le webhook mettra à jour le quota
- Stripe garantit l'atomicité du paiement

### 3. Double-paiement (double-clic)
**Problème :** L'utilisateur clique 2 fois sur "Pay" rapidement.

**Solution :**
- Désactiver le bouton pendant `processing` (état local React)
- Stripe déduplique automatiquement les Payment Intents identiques
- Option : ajouter un délai côté backend (vérifier dernier paiement < 1 minute)

### 4. Race condition : plusieurs paiements simultanés
**Problème :** 2 utilisateurs paient en même temps pour le même groupe.

**Solution :**
- Utiliser transaction SQL pour l'update de `max_photos` :
```python
with db.begin():
    group = db.query(Group).with_for_update().get(group_id)
    group.max_photos += 100
    db.commit()
```
- Les deux paiements réussiront et ajouteront chacun 100 photos (comportement attendu)

### 5. Webhook signature invalide
**Problème :** Attaque où quelqu'un envoie de faux webhooks.

**Solution :**
- **TOUJOURS** vérifier la signature avec `stripe.Webhook.construct_event()`
- Ne JAMAIS traiter un webhook sans signature valide
- Logger les tentatives de signature invalide (sécurité)

### 6. Payment Intent reste en "processing" indéfiniment
**Problème :** Paiement 3D Secure échoue, statut bloqué.

**Solution :**
- Stripe émettra un webhook `payment_intent.payment_failed`
- Frontend peut afficher un timeout après 5 minutes
- L'utilisateur peut réessayer (créer nouveau Payment Intent)

## Stratégie de Test

### Tests Backend
```bash
# Mode test Stripe
export STRIPE_SECRET_KEY=sk_test_...

# Tester création Payment Intent
curl -X POST http://localhost:8000/api/payments/create-payment-intent \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"group_id": 1}'

# Tester webhook localement avec Stripe CLI
stripe listen --forward-to localhost:8000/api/payments/webhook
stripe trigger payment_intent.succeeded
```

### Tests Frontend
```typescript
// Cartes de test Stripe
const TEST_CARDS = {
  success: '4242 4242 4242 4242',
  declined: '4000 0000 0000 0002',
  requires3DS: '4000 0027 6000 3184',
  insufficientFunds: '4000 0000 0000 9995'
}
```

### Scénarios à tester
1. ✅ Paiement réussi → quota +100
2. ✅ Paiement refusé → quota inchangé
3. ✅ 3D Secure → authentification puis quota +100
4. ✅ Annulation modal → Payment Intent reste `pending`
5. ✅ Webhook en double → quota +100 une seule fois (idempotence)
6. ✅ Perte connexion → retry avec même Payment Intent

## Fichiers Critiques à Créer/Modifier

### Backend - Nouveaux fichiers
- `backend/app/entities/payment.py`
- `backend/app/repositories/payment_repository.py`
- `backend/app/services/stripe_service.py`
- `backend/app/routers/payment.py`

### Backend - Modifications
- `backend/app/utils/core/config.py` (variables Stripe)
- `backend/pyproject.toml` (dépendance stripe)
- `.env` (clés Stripe)

### Frontend - Nouveaux fichiers
- `front/src/components/PaymentModal.tsx`

### Frontend - Modifications
- `front/src/services/api.ts` (méthodes payment)
- `front/src/types/index.ts` (types Payment)
- `front/src/pages/Group.tsx` (bouton + modal)
- `front/package.json` (dépendances Stripe)

## Vérification End-to-End

### 1. Setup
- [ ] Variables d'environnement Stripe configurées
- [ ] Webhook Stripe configuré (Dashboard ou CLI)
- [ ] Table `payment` créée dans PostgreSQL
- [ ] Dépendances installées (backend + frontend)

### 2. Test complet
1. Se connecter en tant qu'utilisateur
2. Aller sur un groupe
3. Vérifier quota actuel (ex: 200/200)
4. Cliquer sur "+ 100 Photos (1€)"
5. Modal Stripe s'ouvre
6. Entrer carte test `4242 4242 4242 4242`
7. Cliquer "Pay 1€"
8. Modal se ferme
9. Quota mis à jour → 300/200 (200 utilisés, max 300)
10. Vérifier dans la DB : `payment.status = 'succeeded'`

### 3. Vérifications de sécurité
- [ ] Webhook signature vérifiée
- [ ] Utilisateur ne peut payer que pour ses groupes
- [ ] Montant hardcodé côté backend (pas manipulable depuis frontend)
- [ ] Logs de tous les paiements dans la DB

## Notes Finales

**Points d'attention :**
- Ne JAMAIS faire confiance au frontend pour le montant (hardcodé backend)
- TOUJOURS vérifier la signature webhook
- Tester en mode test Stripe avant production
- Ajouter logging pour debug (Sentry, CloudWatch, etc.)

**Passage en production :**
1. Remplacer `sk_test_...` par `sk_live_...`
2. Configurer webhook production dans Stripe Dashboard
3. Tester avec vraie carte (petit montant)
4. Monitorer les premiers paiements de près
