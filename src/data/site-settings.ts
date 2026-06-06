export interface NavLink {
  label: string;
  href: string;
}

export interface AccordionItem {
  num: string;
  label: string;
  desc: string;
  img: string;
}

export interface CraftItem {
  num: string;
  label: string;
  desc: string;
  img: string;
}

export interface SiteSettings {
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  nav: {
    logoText: string;
    ctaText: string;
    ctaLink: string;
    links: NavLink[];
  };
  hero: {
    eyebrow: string;
    headline: string;
    headlineEm: string;
    headlineSuffix: string;
    subheadline: string;
    quote: string;
    quoteRef: string;
    image: string;
    imagePosition: string;
    ctaPrimaryText: string;
    ctaPrimaryLink: string;
    ctaSecondaryText: string;
    ctaSecondaryLink: string;
    priceItems: { label: string; value: string; sub: string }[];
  };
  sections: {
    hero: boolean;
    marquee: boolean;
    bento: boolean;
    builder: boolean;
    craft: boolean;
    collections: boolean;
    testimonials: boolean;
    rtw: boolean;
    accessories: boolean;
    cta: boolean;
  };
  marquee: string[];
  footer: {
    scripture: string;
    scriptureRef: string;
    tagline: string;
    values: string;
    col1Title: string;
    col1Links: NavLink[];
    col2Title: string;
    col2Links: NavLink[];
    copyright: string;
  };
  accordion?: { items: AccordionItem[] };
  craftItems?: CraftItem[];
  bento?: {
    cardAImage: string;
    cardALabel?: string;
    cardAHeading?: string;
    cardABody?: string;
    faithQuote?: string;
    faithRef?: string;
  };
  pages?: {
    products?: {
      heading: string;
      subtext: string;
      heroImage?: string;
      heroPosition?: string;
      defaultTileAspect?: string;
    };
    collections?: {
      heading: string;
      subtext: string;
      heroImage?: string;
      heroPosition?: string;
    };
    builder?: {
      heading: string;
      subtext: string;
      cards: Array<{
        id: string;
        label: string;
        description: string;
        image: string;
      }>;
    };
    productDetail?: {
      careInstructions: string;
      guaranteeText: string;
    };
  };
}

