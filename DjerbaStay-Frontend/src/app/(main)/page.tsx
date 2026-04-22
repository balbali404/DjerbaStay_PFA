import Hero from "@/modules/Home/Hero";
import Accommodations from "@/modules/Home/Accommodations";
import HowItWorks from "@/modules/Home/HowItWorks";
import PricingSection from "@/modules/Home/Pricing";
import CallToAction from "@/modules/Home/CallToAction";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Accommodations />
      <HowItWorks />
      <PricingSection />
      <CallToAction />
    </>
  );
}
