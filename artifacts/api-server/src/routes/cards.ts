import { Router, type IRouter } from "express";
import { db, cardsTable, accountsTable, usersTable, notificationsTable, featureFlagsTable } from "@workspace/db";
import { readKeys } from "../lib/gateway-keys";
import { eq, and } from "drizzle-orm";
import { CreateCardBody, FreezeCardBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { generateId } from "../lib/auth";

const router: IRouter = Router();

router.get("/cards", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const cards = await db.select().from(cardsTable).where(eq(cardsTable.userId, req.userId!));
  res.json(cards.map(c => ({ ...c, color: c.color ?? null })));
});

router.post("/cards", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { accountId, type, color } = parsed.data;

  // 1. Simulate Stripe Issuing Sandbox Gateway status check
  try {
    const [stripeFlag] = await db.select().from(featureFlagsTable)
      .where(eq(featureFlagsTable.key, "sandbox-stripe-online")).limit(1);
    const isStripeOnline = stripeFlag ? stripeFlag.isEnabled : true;
    if (!isStripeOnline) {
      res.status(503).json({ error: "Stripe Issuing Error: Simulation of service outage is active." });
      return;
    }
  } catch (err) {
    // Fallback if flag table isn't fully ready
  }

  try {
    const [userRow] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    if (!userRow) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const keys = readKeys();
    let externalCardId = generateId();
    let cardLast4 = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date();
    let expiryMonth = String(now.getMonth() + 1).padStart(2, "0");
    let expiryYear = (now.getFullYear() + 4).toString();
    const cardHolder = `${userRow.firstName} ${userRow.lastName}`.toUpperCase();

    // 2. Conditional integrations with Sudo and Bridgecard
    if (keys.sudoApiKey) {
      try {
        const isLive = keys.sudoApiKey.startsWith("sudo_live");
        const baseUrl = isLive ? "https://api.sudo.cards" : "https://api.sandbox.sudo.cards";
        
        // A. Create customer in Sudo
        const customerRes = await fetch(`${baseUrl}/customers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${keys.sudoApiKey}`
          },
          body: JSON.stringify({
            type: "individual",
            individual: {
              firstName: userRow.firstName,
              lastName: userRow.lastName,
              phone: userRow.phone,
              email: userRow.email,
            },
            status: "active"
          })
        });
        
        let customerData: any = {};
        if (customerRes.ok) {
          customerData = await customerRes.json();
        } else {
          const errData = await customerRes.json().catch(() => ({}));
          console.warn("Sudo customer creation failed/warned:", errData);
        }
        
        const customerId = customerData.id || "mock_sudo_customer_id";

        // B. Create card under that customer
        const cardRes = await fetch(`${baseUrl}/cards`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${keys.sudoApiKey}`
          },
          body: JSON.stringify({
            customerId,
            type: type === "physical" ? "physical" : "virtual",
            brand: "Mastercard",
            currency: "NGN",
            status: "active"
          })
        });

        if (cardRes.ok) {
          const cardData = (await cardRes.json()) as any;
          externalCardId = cardData.id || externalCardId;
          cardLast4 = cardData.last4 || cardLast4;
          expiryMonth = cardData.expiryMonth || expiryMonth;
          expiryYear = cardData.expiryYear || expiryYear;
          console.log(`[Sudo] Successfully issued card ending in ${cardLast4}`);
        } else {
          const err = await cardRes.json().catch(() => ({}));
          console.error("Sudo Card issuance failed:", err);
        }
      } catch (err) {
        console.error("Sudo Integration error, falling back to local simulation:", err);
      }
    } else if (keys.bridgecardApiKey) {
      try {
        const isLive = keys.bridgecardApiKey.startsWith("bridge_live");
        const baseUrl = isLive ? "https://api.bridgecard.co/v1" : "https://api.bridgecard.co/v1/issuing/sandbox";
        
        // A. Create cardholder
        const cardholderRes = await fetch(`${baseUrl}/cardholder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": `Bearer ${keys.bridgecardApiKey}`
          },
          body: JSON.stringify({
            first_name: userRow.firstName,
            last_name: userRow.lastName,
            email: userRow.email,
            phone_number: userRow.phone,
          })
        });
        
        let cardholderData: any = {};
        if (cardholderRes.ok) {
          cardholderData = await cardholderRes.json();
        }
        
        const cardholderId = cardholderData.cardholder_id || "mock_bridgecard_holder_id";

        // B. Register/Create card
        const cardRes = await fetch(`${baseUrl}/cards/register_card`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": `Bearer ${keys.bridgecardApiKey}`
          },
          body: JSON.stringify({
            cardholder_id: cardholderId,
            card_type: type === "physical" ? "physical" : "virtual",
            card_brand: "Mastercard"
          })
        });

        if (cardRes.ok) {
          const cardData = (await cardRes.json()) as any;
          externalCardId = cardData.card_id || externalCardId;
          cardLast4 = cardData.last_4 || cardLast4;
          expiryMonth = cardData.expiry_month || expiryMonth;
          expiryYear = cardData.expiry_year || expiryYear;
          console.log(`[Bridgecard] Successfully issued card ending in ${cardLast4}`);
        } else {
          const err = await cardRes.json().catch(() => ({}));
          console.error("Bridgecard Card issuance failed:", err);
        }
      } catch (err) {
        console.error("Bridgecard Integration error, falling back to local simulation:", err);
      }
    }

    // 3. Write card to database inside transaction
    const card = await db.transaction(async (tx) => {
      const [account] = await tx.select().from(accountsTable)
        .where(and(eq(accountsTable.id, accountId), eq(accountsTable.userId, req.userId!)))
        .for("update");
      if (!account) {
        throw new Error("Account not found");
      }

      const [insertedCard] = await tx.insert(cardsTable).values({
        id: externalCardId,
        userId: req.userId!,
        accountId,
        type: type ?? "virtual",
        last4: cardLast4,
        expiryMonth,
        expiryYear,
        status: "active",
        cardHolder,
        color: color ?? "#300010",
      }).returning();

      // 4. Log card issuance notification
      await tx.insert(notificationsTable).values({
        id: generateId(),
        userId: req.userId!,
        title: `${type === "physical" ? "Physical" : "Virtual"} Card Issued`,
        message: `Your new card ending in ${cardLast4} has been generated successfully.`,
        type: "card",
      });

      return insertedCard;
    });

    res.status(201).json({ ...card, color: card.color ?? null });
  } catch (error: any) {
    if (error.message === "Account not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.get("/cards/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [card] = await db.select().from(cardsTable)
    .where(and(eq(cardsTable.id, raw), eq(cardsTable.userId, req.userId!)));
  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }
  res.json({ ...card, color: card.color ?? null });
});

router.patch("/cards/:id/freeze", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = FreezeCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [card] = await db.update(cardsTable)
    .set({ status: parsed.data.frozen ? "frozen" : "active" })
    .where(and(eq(cardsTable.id, raw), eq(cardsTable.userId, req.userId!)))
    .returning();

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }
  res.json({ ...card, color: card.color ?? null });
});

export default router;
