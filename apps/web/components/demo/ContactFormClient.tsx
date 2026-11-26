"use client";

import * as React from "react";
import { CheckCircle2, Mail, MapPin, Phone, Send } from "lucide-react";

export function ContactFormClient() {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [roleType, setRoleType] = React.useState("Customer");
  const [subject, setSubject] = React.useState("General Enquiry");
  const [message, setMessage] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;
    setSubmitted(true);
    setFirstName("");
    setLastName("");
    setEmail("");
    setMessage("");
  }

  return (
    <div className="mx-auto grid max-w-[1100px] gap-10 px-6 py-12 lg:grid-cols-[1fr_1.35fr] lg:px-8">
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-ink">Let&apos;s talk</h2>
          <p className="mt-1.5 text-sm text-mut">
            We typically reply within 2 hours during Manchester business hours.
          </p>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-mint text-mint-d">
              <Mail className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-ink">Email us</p>
              <a href="mailto:hello@servyn.net" className="text-leaf-700 hover:underline">
                hello@servyn.net
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-mint text-mint-d">
              <Phone className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-ink">Manchester Support</p>
              <p className="text-mut">Mon–Fri: 9am – 6pm · Sat: 10am – 4pm</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-mint text-mint-d">
              <MapPin className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-ink">Registered Office</p>
              <p className="text-mut">SERVYN LTD (Company No. 17603157)</p>
              <p className="text-mut">
                5, Queens Chambers, John Dalton Street, Manchester, United Kingdom, M2 6ET
              </p>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-[18px] border border-line bg-surface p-6 shadow-soft"
      >
        <div>
          <h3 className="font-serif text-xl font-semibold text-ink">Send us a message</h3>
          <p className="mt-1 text-xs text-mut">
            Whether you&apos;re a customer, vendor, seller, or investor — we&apos;d love to hear
            from you.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-ink-2">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Adaeze"
              className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-ink-2">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nwosu"
              className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-ink-2">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-ink-2">I am a</label>
            <select
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
            >
              <option>Customer</option>
              <option>Service Vendor</option>
              <option>Market Seller</option>
              <option>Investor</option>
              <option>Press / Media</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-ink-2">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
            >
              <option>General Enquiry</option>
              <option>Booking Help</option>
              <option>Vendor Application</option>
              <option>Protected Payment Issue</option>
              <option>Investor Relations</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-ink-2">Message</label>
          <textarea
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us how we can help..."
            className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-6 py-2.5 text-sm font-semibold text-gold-ink shadow-gold hover:brightness-105"
        >
          <Send className="size-4" aria-hidden="true" />
          <span>Send Message</span>
        </button>

        {submitted ? (
          <div className="flex items-center gap-2 rounded-lg bg-mint px-4 py-3 text-xs font-semibold text-mint-d">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            <span>Message received! Our Manchester team will respond within 2 hours.</span>
          </div>
        ) : null}
      </form>
    </div>
  );
}
