import Link from "next/link";

export default function CallToAction() {
  return (
    <div className="px-4 lg:px-20 py-20">
      <div className="bg-primary rounded-[2.5rem] p-12 md:p-20 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 traditional-pattern"></div>
        <div className="relative z-10 flex flex-col items-center gap-8">
          <h2 className="text-4xl md:text-6xl font-black max-w-4xl">
            Ready to Fall in Love with Djerba?
          </h2>
          <p className="text-white/80 text-xl max-w-2xl font-medium">
            Join thousands of travelers who found their perfect island sanctuary
            with DjerbaStay.
          </p>
          <Link
            href="/planner"
            className="bg-white text-primary px-12 py-5 rounded-2xl font-black text-xl shadow-2xl hover:bg-slate-100 transition-colors"
          >
            Start Your Journey Now
          </Link>
        </div>
      </div>
    </div>
  );
}
