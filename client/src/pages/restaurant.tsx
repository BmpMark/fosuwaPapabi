import { Layout } from "@/components/layout";
import { useRestaurant } from "@/hooks/use-restaurant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RestaurantPage() {
  const { menu, isLoadingMenu } = useRestaurant();

  if (isLoadingMenu) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-2xl font-display text-muted-foreground">Loading Menu...</div>
        </div>
      </Layout>
    );
  }

  const categories = Array.from(new Set(menu.map((item) => item.category)));

  return (
    <Layout>
      <div className="bg-primary py-20 text-primary-foreground relative overflow-hidden">
        {/* luxury restaurant food plating */}
        <div className="absolute inset-0 opacity-20">
            <img src="https://pixabay.com/get/g1c6cf4c02087bc6c3c594195d5527a8731998a28575480eef312df36f0b8e11d3dc3fc325aec363efa5b33c59c862079dc96e4372485704fc3819d0a458e2ea2_1280.jpg" className="w-full h-full object-cover" alt="Restaurant Background"/>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="font-display text-6xl font-bold mb-4">La Table</h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto font-light">
            A culinary experience curated with passion and local ingredients.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Tabs defaultValue={categories[0]} className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="bg-muted h-auto p-1 rounded-full">
              {categories.map((cat) => (
                <TabsTrigger 
                  key={cat} 
                  value={cat} 
                  className="rounded-full px-8 py-3 text-base capitalize data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {menu.filter(item => item.category === category).map((item) => (
                <div key={item.id} className="flex justify-between items-start group p-4 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <h3 className="font-display text-xl font-bold text-primary group-hover:text-accent transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-lg font-semibold tabular-nums text-foreground/80">
                    ${(item.price / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}
