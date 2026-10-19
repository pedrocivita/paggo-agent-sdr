"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { createLead, type LeadForm } from "@/lib/leads";
import { runResearch } from "@/lib/research";
import { isRole } from "@/lib/roles";

const field = (data: FormData, name: string) => String(data.get(name) ?? "").trim();

export async function submitLead(data: FormData): Promise<void> {
  // A field people never see: only bots fill it, and each lead costs a paid research.
  if (field(data, "website")) redirect("/");

  const role = field(data, "role");
  const form: LeadForm = {
    name: field(data, "name"),
    email: field(data, "email").toLowerCase(),
    phone: field(data, "phone"),
    company: field(data, "company"),
    extra: field(data, "extra"),
    role,
    consentAt: data.get("consent") ? new Date().toISOString() : undefined,
  };
  const valid = form.name && form.company && form.phone && isRole(role) && form.consentAt;
  if (!valid || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
    redirect("/?erro=campos");
  }

  const id = await createLead(form);
  // The lead goes straight to the waiting page; research keeps running after the response.
  after(() => runResearch(id));
  redirect(`/l/${id}`);
}
