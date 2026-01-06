import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Star, Coffee, Wifi, MapPin } from "lucide-react";

export default function HomePage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[80vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        {/* Descriptive alt text for potential Unsplash image replacement */}
        {/* luxury hotel lobby interior with warm lighting and elegant furniture */}
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQG_uOlpoFvOvOmj2MI1ZumHcwSJXJo2uqRJA&s"
          alt="Luxury Hotel Lobby"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg tracking-tight">
            Redefine Luxury
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-10 leading-relaxed font-light drop-shadow-md">
            Experience an unforgettable stay at Fosua Papabi, where modern
            elegance meets timeless comfort in the town.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/rooms">
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg bg-white text-primary hover:bg-white/90"
              >
                Book a Stay
              </Button>
            </Link>
            <Link href="/restaurant">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 py-6 text-lg border-white text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              >
                View Dining
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
              Designed for Comfort
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every detail is curated to provide you with a seamless and
              relaxing experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: Star,
                title: "5-Star Service",
                desc: "24/7 concierge and room service at your fingertips.",
              },
              {
                icon: Coffee,
                title: "Exquisite Dining",
                desc: "Award-winning restaurant featuring local ingredients.",
              },
              {
                icon: Wifi,
                title: "Modern Amenities",
                desc: "High-speed wifi, smart rooms, and premium bedding.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-muted/50 transition-colors duration-300"
              >
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-6 text-primary">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Room Teaser */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute -inset-4 bg-accent/20 rounded-3xl transform -rotate-2" />
              {/* luxury hotel bedroom interior bed comfortable */}
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQF-Y1yiNfi0BYBVgZxihlLUp_ASHmR35CvEQ&s"
                alt="Luxury Suite"
                className="relative rounded-2xl shadow-2xl w-full h-[500px] object-cover"
              />
            </div>
            <div className="order-1 lg:order-2 space-y-8">
              <h2 className="font-display text-4xl font-bold text-primary">
                The Royal Apartment
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Indulge in our most exclusive accommodation. Featuring your own
                kitchen, a private terrain, and a master bath with a soaking
                tub. Perfect for special occasions or an extended luxury stay.
              </p>
              <ul className="space-y-3">
                {[
                  "King Size Bed",
                  "City View",
                  "Private Balcony",
                  "Jacuzzi",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center text-foreground font-medium"
                  >
                    <div className="w-2 h-2 bg-accent rounded-full mr-3" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/rooms">
                <Button className="mt-4 group rounded-full px-8">
                  View All Rooms{" "}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Teaser */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Abstract pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-8">
            Taste the Extraordinary
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg mb-12">
            Our on-site restaurant offers a culinary journey through local
            flavors and international classics, prepared by world-class chefs.
          </p>
          <Link href="/restaurant">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full px-10 py-6 text-lg font-bold shadow-lg shadow-black/20"
            >
              View Menu & Book Table
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
