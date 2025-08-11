import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import UpgradeDialog from "@/components/UpgradeDialog";
import { useAuth } from "@/contexts/AuthContext";
import { showLoading, dismissToast, showError, showSuccess } from "@/utils/toast";

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  button_text: string;
  is_featured: boolean;
}

const Pricing = () => {
  const { user, profile } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('sort_order');
      
      if (error) {
        console.error("Error fetching pricing plans:", error);
      } else {
        setPlans(data as Plan[]);
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handleUpgradeClick = async (plan: Plan) => {
    if (!user || !profile) {
      showError("Bạn cần đăng nhập để thực hiện thao tác này.");
      return;
    }

    const toastId = showLoading("Đang gửi yêu cầu nâng cấp...");

    const { error } = await supabase.from('upgrade_requests').insert({
      user_id: user.id,
      current_plan_id: profile.plan_id,
      requested_plan_id: plan.id,
      status: 'pending'
    });

    dismissToast(toastId);

    if (error) {
      showError(`Gửi yêu cầu thất bại: ${error.message}`);
    } else {
      showSuccess("Yêu cầu nâng cấp của bạn đã được gửi đi!");
      setIsUpgradeDialogOpen(true);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Bảng giá dịch vụ</h1>
          <p className="text-lg text-gray-500 mt-2">
            Chọn gói phù hợp nhất với nhu cầu của bạn.
          </p>
        </div>
        {loading ? (
          <div className="text-center">Đang tải bảng giá...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => {
              const isCurrentPlan = profile?.plan_id === plan.id;
              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "flex flex-col",
                    plan.is_featured && !isCurrentPlan && "border-brand-orange border-2 shadow-lg",
                    isCurrentPlan && "border-green-500 border-2"
                  )}
                >
                  <CardHeader className="relative">
                    {plan.is_featured && !isCurrentPlan && (
                      <div className="absolute top-0 right-4 -mt-3 bg-brand-orange text-white text-xs font-bold px-3 py-1 rounded-full">
                        Phổ biến
                      </div>
                    )}
                     {isCurrentPlan && (
                      <div className="absolute top-0 right-4 -mt-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Gói hiện tại
                      </div>
                    )}
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-gray-500">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 flex-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleUpgradeClick(plan)}
                      className={cn(
                        "w-full mt-6",
                        plan.is_featured && !isCurrentPlan ? "bg-brand-orange hover:bg-brand-orange/90 text-white" : "bg-gray-800 text-white hover:bg-gray-700",
                        isCurrentPlan && "bg-green-600 hover:bg-green-700"
                      )}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? 'Gói hiện tại' : plan.button_text}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <UpgradeDialog isOpen={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen} />
    </>
  );
};

export default Pricing;