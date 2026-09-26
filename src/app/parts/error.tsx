"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border bg-white p-8">
      <h1 className="text-xl font-semibold">This page couldn’t load</h1>
      <p className="my-4 text-sm text-slate-500">
        Your information is safe. Check your connection and try again.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-white"
      >
        Try again
      </button>
    </div>
  );
}
