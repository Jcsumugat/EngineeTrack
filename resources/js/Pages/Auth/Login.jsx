import { useEffect, useState } from "react";
import { Head, useForm } from "@inertiajs/react";

const features = [
  {
    title: "Equipment Inventory",
    text: "Track stock, add quantities, and monitor availability.",
  },
  {
    title: "Facility Reservations",
    text: "Book rooms and halls without schedule conflicts.",
  },
  {
    title: "Borrow and Return",
    text: "Release, receive, and record damaged items.",
  },
  {
    title: "Reports and Calendar",
    text: "See usage by department and upcoming schedules.",
  },
];

export default function Login({ status }) {
  const [show, setShow] = useState(false);
  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    password: "",
    remember: false,
  });

  useEffect(() => {
    return () => reset("password");
  }, []);

  const submit = (e) => {
    e.preventDefault();
    post(route("login"));
  };

  return (
    <>
      <Head title="Log in" />

      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* LEFT: branding */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 px-8 py-10 text-white lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:px-14 lg:py-14">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative">
            <div
              className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
              style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif" }}
            >
              <span className="text-white">Enginee</span>
              <span className="bg-gradient-to-r from-sky-300 to-blue-100 bg-clip-text text-transparent">
                Track
              </span>
            </div>
            <div className="mt-4 h-1 w-20 bg-sky-300" />
            <p className="mt-3 text-sm font-medium uppercase tracking-widest text-blue-100 lg:hidden">
              Equipment and Facility Management System
            </p>
          </div>

          <div className="relative hidden lg:block">
            <h1 className="text-4xl font-bold leading-tight">
              Equipment and facility
              <br />
              management, simplified.
            </h1>
            <p className="mt-4 max-w-md text-blue-100">
              Request, approve, release, and return, all in one system with a
              clear record of every transaction.
            </p>

            <ul className="mt-10 space-y-5">
              {features.map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 bg-sky-300" />
                  <div>
                    <div className="font-semibold">{f.title}</div>
                    <div className="text-sm text-blue-100">{f.text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative hidden text-xs text-blue-200 lg:block">
            &copy; {new Date().getFullYear()} EngineeTrack. All rights reserved.
          </div>
        </div>

        {/* RIGHT: form */}
        <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-white to-blue-50 px-6 py-12">
          <div className="w-full max-w-md">
            <div className="border-t-4 border-blue-700 bg-white p-8 shadow-xl ring-1 ring-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="mt-1 text-sm text-gray-500">
                Sign in with the account provided by your administrator.
              </p>

              {status && (
                <div className="mt-4 border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {status}
                </div>
              )}

              <form onSubmit={submit} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    autoComplete="username"
                    autoFocus
                    placeholder="you@example.com"
                    onChange={(e) => setData("email", e.target.value)}
                    className="mt-1 w-full border-gray-300 bg-gray-50 px-3 py-2.5 shadow-sm focus:border-blue-700 focus:bg-white focus:ring-blue-700"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="password"
                      type={show ? "text" : "password"}
                      name="password"
                      value={data.password}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      onChange={(e) => setData("password", e.target.value)}
                      className="w-full border-gray-300 bg-gray-50 py-2.5 pl-3 pr-16 shadow-sm focus:border-blue-700 focus:bg-white focus:ring-blue-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute inset-y-0 right-0 px-3 text-xs font-semibold uppercase text-blue-700 hover:text-blue-900"
                    >
                      {show ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={data.remember}
                    onChange={(e) => setData("remember", e.target.checked)}
                    className="border-gray-300 text-blue-700 focus:ring-blue-700"
                  />
                  Keep me signed in
                </label>

                <button
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-blue-700 to-blue-900 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-md transition hover:from-blue-800 hover:to-blue-950 disabled:opacity-50"
                >
                  {processing ? "Signing in..." : "Log in"}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-gray-500">
                No account? Contact your system administrator.
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400 lg:hidden">
              &copy; {new Date().getFullYear()} EngineeTrack
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
