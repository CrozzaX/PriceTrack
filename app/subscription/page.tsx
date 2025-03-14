import { getSubscriptionPlans } from '@/lib/supabase';
import PricingTable from '@/components/subscription/PricingTable';

export default async function SubscriptionPage() {
  const plans = await getSubscriptionPlans();
  
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h1>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Select the perfect plan for your needs. Upgrade or downgrade at any time. 
        All plans include basic tracking features, with premium options for power users.
      </p>
      <PricingTable plans={plans} />
    </div>
  );
} 
 
 
 