export const SITE_DEFAULTS: SiteSettings = {
  typography: {
    headingFont: "Cormorant Garamond",
    bodyFont: "Montserrat",
  },
  nav: {
    logoText: "Blessed & Dressed",
    ctaText: "Book Consultation",
    ctaLink: "/consultation",
    links: [
      { label: "Bespoke", href: "/builder" },
      { label: "Collections", href: "/collections" },
      { label: "Ready to Wear", href: "/products" },
      { label: "Accessories", href: "/accessories" },
    ],
  },
  hero: {
    eyebrow: "Bespoke Made-to-Measure · Faith-Forward Style",
    headline: "Dressed with",
    headlineEm: "intention.",
    headlineSuffix: "Built for you.",
    subheadline:
      "Custom suits, dress pants, and shirts made to your exact measurements. Italian mill fabrics. Corozo buttons. Monogram included.",
    quote: "Let all things be done decently and in order.",
    quoteRef: "1 Cor. 14:40",
    image: "/images/builder-heroes/suit-2pc.jpg",
    imagePosition: "center top",
    ctaPrimaryText: "Start Your Order",
    ctaPrimaryLink: "/builder",
    ctaSecondaryText: "Explore Garments",
    ctaSecondaryLink: "/builder",
    priceItems: [
      { label: "Shirts from", value: "$100", sub: "custom fit" },
      { label: "Suits from", value: "$599", sub: "fully bespoke" },
      { label: "Bundle", value: "$1,600", sub: "3 suits + 3 shirts" },
    ],
  },
  sections: {
    hero: true,
    marquee: true,
    bento: true,
    builder: true,
    craft: true,
    collections: true,
    testimonials: true,
    rtw: true,
    accessories: true,
    cta: true,
  },
  marquee: [
    "Bespoke Suiting",
    "Made-to-Measure",
    "Italian Fabrics",
    "Corozo Buttons",
    "Monogram Included",
    "Faith-Forward Style",
    "Custom Shirting",
    "Dress Trousers",
    "Bespoke Waistcoats",
  ],
  footer: {
    scripture:
      "The LORD shall make thee the head, and not the tail; and thou shalt be above only.",
    scriptureRef: "Deuteronomy 28:13",
    tagline:
      "Christian Bespoke Suiting — crafted with precision, worn with purpose. Every garment is a testament to excellence.",
    values: "Faith · Integrity · Excellence",
    col1Title: "Shop",
    col1Links: [
      { label: "Bespoke Builder", href: "/builder" },
      { label: "Ready to Wear", href: "/products" },
      { label: "Accessories", href: "/accessories" },
      { label: "Collections", href: "/collections" },
    ],
    col2Title: "Company",
    col2Links: [
      { label: "About", href: "/about" },
      { label: "Admin", href: "/admin" },
      { label: "Cart", href: "/cart" },
      { label: "Checkout", href: "/checkout" },
    ],
    copyright: "Blessed & Dressed. All rights reserved.",
  },
  accordion: {
    items: [
      { num: "01", label: "Select a product", desc: "Suit, shirt, trousers, or waistcoat.", img: "/images/builder-heroes/suit-2pc.jpg" },
      { num: "02", label: "Choose your fabric", desc: "Italian mill selections — S120 to S150.", img: "/images/builder-heroes/sport-coat.jpg" },
      { num: "03", label: "Customize design", desc: "Lapels, pockets, lining, and vents.", img: "/images/factory/kute/jacket/Lining_Body_lining/072D__Artistic_Lining_Placement.png" },
      { num: "04", label: "Add monogram", desc: "Thread color, font, and placement.", img: "/images/factory/kute/jacket/Lapel_Handmade_lapel_buttonhole/019H__Open-minded_and_inclusive_handmade_buttonhole_each_keyhole_is_different_6_kinds_of_thread_colors_are_in_turn_-.jpg" },
      { num: "05", label: "Enter measurements", desc: "Standard sizing or fully custom.", img: "/images/builder-heroes/shirt.jpg" },
      { num: "06", label: "Posture adjustments", desc: "Fit tuning for your exact stance.", img: "/images/builder-heroes/vest.jpg" },
      { num: "07", label: "Review and order", desc: "Confirm every detail before placing.", img: "/images/builder-heroes/suit-2pc.jpg" },
    ],
  },
  bento: {
    cardAImage: "/images/builder-heroes/suit-2pc.jpg",
    cardALabel: "Materials",
    cardAHeading: "Italian mill fabrics,\nS120 to S150.",
    cardABody: "Marzotto. Huddersfield. Hardy Minnis. Vitale Barberis Canonico. Every cloth selected for drape, durability, and character.",
    faithQuote: "The LORD shall make thee the head, and not the tail.",
    faithRef: "Deut. 28:13",
  },
  craftItems: [
    { num: "01", label: "Full canvas construction", desc: "The inner structure of every suit jacket is hand-padded to your chest, not fused. It drapes, breathes, and improves with wear.", img: "/images/half/half-canvas-Half+canvas+Made+Suits.webp" },
    { num: "02", label: "Corozo nut buttons", desc: "Sourced from the tagua palm. Each button has a unique grain pattern. Lighter and more durable than plastic — and dignified.", img: "/images/factory/kute/jacket/Bttn_Thread_Button_Choice/0632__Nut_buttons.jpg" },
    { num: "03", label: "Hand-stitched details", desc: "Pick stitching, buttonholes, and edge finishing applied by hand at every stage of construction.", img: "/images/factory/kute/jacket/Lapel_Handmade_lapel_buttonhole/019H__Open-minded_and_inclusive_handmade_buttonhole_each_keyhole_is_different_6_kinds_of_thread_colors_are_in_turn_-.jpg" },
    { num: "04", label: "Monogram embroidery", desc: "Your initials rendered in fine thread. Placed inside the cuff, the chest pocket, or the collar — wherever you prefer.", img: "/images/factory/kute/jacket/Lining_Body_lining/072D__Artistic_Lining_Placement.png" },
  ],
  pages: {
    products: {
      heading: "Ready to Wear",
      subtext: "Premium garments, ready when you are.",
      heroImage: "/images/builder-heroes/suit-2pc.jpg",
      heroPosition: "center top",
      defaultTileAspect: "3/4",
    },
    collections: {
      heading: "Collections",
      subtext: "Curated seasonal offerings, crafted for the discerning gentleman.",
      heroImage: "/images/builder-heroes/suit-2pc.jpg",
      heroPosition: "center top",
    },
    builder: {
      heading: "Build Your Garment",
      subtext: "Every detail, your choice. Start with a product below.",
      cards: [],
    },
    productDetail: {
      careInstructions:
        "Dry clean only. Store on a wide-shoulder hanger. Do not bleach. Cool iron on reverse if needed.",
      guaranteeText:
        "Every Blessed & Dressed garment is backed by our craftsmanship guarantee. If you are not satisfied with the fit or quality, we will make it right.",
    },
  },
};
