"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { createLead, type LeadForm } from "@/lib/leads";
import { runResearch } from "@/lib/research";

const field = (data: FormData, name: string) => String(data.get(name) ?? "").trim();

export async function submitLead(data: FormData): Promise<void> {
  const form: LeadForm = {
    name: field(data, "name"),
    email: field(data, "email").toLowerCase(),
    phone: field(data, "phone"),
    company: field(data, "company"),
    extra: field(data, "extra"),
  };
  if (!form.name || !form.company || !form.phone || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
    redirect("/?erro=campos");
  }

  const id = await createLead(form);
  // The lead goes straight to the waiting page; research keeps running after the response.
  after(() => runResearch(id));
  redirect(`/l/${id}`);
}
