export type LegalSection = { heading: string; paragraphs: string[] };

export type LegalDoc = {
  slug: "privacy" | "terms" | "shipping" | "returns";
  title: string;
  description: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export const CONTACT_EMAIL = "chasestanley91@gmail.com";
export const LEGAL_UPDATED = "October 5, 2026";

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "How Blessed & Dressed collects, uses, and protects your information.",
    updated: LEGAL_UPDATED,
    intro:
      "Blessed & Dressed is a small custom clothing shop. We collect only what we need to take your order, make your garment, and stay in touch with you.",
    sections: [
      {
        heading: "What we collect",
        paragraphs: [
          "When you book a consultation or place an order, we collect your name, email, phone number, shipping address, and the details of what you want made — measurements, fabric, and design choices.",
          "When you pay, Stripe handles your card. We do not store your full card number on our computers.",
          "Your cart is saved in your own browser so it is still there if you come back. That stays on your device.",
        ],
      },
      {
        heading: "How we use it",
        paragraphs: [
          "We use your information to answer consultation requests, make and ship your order, send order emails, and fix problems with an order.",
          "We do not sell your information. We do not send marketing lists to other companies.",
        ],
      },
      {
        heading: "Who else sees it",
        paragraphs: [
          "Stripe processes payments. Resend sends our emails. If the shop is hosted on Vercel, that host stores the order records we need to run the business.",
          "We share an address and garment details with our makers and shippers only as needed to produce and deliver your order.",
        ],
      },
      {
        heading: "How long we keep it",
        paragraphs: [
          "We keep order and consultation records so we can serve you later and meet tax and legal duties. If you want a record updated or removed where the law allows, email us.",
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          `Email ${CONTACT_EMAIL} to ask what we have, to correct it, or to ask us to delete it where we can. Some order records we must keep for the business and the law.`,
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    description: "The rules for using the Blessed & Dressed website and placing an order.",
    updated: LEGAL_UPDATED,
    intro:
      "By using this website or placing an order, you agree to these terms. If you do not agree, please do not use the site.",
    sections: [
      {
        heading: "The shop",
        paragraphs: [
          "Blessed & Dressed sells made-to-measure and ready-to-wear clothing. The site is run by Dustin Stanley. You must be 18 or older to place an order.",
        ],
      },
      {
        heading: "Orders and prices",
        paragraphs: [
          "Prices on the site can change. The price you pay is the price we confirm at checkout. We re-check that price on our side before you pay so a cart cannot be underpaid.",
          "A custom order is a request for a garment cut to your measurements and choices. Once we start cutting fabric, that piece is yours and cannot be sold to someone else.",
        ],
      },
      {
        heading: "Your measurements and choices",
        paragraphs: [
          "You are responsible for the measurements and design choices you submit. If you are unsure, book a consultation before you pay. We will make the garment to the details on the order.",
        ],
      },
      {
        heading: "Photos on the site",
        paragraphs: [
          "Builder photos show construction and style. Fabric color and finish can vary slightly from a screen. The fabric you pick and the order sheet are what we make.",
        ],
      },
      {
        heading: "Accounts and the site",
        paragraphs: [
          "Do not misuse the site, attempt to break into admin tools, or interfere with other customers. We may refuse or cancel an order if we cannot fulfill it in good faith, and we will tell you if that happens.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          `Questions about these terms: ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },
  {
    slug: "shipping",
    title: "Shipping",
    description: "How Blessed & Dressed ships custom and ready-to-wear orders.",
    updated: LEGAL_UPDATED,
    intro:
      "Most of what we make is cut after you order. Shipping starts after the garment is finished, not on the day you pay.",
    sections: [
      {
        heading: "Made-to-measure",
        paragraphs: [
          "Custom shirts, trousers, sport coats, vests, and suits are made after your order is confirmed. Lead time depends on the garment, fabric, and current work. We will give you a time estimate when we confirm the order, and we will update you if that changes.",
        ],
      },
      {
        heading: "Ready-to-wear",
        paragraphs: [
          "Ready-to-wear pieces in stock ship after we confirm the size is available. If something is not in stock, we will tell you before it goes into production or we will refund that item.",
        ],
      },
      {
        heading: "Where we ship and what it costs",
        paragraphs: [
          "Shipping cost and carrier are shown at checkout or confirmed by email for custom work. We ship to the address you give us. Please check it. We are not responsible for packages delivered to a wrong address that you entered.",
        ],
      },
      {
        heading: "Delays",
        paragraphs: [
          "Fabric mill timing, fittings, and carriers can add days. If a delay is on us, we will tell you. If a delay is the carrier, we will help you track the package.",
        ],
      },
      {
        heading: "Damage in transit",
        paragraphs: [
          `Photograph the package and the garment as soon as you open it and email ${CONTACT_EMAIL}. We will work with you and the carrier to make it right.`,
        ],
      },
    ],
  },
  {
    slug: "returns",
    title: "Returns & Exchanges",
    description: "When Blessed & Dressed can take a garment back or remake it.",
    updated: LEGAL_UPDATED,
    intro:
      "Custom clothing is cut for you. That changes what we can take back. Please read this before you order.",
    sections: [
      {
        heading: "Made-to-measure",
        paragraphs: [
          "Once we start cutting your fabric, a custom garment cannot be returned or exchanged because it cannot be sold to someone else.",
          "If we made a mistake — the wrong option, a defect in our work, or a garment that does not match the order sheet — we will repair or remake it. Email photos and the order details. We will not leave you with a garment that is our error.",
          "A poor fit from measurements you submitted is not an error on our side. Book a consultation if you want help measuring before you pay.",
        ],
      },
      {
        heading: "Ready-to-wear",
        paragraphs: [
          "For ready-to-wear, email us before you send anything back. Tell us the item, size, and reason. We will tell you whether we can accept a return or exchange and how to ship it.",
          "Items must be unworn, unaltered, and in original condition. We cannot take back a piece that has been worn, washed, or changed.",
        ],
      },
      {
        heading: "Refunds",
        paragraphs: [
          "If we cancel an order we cannot fulfill, we refund what you paid for that order through Stripe to the original payment method.",
          "Approved ready-to-wear returns are refunded the same way after we receive and inspect the item. Original shipping is not refunded unless we shipped the wrong thing.",
        ],
      },
      {
        heading: "How to reach us",
        paragraphs: [
          `Email ${CONTACT_EMAIL} with your name, order or consultation number, and photos if the garment is involved. We aim to reply within one business day.`,
        ],
      },
    ],
  },
];

export function legalDoc(slug: LegalDoc["slug"]): LegalDoc {
  const doc = LEGAL_DOCS.find((d) => d.slug === slug);
  if (!doc) throw new Error(`Unknown legal page: ${slug}`);
  return doc;
}
