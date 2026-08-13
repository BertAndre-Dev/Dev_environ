import Image from "next/image";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="scroll-mt-28 bg-white pb-10 pt-10 sm:pt-14"
    >
      <div className="container mx-auto max-w-[1320px] px-6 md:px-8 lg:px-10 xl:max-w-[1440px]">
        <div className="relative overflow-hidden rounded-3xl bg-[#111827]">
          <Image
            src="/assets/all-in-one.svg"
            alt="Modern apartment building background"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1320px"
            priority={false}
          />

          <div className="relative flex flex-col items-stretch gap-8 p-6 md:p-8 lg:flex-row lg:gap-0">
            <div className="flex w-full items-center justify-center lg:w-1/2">
              <Image
                src="/assets/phone.svg"
                alt="Berta Hub mobile app"
                width={260}
                height={920}
                className="max-h-full w-auto object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
                loading="lazy"
              />
            </div>

            <div className="flex w-full flex-col justify-center text-white lg:w-1/2">
              <h2 className="text-2xl font-semibold leading-tight md:text-[42px]">
                All-in-one Property and Energy
                <br className="hidden sm:block" /> Management Solution
              </h2>
              <div className="mt-2 h-[3px] w-24 rounded-full bg-[#FA8128]" />
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/90 md:text-[20px] xl:text-[24px]">
                Berta Hub is built for forward-thinking property operators,
                community managers, homeowners, and developers who want to
                deliver exceptional experiences at scale.
              </p>
              <div className="mt-4 sm:mt-5">
                <p className="mb-2 text-base font-semibold md:text-[20px] xl:text-[24px]">
                  With BertaHub, you can:
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-base leading-relaxed text-white/90 sm:space-y-2 md:text-[20px] xl:text-[24px]">
                  <li>Get insights on energy consumption</li>
                  <li>Automate billing, collections, and utilities</li>
                  <li>Simplify payments and financial tracking</li>
                  <li>
                    Centralize operations across properties and communities
                  </li>
                  <li>Manage service requests and maintenance effortlessly</li>
                  <li>Enhance transparency, accountability, and trust</li>
                  <li>Deliver a modern, connected living experience</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
