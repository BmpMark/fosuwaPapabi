import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

const FOOD_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
    title: "Fresh Salads",
  },
  {
    url: "https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?q=80&w=800&auto=format&fit=crop",
    title: "Ghanaian Delicacies",
  },
  {
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop",
    title: "Spicy Pizza",
  },
  {
    url: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=800&auto=format&fit=crop",
    title: "Gourmet Burgers",
  },
  {
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop",
    title: "Grilled Meats",
  },
  {
    url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop",
    title: "Local Specialties",
  },
];

export function FoodSlideshow() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 3000 })]);

  return (
    <div className="overflow-hidden w-full py-8" ref={emblaRef}>
      <div className="flex">
        {FOOD_IMAGES.map((image, index) => (
          <div key={index} className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.33%] min-w-0 px-4">
            <Card className="overflow-hidden border-none shadow-xl hover:scale-105 transition-transform duration-300">
              <CardContent className="p-0 relative aspect-[4/3]">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <h3 className="text-white font-display text-xl font-bold">{image.title}</h3>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
