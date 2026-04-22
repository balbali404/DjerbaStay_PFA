import dynamic from "next/dynamic";

const Hero = dynamic(() => import("@/modules/Home/Hero"), {
  loading: () => <SectionSkeleton className="min-h-[520px] rounded-3xl" />,
});

const Accommodations = dynamic(() => import("@/modules/Home/Accommodations"), {
  loading: () => <SectionSkeleton className="min-h-[420px]" />,
});

const HowItWorks = dynamic(() => import("@/modules/Home/HowItWorks"), {
  loading: () => <SectionSkeleton className="min-h-[460px]" />,
});

const PricingSection = dynamic(() => import("@/modules/Home/Pricing"), {
  loading: () => <SectionSkeleton className="min-h-[440px]" />,
});

const CallToAction = dynamic(() => import("@/modules/Home/CallToAction"), {
  loading: () => <SectionSkeleton className="min-h-[340px]" />,
});

function SectionSkeleton({ className }: { className: string }) {
  return (
    <section className={`px-4 py-12 lg:px-20 ${className}`}>
      <div className="h-full w-full animate-pulse rounded-3xl bg-slate-200/80" />
    </section>
  );
}

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
