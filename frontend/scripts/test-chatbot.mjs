// Quick edge-case harness for the chat API (dev server must be running).
const BASE = process.env.BASE || "http://localhost:50439";

const CASES = [
  // Happy paths
  "Fare from Safoora to Tower",
  "CP 6 to Hawksbay Sheraz bus",
  "safora to tower",                    // typo
  "Malir Halt to Dolmen Mall",
  "Safoora se Tower tak kitna kiraya hai", // roman urdu
  // Edge cases
  "Tower to Tower",                     // same origin/dest
  "kharadar to kharadar",
  "Tower to Malir Halt",                // cross-route
  "Safoora to Star Gate",               // cross-route (EV-1)
  "Blahblah to Tower",                  // unknown origin
  "Tower to Xyzabc",                    // unknown destination
  "xyz to abc",                         // both unknown
  "Tower",                              // destination only
  "from Safoora",                       // origin only
  // Info queries
  "List all Sheraz Coach stops",
  "list ev1 stops",
  "Sheraz Coach timings",
  "EV-1 kab tak chalti hai",
  "hello",
  "shukriya",
  "help",
  "asdkjhqwe zzz",                      // pure garbage
];

let pass = 0;
let fail = 0;

for (const q of CASES) {
  try {
    const res = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: q }),
    });
    const data = await res.json();
    const card = data.journey_card;
    const status = card?.status ?? "—";
    const fare = card?.estimated_fare ?? "";
    const clar = data.clarify ? ` [clarify:${data.clarify.field} → ${data.clarify.options.slice(0, 2).join(" | ")}]` : "";
    const route = card?.primary_route_name ?? "";
    console.log(
      `✓ "${q}"\n    status=${status} route=${route} fare=${fare}${clar}\n    reply: ${(data.response || "").slice(0, 110).replace(/\n/g, " / ")}`
    );
    pass++;
  } catch (e) {
    console.log(`✗ "${q}" → ERROR ${e.message}`);
    fail++;
  }
}

console.log(`\n${pass} ok, ${fail} failed`);
