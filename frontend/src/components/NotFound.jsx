
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Hammer,
  House,
  Search,
  Wrench,
} from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="min-h-[75vh] bg-[#f7f7f5] px-4 py-12 sm:px-6 lg:py-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center">
        {/* Brand label */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 shadow-sm">
          <Wrench size={15} className="text-[#a17b00]" />
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#242424]">
            FORGE <span className="text-stone-400">/</span> Page not found
          </span>
        </div>

        {/* Main content */}
        <div className="grid w-full items-center gap-10 md:grid-cols-2 md:gap-14">
          {/* Illustration */}
          <div className="relative flex min-h-64 items-center justify-center sm:min-h-80">
            <div className="absolute h-56 w-56 rounded-full bg-[#f5c32c]/20 sm:h-72 sm:w-72" />
            <div className="absolute h-44 w-44 rounded-full border border-[#e6c75e] sm:h-56 sm:w-56" />

            <div className="relative flex h-40 w-40 rotate-[-8deg] items-center justify-center rounded-[2rem] border-4 border-[#242424] bg-[#f5c32c] shadow-[10px_10px_0_#242424] sm:h-48 sm:w-48">
              <Hammer
                size={82}
                strokeWidth={1.5}
                className="text-[#242424] sm:h-24 sm:w-24"
              />
              <span className="absolute -right-4 -top-4 flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-[#f7f7f5] bg-[#242424] text-xl font-black text-[#f5c32c]">
                ?
              </span>
            </div>

            <div className="absolute left-[8%] top-[18%] rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
              <Wrench size={23} className="text-[#a17b00]" />
            </div>

            <div className="absolute bottom-[12%] right-[8%] rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
              <Compass size={23} className="text-[#242424]" />
            </div>

            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-[0.25em] text-stone-400">
              Wrong turn, builder!
            </span>
          </div>

          {/* Message */}
          <div className="text-center md:text-left">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-[#a17b00]">
              Error 404
            </p>

            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-[#242424] sm:text-6xl">
              Looks like
              <br />
              <span className="text-[#a17b00]">we missed</span>
              <br />
              a spot.
            </h1>

            <p className="mx-auto mt-5 max-w-md text-base leading-7 text-stone-600 md:mx-0">
              This page isn't on our shelves. It may have moved, been removed,
              or the address might be incorrect.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5c32c] px-6 py-3.5 text-sm font-extrabold text-[#242424] transition hover:bg-[#e7b51b] focus:outline-none focus:ring-2 focus:ring-[#a17b00] focus:ring-offset-2"
              >
                <House size={17} />
                Back to home
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-6 py-3.5 text-sm font-bold text-[#242424] transition hover:border-[#a17b00] hover:bg-stone-50"
              >
                <Search size={17} />
                Browse products
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-stone-500 md:justify-start">
              <ArrowLeft size={15} />
              <span>Every great build starts with finding the right tools.</span>
            </div>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="mt-14 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-stone-200">
          <div className="h-full w-2/3 rounded-full bg-[#f5c32c]" />
        </div>
      </div>
    </main>
  );
}
