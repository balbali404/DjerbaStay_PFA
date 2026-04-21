import Image from "next/image";

import Icon from "@/components/Icon";

export default function HowItWorks() {
  return (
    <div className="bg-primary/5 py-24 px-4 lg:px-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="lg:w-1/2 space-y-8">
          <div>
            <h4 className="text-primary font-extrabold tracking-widest text-sm uppercase mb-4 flex items-center gap-2">
              <Icon name="smart_toy" className="size-5" />
              Powered by Machine Learning
            </h4>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 leading-tight">
              Stay Planning, <br />
              <span className="text-primary">Evolved.</span>
            </h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
            Our advanced algorithms analyze thousands of reviews, seasonal trends,
            and your personal preferences to find the stay that perfectly matches
            your mood and budget.
          </p>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="size-12 rounded-xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center shrink-0">
                <Icon name="psychology" className="size-5 text-primary" />
              </div>
              <div>
                <h5 className="font-bold text-slate-900 dark:text-slate-100">
                  Preference Learning
                </h5>
                <p className="text-slate-500 text-sm">
                  We understand if you prefer quiet &apos;Menze&apos; over lively resorts.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="size-12 rounded-xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center shrink-0">
                <Icon name="magic_button" className="size-5 text-primary" />
              </div>
              <div>
                <h5 className="font-bold text-slate-900 dark:text-slate-100">
                  Smart Itinerary
                </h5>
                <p className="text-slate-500 text-sm">
                  Automatically suggests activities near your chosen stay.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:w-1/2 relative">
          <div className="relative z-10 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-primary/20">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="font-bold">Recommendation Engine</span>
                <Icon name="more_horiz" className="size-5 text-primary" />
              </div>
              <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Icon name="bolt" className="size-4 text-primary" />
                </div>
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-primary rounded-full"></div>
                </div>
                <span className="text-xs font-bold text-primary">85% Match</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-primary relative overflow-hidden">
                  <Image
                    src="/images/home/how-ml-1.svg"
                    alt="Preference analysis"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 20vw"
                  />
                </div>
                <div className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 opacity-50 relative overflow-hidden">
                  <Image
                    src="/images/home/how-ml-2.svg"
                    alt="Activity clusters"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 20vw"
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 font-medium">
                  Processing 2,400+ data points for your search...
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 z-0 w-full h-full bg-primary/10 rounded-3xl -rotate-3"></div>
        </div>
      </div>
    </div>
  );
}
