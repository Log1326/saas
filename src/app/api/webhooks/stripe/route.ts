import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import db from '@/db'

export async function POST(req: Request) {
	const body = await req.text()
	const signature = headers().get('Stripe-Signature') ?? ''
	let event: Stripe.Event
	try {
		event = stripe.webhooks.constructEvent(
			body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET || ''
		)
	} catch (err) {
		return new Response(
			`Webhook Error :${err instanceof Error ? err.message : 'unknown error'}`,
			{ status: 400 }
		)
	}
	const session = event.data.object as Stripe.Checkout.Session
	if (!session?.metadata?.userId) return new Response(null, { status: 200 })
	if (event.type === 'checkout.session.completed') {
		const subscription = await stripe.subscriptions.retrieve(
			session.subscription as string
		)
		await db.user.update({
			where: { id: session.metadata.userId },
			data: {
				stripeSubscriptionId: subscription.id,
				stripeCustomerId: subscription.customer as string,
				stripePriceId: subscription.items.data[0]?.price.id,
				stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
			}
		})
	}
	if (event.type === 'invoice.payment_succeeded') {
		const subscription = await stripe.subscriptions.retrieve(
			session.subscription as string
		)
		await db.user.update({
			where: { stripeSubscriptionId: subscription.id },
			data: {
				stripePriceId: subscription.items.data[0]?.price.id,
				stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
			}
		})
	}
}
