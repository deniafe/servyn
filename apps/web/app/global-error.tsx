"use client";

import * as React from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en-GB">
      <body className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-ink">
        <div className="w-full max-w-md rounded-lg border border-line bg-surface p-8 text-center shadow-soft">
          <p className="text-xs font-bold tracking-[0.12em] uppercase text-gold-600">
            Servyn
          </p>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-ink">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-mut">
            We&apos;ve logged the issue and are looking into it. You can try
            reloading this view or return to the homepage.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="cursor-pointer rounded-full bg-leaf-800 px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-leaf-700"
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded-full border-[1.5px] border-line-2 px-5 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-leaf-500 hover:bg-leaf-50"
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
