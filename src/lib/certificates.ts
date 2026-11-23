import "server-only";
import crypto from "crypto";
import { id, now, store } from "./db";
import { automatedEmail } from "./automation";
import { appUrl } from "./growth/core";

/** Short, unguessable credential id, e.g. NR-7K3P9Q2XMD (no look-alike characters). */
export const certCode = () => "NR-" + Array.from(crypto.randomBytes(10), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");

type Person = { name: string; email: string; course?: string };

/**
 * Issue one certificate to one person (once per template and email). A copy of the wording is saved with it,
 * so editing the template later never changes certificates that were already issued. The person's name is
 * taken from their own record (purchase or enrolment), never typed by hand.
 */
export async function issueCertificate(creatorId: string, cert: Record<string, unknown> | null, p: Person) {
  const email = p.email.trim().toLowerCase();
  const certId = cert ? String(cert.id) : "programme";
  const [have] = await store.find("certIssues", [["userId", creatorId], ["certId", certId], ["email", email]], { limit: 1 });
  if (have) return { code: String(have.code), fresh: false };
  const creator = await store.get("users", creatorId);
  const code = certCode();
  await store.write([{ type: "set", coll: "certIssues", id: id(), data: {
    userId: creatorId, createdAt: now(), certId, code, email, name: p.name.trim() || email,
    course: String(p.course || cert?.forRef || ""), title: String(cert?.title || "Certificate of Completion"), design: String(cert?.design || "professional"),
    issuer: String(creator?.name || ""), signer: String(cert?.signer || creator?.name || ""), signerTitle: String(cert?.signerTitle || ""), details: String(cert?.details || ""),
    issuedAt: now(),
  } }]);
  return { code, fresh: true };
}

export const certLink = (code: string) => `${appUrl()}/certificate/${code}`;

export async function emailCertificate(creatorId: string, email: string, name: string, title: string, code: string, course: string) {
  await automatedEmail(creatorId, "Certificate Email", email, { name, title, course: course || "your programme", link: certLink(code) }, {
    subject: `Your certificate: ${title}`,
    body: `Hi {name},\n\nCongratulations! Your "{title}" certificate for {course} is ready.\n\nView, download or share it here: {link}\n\n— {creator}`,
  });
}
