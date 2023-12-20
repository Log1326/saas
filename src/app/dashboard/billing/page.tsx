import { getUserSubscriptionPlan } from '@/lib/stripe'
import { BillingForm } from '@/components/BillingForm'

export default async function page() {
	const subscriptionPlan = await getUserSubscriptionPlan()
	return <BillingForm subscriptionPlan={subscriptionPlan} />
}
