export type ServiceCategorySlug =
  | "hair-beauty"
  | "barbering-grooming"
  | "events-celebrations"
  | "event-decoration"
  | "event-rentals"
  | "djs-mcs"
  | "catering-food"
  | "cakes-baking"
  | "childcare-family"
  | "fashion-tailoring"
  | "home-services"
  | "other-local-services";

export interface ServiceCategoryMeta {
  slug: ServiceCategorySlug;
  label: string;
}

export interface ProviderServiceOffering {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
}

export interface ProviderAvailabilitySlot {
  time: string;
  available: boolean;
}

export interface ProviderAvailabilityDay {
  id: string;
  weekday: string;
  dayNum: number;
  monthLabel: string;
  freeCount: number;
  slots: ReadonlyArray<ProviderAvailabilitySlot>;
}

export interface ProviderReview {
  id: string;
  initials: string;
  author: string;
  avatarClass: string;
  rating: number;
  timeAgo: string;
  comment: string;
}

export type RatingBreakdown = ReadonlyArray<{
  stars: 5 | 4 | 3 | 2 | 1;
  count: number;
}>;

export const SERVICE_CATEGORIES: ReadonlyArray<ServiceCategoryMeta> = [
  { slug: "hair-beauty", label: "Hair & Beauty" },
  { slug: "barbering-grooming", label: "Barbering & Grooming" },
  { slug: "events-celebrations", label: "Events & Celebrations" },
  { slug: "event-decoration", label: "Event Decoration" },
  { slug: "event-rentals", label: "Event Rentals" },
  { slug: "djs-mcs", label: "DJs & MCs" },
  { slug: "catering-food", label: "Catering & Food" },
  { slug: "cakes-baking", label: "Cakes & Baking" },
  { slug: "childcare-family", label: "Childcare & Family" },
  { slug: "fashion-tailoring", label: "Fashion & Tailoring" },
  { slug: "home-services", label: "Home Services" },
  { slug: "other-local-services", label: "Other Local Services" },
];

export const MANCHESTER_SERVICE_AREAS: ReadonlyArray<string> = [
  "All Manchester",
  "Hulme",
  "Salford",
  "Cheetham Hill",
  "Levenshulme",
  "Moss Side",
  "Ardwick",
  "Chorlton",
  "Trafford",
  "Gorton",
];

const BASE_TIMES = [
  "09:00",
  "10:30",
  "12:00",
  "13:30",
  "15:00",
  "16:30",
] as const;

const AVAILABILITY_PATTERNS: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 3, 0, 5, 2, 4, 4, 4, 2, 0],
  [2, 4, 0, 4, 3, 5, 3, 4, 1, 0],
  [1, 3, 2, 4, 0, 5, 4, 3, 2, 0],
];

function buildUpcomingCalendarDays(count = 10): ReadonlyArray<{
  id: string;
  weekday: string;
  dayNum: number;
  monthLabel: string;
}> {
  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ] as const;
  const now = new Date();
  return Array.from({ length: count }, (_, offset) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return {
      id: `${yyyy}-${mm}-${dd}`,
      weekday: weekdays[d.getDay()] ?? "MON",
      dayNum: d.getDate(),
      monthLabel: months[d.getMonth()] ?? "Jan",
    };
  });
}

const CALENDAR_DAYS = buildUpcomingCalendarDays(10);

function buildAvailability(
  patternIndex: number,
): ReadonlyArray<ProviderAvailabilityDay> {
  const counts =
    AVAILABILITY_PATTERNS[patternIndex % AVAILABILITY_PATTERNS.length] ?? [
      0, 3, 0, 5, 2, 4, 4, 4, 2, 0,
    ];

  return CALENDAR_DAYS.map((day, dayIdx) => {
    const freeCount = counts[dayIdx] ?? 0;
    const openSet = new Set<number>();

    if (freeCount === 3) {
      openSet.add(1);
      openSet.add(4);
      openSet.add(5);
    } else if (freeCount > 0) {
      for (let i = 0; i < BASE_TIMES.length && openSet.size < freeCount; i++) {
        openSet.add((i * 2 + dayIdx + patternIndex) % BASE_TIMES.length);
      }
      for (let i = 0; i < BASE_TIMES.length && openSet.size < freeCount; i++) {
        openSet.add(i);
      }
    }

    return {
      ...day,
      freeCount,
      slots: BASE_TIMES.map((time, idx) => ({
        time,
        available: openSet.has(idx),
      })),
    };
  });
}

function makeBreakdown(total: number): RatingBreakdown {
  const five = Math.round(total * 0.8);
  const four = Math.round(total * 0.13);
  const three = Math.max(1, Math.round(total * 0.04));
  const two = Math.max(0, Math.round(total * 0.02));
  const one = Math.max(0, total - five - four - three - two);
  return [
    { stars: 5, count: five },
    { stars: 4, count: four },
    { stars: 3, count: three },
    { stars: 2, count: two },
    { stars: 1, count: one },
  ];
}

export interface ServiceProvider {
  id: string;
  ownerUserId?: string;
  photos?: ReadonlyArray<string>;
  address?: string;
  lat?: number;
  lng?: number;
  initials: string;
  name: string;
  categorySlug: ServiceCategorySlug;
  categoryLabel: string;
  area: string;
  distance: string;
  tagline: string;
  about: string;
  joinedLabel: string;
  completedBookings: number;
  serviceRadiusLabel: string;
  mapPinPosition: { xPercent: number; yPercent: number };
  nextSlot: string;
  slots: ReadonlyArray<string>;
  bookedSlots?: ReadonlyArray<string>;
  responseTime: string;
  bannerVar: string;
  rating: number;
  reviews: number;
  duration: string;
  tags: ReadonlyArray<string>;
  startingPrice: number;
  avatarColorClass: string;
  bannerBgClass: string;
  availableThisWeek: boolean;
  verified: boolean;
  enhancedChecks?: boolean;
  defaultSaved?: boolean;
  recommendedOrder: number;
  keywords: ReadonlyArray<string>;
  offerings: ReadonlyArray<ProviderServiceOffering>;
  ratingBreakdown: RatingBreakdown;
  reviewList: ReadonlyArray<ProviderReview>;
  availability: ReadonlyArray<ProviderAvailabilityDay>;
}

export const SERVICE_PROVIDERS: ReadonlyArray<ServiceProvider> = [
  {
    id: "mama-efes-kitchen",
    initials: "ME",
    name: "Mama Efe's Kitchen",
    categorySlug: "catering-food",
    categoryLabel: "Catering & Food",
    area: "Cheetham Hill",
    distance: "2.1 mi",
    tagline:
      "Smoky party jollof trays, puff-puff platters & home-style West African catering.",
    about:
      "Party jollof with the proper smoky bottom-pot taste, small chops fried to order, and puff-puff that disappears first. Trays for 10 to 300 guests.",
    joinedLabel: "Joined May 2026",
    completedBookings: 388,
    serviceRadiusLabel:
      "Covers 5 miles around Cheetham Hill · Delivery & kitchen pickup",
    mapPinPosition: { xPercent: 52, yPercent: 34 },
    nextSlot: "Tomorrow 11:00",
    slots: ["Tomorrow 11:00", "Sat 13:00", "Sun 15:30"],
    responseTime: "Replies ~45 min",
    bannerVar: "var(--sv-banner-catering)",
    rating: 4.9,
    reviews: 134,
    duration: "~45 min",
    tags: ["Jollof & small chops", "Party trays"],
    startingPrice: 8,
    avatarColorClass: "bg-red",
    bannerBgClass: "bg-peach/45",
    availableThisWeek: true,
    verified: true,
    defaultSaved: true,
    recommendedOrder: 1,
    keywords: ["jollof", "food", "catering", "party", "nigerian", "small chops"],
    offerings: [
      {
        id: "jollof-tray",
        name: "Jollof party tray (serves 10)",
        description:
          "Smoky party jollof, fried plantain and choice of chicken or beef.",
        duration: "1h",
        price: 65,
      },
      {
        id: "small-chops-50",
        name: "Small chops box (50 pc)",
        description:
          "Spring rolls, samosas, puff-puff and peppered gizzards.",
        duration: "1h",
        price: 40,
      },
      {
        id: "chef-dinner",
        name: "Personal chef dinner (4 courses)",
        description:
          "Four-course private home menu prepared fresh in your kitchen.",
        duration: "3h",
        price: 90,
      },
      {
        id: "taster-box",
        name: "Jollof & plantain taster box (serves 2)",
        description:
          "Individual smoky party jollof portions with suya chicken.",
        duration: "45m",
        price: 8,
      },
    ],
    ratingBreakdown: [
      { stars: 5, count: 107 },
      { stars: 4, count: 17 },
      { stars: 3, count: 5 },
      { stars: 2, count: 3 },
      { stars: 1, count: 1 },
    ],
    reviewList: [
      {
        id: "rev-me-1",
        initials: "IK",
        author: "Ife K.",
        avatarClass: "bg-sky-d",
        rating: 5,
        timeAgo: "2d ago",
        comment:
          "The jollof converted my Ghanaian in-laws. Highest praise possible.",
      },
      {
        id: "rev-me-2",
        initials: "SW",
        author: "Sarah W.",
        avatarClass: "bg-lav-d",
        rating: 5,
        timeAgo: "13d ago",
        comment: "Small chops arrived hot and gone in ten minutes.",
      },
    ],
    availability: buildAvailability(0),
  },
  {
    id: "amara-hair-beauty",
    initials: "AH",
    name: "Amara Hair & Beauty",
    categorySlug: "hair-beauty",
    categoryLabel: "Hair & Beauty",
    area: "Hulme",
    distance: "0.4 mi",
    tagline:
      "Tension-free knotless braids, silk presses & natural protective styling studio.",
    about:
      "Calm private braiding studio in Hulme specialising in featherlight knotless box braids, scalp-kind silk presses, and custom frontal installations with pre-stretched hair included.",
    joinedLabel: "Joined Jan 2026",
    completedBookings: 412,
    serviceRadiusLabel:
      "Private studio on Stretford Road, Hulme · 4 min from bus stop",
    mapPinPosition: { xPercent: 44, yPercent: 58 },
    nextSlot: "Sat 10:30",
    slots: ["Sat 10:30", "Sat 14:00", "Tue 09:30"],
    responseTime: "Replies ~15 min",
    bannerVar: "var(--sv-banner-hair)",
    rating: 4.9,
    reviews: 127,
    duration: "~1 hr",
    tags: ["Knotless braids", "Wig installs"],
    startingPrice: 25,
    avatarColorClass: "bg-gold-600",
    bannerBgClass: "bg-butter/60",
    availableThisWeek: true,
    verified: true,
    defaultSaved: true,
    recommendedOrder: 2,
    keywords: ["knotless", "braids", "silk press", "wig", "locs", "hair"],
    offerings: [
      {
        id: "knotless-medium",
        name: "Medium waist-length knotless braids",
        description:
          "Tension-free parting, pre-stretched braiding hair & botanical scalp mist included.",
        duration: "4h 30m",
        price: 85,
      },
      {
        id: "silk-press",
        name: "Wash, deep steam & silk press",
        description:
          "Clarifying cleanse, honey moisture mask, trim and weightless bouncy finish.",
        duration: "1h 45m",
        price: 45,
      },
      {
        id: "wig-install",
        name: "HD lace frontal wig install & styling",
        description:
          "Braid-down foundation, melted hairline tint, elastic band security & curls.",
        duration: "2h",
        price: 65,
      },
      {
        id: "scalp-detox",
        name: "Express take-down & scalp ritual",
        description:
          "Gentle braid removal, detangling and soothing peppermint oil massage.",
        duration: "1h",
        price: 25,
      },
    ],
    ratingBreakdown: makeBreakdown(127),
    reviewList: [
      {
        id: "rev-ah-1",
        initials: "NO",
        author: "Nadia O.",
        avatarClass: "bg-leaf-800",
        rating: 5,
        timeAgo: "3d ago",
        comment:
          "Zero pulling around my edges and the neatest parts I have ever had in Manchester.",
      },
      {
        id: "rev-ah-2",
        initials: "TC",
        author: "Tasha C.",
        avatarClass: "bg-gold-600",
        rating: 5,
        timeAgo: "11d ago",
        comment:
          "Quiet studio, warm tea while you sit, and finished half an hour ahead of schedule.",
      },
    ],
    availability: buildAvailability(1),
  },
  {
    id: "sparkle-shine-cleans",
    initials: "S&",
    name: "Sparkle & Shine Cleans",
    categorySlug: "home-services",
    categoryLabel: "Home Services",
    area: "Moss Side",
    distance: "1.1 mi",
    tagline:
      "Plant-derived deep cleans & end-of-tenancy resets by a DBS-vetted local team.",
    about:
      "Two-person DBS-checked domestic cleaning team using biodegradable plant-based products safe around babies and pets. Ideal for regular home resets or inspection-ready move-outs.",
    joinedLabel: "Joined Mar 2026",
    completedBookings: 295,
    serviceRadiusLabel:
      "Mobile across Moss Side, Hulme, Rusholme & City Centre",
    mapPinPosition: { xPercent: 56, yPercent: 62 },
    nextSlot: "Tomorrow 09:00",
    slots: ["Tomorrow 09:00", "Fri 13:30", "Mon 10:00"],
    responseTime: "Replies ~30 min",
    bannerVar: "var(--sv-banner-home)",
    rating: 4.8,
    reviews: 112,
    duration: "~1 hr",
    tags: ["Eco products", "DBS-checked team"],
    startingPrice: 20,
    avatarColorClass: "bg-leaf-700",
    bannerBgClass: "bg-mint/55",
    availableThisWeek: true,
    verified: true,
    recommendedOrder: 3,
    keywords: [
      "deep clean",
      "inspection",
      "cleaning",
      "home",
      "end of tenancy",
    ],
    offerings: [
      {
        id: "hourly-reset",
        name: "Standard home refresh (per hour)",
        description:
          "Kitchen surfaces, bathrooms, hoovering & mopping with eco botanicals.",
        duration: "1h",
        price: 20,
      },
      {
        id: "deep-clean-2bed",
        name: "Full deep clean (up to 2-bed flat)",
        description:
          "Skirting boards, tiles, interior windows, descaling and appliances.",
        duration: "3h 30m",
        price: 78,
      },
      {
        id: "tenancy-clean",
        name: "End-of-tenancy inspection clean",
        description:
          "Inventory-grade checklist clean including oven rack soak and cupboards.",
        duration: "4h 30m",
        price: 115,
      },
    ],
    ratingBreakdown: makeBreakdown(112),
    reviewList: [
      {
        id: "rev-ss-1",
        initials: "DB",
        author: "Daniel B.",
        avatarClass: "bg-leaf-700",
        rating: 5,
        timeAgo: "4d ago",
        comment:
          "Got our full deposit back without a single snag on the inventory report.",
      },
      {
        id: "rev-ss-2",
        initials: "AM",
        author: "Amina M.",
        avatarClass: "bg-peach-d",
        rating: 5,
        timeAgo: "9d ago",
        comment:
          "Turned up right on time with all equipment and left the flat smelling fresh, not chemical.",
      },
    ],
    availability: buildAvailability(2),
  },
  {
    id: "dj-kaydee",
    initials: "DK",
    name: "DJ Kaydee",
    categorySlug: "djs-mcs",
    categoryLabel: "DJs & MCs",
    area: "Chorlton",
    distance: "3.2 mi",
    tagline:
      "Afrobeats, Amapiano & UK dancehall sets with full PA rig & MC hosting.",
    about:
      "Open-format Manchester club & wedding DJ blending Afrobeats, Amapiano, Bashment, R&B and classic Soul. Brings dual RCF speakers, wireless mics and floor uplighting.",
    joinedLabel: "Joined Feb 2026",
    completedBookings: 164,
    serviceRadiusLabel:
      "Covers Greater Manchester & Cheshire · Full sound & lighting rig",
    mapPinPosition: { xPercent: 34, yPercent: 68 },
    nextSlot: "Sat 19:00",
    slots: ["Sat 19:00", "Fri 20:00", "Sun 17:00"],
    responseTime: "Replies ~1 hr",
    bannerVar: "var(--sv-banner-dj)",
    rating: 4.9,
    reviews: 98,
    duration: "~1 hr",
    tags: ["Afrobeats & Amapiano", "Weddings"],
    startingPrice: 120,
    avatarColorClass: "bg-lav-d",
    bannerBgClass: "bg-lav/55",
    availableThisWeek: true,
    verified: true,
    recommendedOrder: 4,
    keywords: [
      "dj",
      "music",
      "afrobeats",
      "amapiano",
      "wedding",
      "party",
      "mc",
    ],
    offerings: [
      {
        id: "birthday-set",
        name: "Birthday & private party DJ set (3h)",
        description:
          "Custom playlist consultation, Pioneer controller, dual tops & cordless mic.",
        duration: "3h",
        price: 120,
      },
      {
        id: "wedding-evening",
        name: "Full wedding reception & MC package (5h)",
        description:
          "Entrance announcements, cake cutting cues, Afrobeats & family dancefloor set.",
        duration: "5h",
        price: 260,
      },
      {
        id: "sound-add",
        name: "Extra subwoofer & room uplighters",
        description:
          "High-impact bass reinforcement and 8 warm amber LED uplighters.",
        duration: "Per event",
        price: 65,
      },
    ],
    ratingBreakdown: makeBreakdown(98),
    reviewList: [
      {
        id: "rev-dk-1",
        initials: "KO",
        author: "Kemi O.",
        avatarClass: "bg-lav-d",
        rating: 5,
        timeAgo: "5d ago",
        comment:
          "Kept elders and twenty-somethings on the floor at our engagement party until midnight.",
      },
      {
        id: "rev-dk-2",
        initials: "JM",
        author: "Jordan M.",
        avatarClass: "bg-leaf-900",
        rating: 5,
        timeAgo: "2w ago",
        comment:
          "Crisp sound, seamless transitions, and zero mic screeching during speeches.",
      },
    ],
    availability: buildAvailability(1),
  },
  {
    id: "kingsman-cuts",
    initials: "KC",
    name: "Kingsman Cuts",
    categorySlug: "barbering-grooming",
    categoryLabel: "Barbering & Grooming",
    area: "Cheetham Hill",
    distance: "2.3 mi",
    tagline:
      "Razor-sharp skin fades, hot-towel beard sculpting & textured crop specialists.",
    about:
      "Dedicated grooming lounge on Bury New Road run by Master Barbers trained in Afro-textured hair, razor crisp lineups, waves training and traditional hot-towel straight-razor shaves.",
    joinedLabel: "Joined Jan 2026",
    completedBookings: 520,
    serviceRadiusLabel:
      "Bury New Road Lounge · Free customer forecourt parking",
    mapPinPosition: { xPercent: 49, yPercent: 30 },
    nextSlot: "Today 16:30",
    slots: ["Today 16:30", "Tomorrow 11:30", "Sat 09:00"],
    responseTime: "Replies ~10 min",
    bannerVar: "var(--sv-banner-barber)",
    rating: 4.8,
    reviews: 89,
    duration: "~30 min",
    tags: ["Skin fades", "Beard sculpt"],
    startingPrice: 15,
    avatarColorClass: "bg-leaf-800",
    bannerBgClass: "bg-sage/60",
    availableThisWeek: true,
    verified: true,
    recommendedOrder: 5,
    keywords: ["skin fade", "barber", "haircut", "trim", "beard", "lineup"],
    offerings: [
      {
        id: "junior-shapeup",
        name: "Express shape-up & kids cut",
        description:
          "Clean neck taper, crisp hairline and gentle clipper blend for under-14s.",
        duration: "25m",
        price: 15,
      },
      {
        id: "signature-fade",
        name: "Signature skin fade & razor lineup",
        description:
          "Seamless zero-gap fade, sponge curl or brush finish and alcohol-free soothing mist.",
        duration: "40m",
        price: 25,
      },
      {
        id: "kingsman-deluxe",
        name: "Haircut, hot towel & beard sculpt",
        description:
          "Full cut plus eucalyptus steam towel, razor beard architecture and sandalwood balm.",
        duration: "55m",
        price: 35,
      },
    ],
    ratingBreakdown: makeBreakdown(89),
    reviewList: [
      {
        id: "rev-kc-1",
        initials: "TA",
        author: "Tobi A.",
        avatarClass: "bg-leaf-800",
        rating: 5,
        timeAgo: "1d ago",
        comment:
          "Fast, meticulous lineup and never kept waiting past my slot time.",
      },
      {
        id: "rev-kc-2",
        initials: "MC",
        author: "Marcus C.",
        avatarClass: "bg-gold-600",
        rating: 5,
        timeAgo: "10d ago",
        comment:
          "Best beard trim on this side of town — hot towel at the end is unreal.",
      },
    ],
    availability: buildAvailability(2),
  },
  {
    id: "owambe-events-co",
    initials: "OE",
    name: "Owambe Events Co.",
    categorySlug: "events-celebrations",
    categoryLabel: "Events & Celebrations",
    area: "Ardwick",
    distance: "1.6 mi",
    tagline:
      "Full-service coordination for traditional engagements, milestones & gala banquets.",
    about:
      "Cultural wedding & milestone planners coordinating Nigerian and Caribbean engagements across Greater Manchester — handling vendor timelines, alaga coordination, seating charts and day-of direction.",
    joinedLabel: "Joined Apr 2026",
    completedBookings: 118,
    serviceRadiusLabel:
      "Greater Manchester & North West venues · Full site visits included",
    mapPinPosition: { xPercent: 60, yPercent: 52 },
    nextSlot: "Wed 11:00",
    slots: ["Wed 11:00", "Fri 14:00", "Sat 10:00"],
    responseTime: "Replies ~2 hrs",
    bannerVar: "var(--sv-banner-events)",
    rating: 4.9,
    reviews: 76,
    duration: "~2 hrs",
    tags: ["Owambe specialists", "Full venue styling"],
    startingPrice: 95,
    avatarColorClass: "bg-rose-d",
    bannerBgClass: "bg-rose/50",
    availableThisWeek: false,
    verified: true,
    recommendedOrder: 6,
    keywords: [
      "owambe",
      "events",
      "party",
      "planning",
      "wedding",
      "celebration",
    ],
    offerings: [
      {
        id: "event-consult",
        name: "Event blueprint & budget consultation",
        description:
          "Two-hour planning session mapping Manchester venues, trusted caterers and run-sheet.",
        duration: "2h",
        price: 95,
      },
      {
        id: "day-coord",
        name: "On-the-day coordinator (2 stewards)",
        description:
          "Supplier check-in, bridal entrance timing, MC cueing and stress-free teardown.",
        duration: "8h",
        price: 380,
      },
      {
        id: "trad-eng",
        name: "Full traditional engagement styling",
        description:
          "Head-table backdrop, floral runners, emerald & gold charger settings and usher team.",
        duration: "Full event",
        price: 520,
      },
    ],
    ratingBreakdown: makeBreakdown(76),
    reviewList: [
      {
        id: "rev-oe-1",
        initials: "BA",
        author: "Bola A.",
        avatarClass: "bg-rose-d",
        rating: 5,
        timeAgo: "6d ago",
        comment:
          "My mum did not have to lift a single finger all day — every course served on time.",
      },
      {
        id: "rev-oe-2",
        initials: "CH",
        author: "Chidi H.",
        avatarClass: "bg-sky-d",
        rating: 5,
        timeAgo: "3w ago",
        comment:
          "Worth every penny for the vendor run-sheet alone.",
      },
    ],
    availability: buildAvailability(0),
  },
  {
    id: "sweet-adjoa-cakes",
    initials: "SA",
    name: "Sweet Adjoa Cakes",
    categorySlug: "cakes-baking",
    categoryLabel: "Cakes & Baking",
    area: "Trafford",
    distance: "3.5 mi",
    tagline:
      "Bespoke tiered celebration cakes with hibiscus, spiced rum & vegan sponges.",
    about:
      "5-star hygiene registered bakery crafting bespoke buttercream cakes infused with Caribbean rum fruit, salted caramel, sobolo hibiscus curd and eggless vanilla bean.",
    joinedLabel: "Joined Feb 2026",
    completedBookings: 204,
    serviceRadiusLabel:
      "Collection in Old Trafford or chilled delivery within 6 miles",
    mapPinPosition: { xPercent: 33, yPercent: 56 },
    nextSlot: "Sat 12:00",
    slots: ["Sat 12:00", "Tue 15:00", "Thu 11:00"],
    responseTime: "Replies ~45 min",
    bannerVar: "var(--sv-banner-cakes)",
    rating: 4.8,
    reviews: 71,
    duration: "~5 hrs",
    tags: ["Celebration cakes", "Eggless options"],
    startingPrice: 28,
    avatarColorClass: "bg-lav-d",
    bannerBgClass: "bg-lav/45",
    availableThisWeek: true,
    verified: true,
    recommendedOrder: 7,
    keywords: ["cakes", "baking", "birthday", "wedding cake", "pastries"],
    offerings: [
      {
        id: "cupcake-box",
        name: "Box of 12 filled celebration cupcakes",
        description:
          "Choice of spiced lotus, hibiscus berry or double chocolate Swiss buttercream.",
        duration: "Custom prep",
        price: 28,
      },
      {
        id: "single-tier-8",
        name: "Tall 8-inch signature birthday cake",
        description:
          "Four soft sponge layers finished in ivory buttercream, edible gold leaf and florals.",
        duration: "Custom prep",
        price: 68,
      },
      {
        id: "two-tier-gala",
        name: "Two-tier bespoke celebration cake",
        description:
          "Serves 45–55 guests with tasting box consultation and chilled venue delivery.",
        duration: "Custom prep",
        price: 165,
      },
    ],
    ratingBreakdown: makeBreakdown(71),
    reviewList: [
      {
        id: "rev-sa-1",
        initials: "EO",
        author: "Efua O.",
        avatarClass: "bg-lav-d",
        rating: 5,
        timeAgo: "4d ago",
        comment:
          "The hibiscus velvet sponge stayed moist for three days and looked like art.",
      },
      {
        id: "rev-sa-2",
        initials: "RH",
        author: "Rachel H.",
        avatarClass: "bg-gold-600",
        rating: 5,
        timeAgo: "2w ago",
        comment:
          "Best eggless vanilla cake anyone in our family has ever tasted.",
      },
    ],
    availability: buildAvailability(1),
  },
  {
    id: "adunni-alterations",
    initials: "AA",
    name: "Adunni Alterations",
    categorySlug: "fashion-tailoring",
    categoryLabel: "Fashion & Tailoring",
    area: "Levenshulme",
    distance: "2.8 mi",
    tagline:
      "Made-to-measure Ankara gowns, agbada tailoring & same-week bridal fittings.",
    about:
      "Bespoke African garment tailoring studio led by a former Savile-trained pattern cutter. From Aso-Ebi silhouettes and crisp Agbada embroidery to same-week trouser hems.",
    joinedLabel: "Joined Mar 2026",
    completedBookings: 247,
    serviceRadiusLabel:
      "Stockport Road workshop, Levenshulme · Private fitting booth",
    mapPinPosition: { xPercent: 66, yPercent: 66 },
    nextSlot: "Fri 10:30",
    slots: ["Fri 10:30", "Sat 11:30", "Mon 16:00"],
    responseTime: "Replies ~25 min",
    bannerVar: "var(--sv-banner-fashion)",
    rating: 4.7,
    reviews: 63,
    duration: "~3 hrs",
    tags: ["Ankara specialist", "Same-week fittings"],
    startingPrice: 10,
    avatarColorClass: "bg-gold-600",
    bannerBgClass: "bg-butter/55",
    availableThisWeek: true,
    verified: true,
    recommendedOrder: 8,
    keywords: [
      "ankara",
      "tailor",
      "alterations",
      "sewing",
      "fashion",
      "agbada",
    ],
    offerings: [
      {
        id: "express-hem",
        name: "Express trouser or dress hemming",
        description:
          "Blind-stitch or original denim finish with pinning session in studio.",
        duration: "30m fitting",
        price: 10,
      },
      {
        id: "aso-ebi-fit",
        name: "Bridal / Aso-Ebi dress tailoring",
        description:
          "Bodice sculpting, zip replacement, corsetry adjustment and steamer press.",
        duration: "1h fitting",
        price: 45,
      },
      {
        id: "custom-ankara",
        name: "Bespoke two-piece Ankara set",
        description:
          "Full pattern drafting from your fabric (or studio stock) with lined pockets.",
        duration: "2 fittings",
        price: 85,
      },
    ],
    ratingBreakdown: makeBreakdown(63),
    reviewList: [
      {
        id: "rev-aa-1",
        initials: "FO",
        author: "Femi O.",
        avatarClass: "bg-gold-600",
        rating: 5,
        timeAgo: "3d ago",
        comment:
          "Turned three yards of Ankara into a razor-sharp suit fit in five days.",
      },
      {
        id: "rev-aa-2",
        initials: "LS",
        author: "Lola S.",
        avatarClass: "bg-red",
        rating: 5,
        timeAgo: "18d ago",
        comment:
          "Fixed a tricky beaded lace bridesmaid dress without losing a single sequin.",
      },
    ],
    availability: buildAvailability(2),
  },
  {
    id: "little-steps-childminding",
    initials: "LS",
    name: "Little Steps Childminding",
    categorySlug: "childcare-family",
    categoryLabel: "Childcare & Family",
    area: "Salford",
    distance: "1.9 mi",
    tagline:
      "Ofsted-registered home nursery & trusted wrap-around evening family care.",
    about:
      "Warm, calm Ofsted-registered childcare led by an Early Years practitioner with 9 years' experience, Enhanced DBS on the Update Service, Paediatric First Aid & allergy certification.",
    joinedLabel: "Joined Jan 2026",
    completedBookings: 192,
    serviceRadiusLabel:
      "Ordsall family home nursery & Salford evening babysitting",
    mapPinPosition: { xPercent: 39, yPercent: 42 },
    nextSlot: "Tomorrow 08:30",
    slots: ["Tomorrow 08:30", "Fri 15:30", "Sat 18:00"],
    responseTime: "Replies ~15 min",
    bannerVar: "var(--sv-banner-childcare)",
    rating: 5.0,
    reviews: 41,
    duration: "~2 hrs",
    tags: ["Enhanced DBS", "Ofsted registered"],
    startingPrice: 12,
    avatarColorClass: "bg-sky-d",
    bannerBgClass: "bg-sky/55",
    availableThisWeek: true,
    verified: true,
    enhancedChecks: true,
    recommendedOrder: 9,
    keywords: [
      "childcare",
      "childminder",
      "dbs",
      "ofsted",
      "babysitting",
      "after school",
    ],
    offerings: [
      {
        id: "hourly-minding",
        name: "Wrap-around & hourly childminding",
        description:
          "Supervised creative play, healthy fruit snack and Montessori story corner.",
        duration: "1h",
        price: 12,
      },
      {
        id: "evening-care",
        name: "Evening babysitting at your home (3h)",
        description:
          "Bedtime routine, reading and quiet monitoring so parents enjoy an evening out.",
        duration: "3h",
        price: 38,
      },
      {
        id: "weekend-day",
        name: "Saturday full-day nursery session (7h)",
        description:
          "Home-cooked nutritious hot lunch, garden play and sensory craft activities.",
        duration: "7h",
        price: 75,
      },
    ],
    ratingBreakdown: [
      { stars: 5, count: 40 },
      { stars: 4, count: 1 },
      { stars: 3, count: 0 },
      { stars: 2, count: 0 },
      { stars: 1, count: 0 },
    ],
    reviewList: [
      {
        id: "rev-ls-1",
        initials: "ZO",
        author: "Zainab O.",
        avatarClass: "bg-sky-d",
        rating: 5,
        timeAgo: "2d ago",
        comment:
          "Checked all Ofsted documents in person — our toddler runs to the door smiling.",
      },
      {
        id: "rev-ls-2",
        initials: "PK",
        author: "Peter K.",
        avatarClass: "bg-leaf-700",
        rating: 5,
        timeAgo: "12d ago",
        comment:
          "Lifesaver for shift weeks, calm home setting and thoughtful photo updates.",
      },
    ],
    availability: buildAvailability(1),
  },
  {
    id: "zuri-luxe-decor",
    initials: "ZL",
    name: "Zuri Luxe Decor",
    categorySlug: "event-decoration",
    categoryLabel: "Event Decoration",
    area: "Hulme",
    distance: "0.7 mi",
    tagline:
      "Sculptural organic balloon arches, pleated backdrops & candlelit tablescapes.",
    about:
      "Luxury event styling studio turning Manchester halls, restaurants and living rooms into warm editorial scenes with double-stuffed biodegradable balloons, linen sails and dried florals.",
    joinedLabel: "Joined Apr 2026",
    completedBookings: 136,
    serviceRadiusLabel:
      "Studio in Hulme · Setup & next-day teardown across Greater Manchester",
    mapPinPosition: { xPercent: 46, yPercent: 56 },
    nextSlot: "Sat 09:30",
    slots: ["Sat 09:30", "Sun 10:00", "Thu 14:00"],
    responseTime: "Replies ~30 min",
    bannerVar: "var(--sv-banner-decor)",
    rating: 4.9,
    reviews: 54,
    duration: "~3 hrs",
    tags: ["Balloon garlands", "Table styling"],
    startingPrice: 65,
    avatarColorClass: "bg-blush-d",
    bannerBgClass: "bg-blush/50",
    availableThisWeek: true,
    verified: true,
    recommendedOrder: 10,
    keywords: [
      "decor",
      "decoration",
      "backdrop",
      "balloon",
      "tablescape",
    ],
    offerings: [
      {
        id: "organic-garland",
        name: "3-metre organic matte balloon garland",
        description:
          "Custom 3-tone earthy colour palette delivered & installed cleanly with command hooks.",
        duration: "1h setup",
        price: 65,
      },
      {
        id: "arch-backdrop",
        name: "Pleated arch backdrop & cake plinth",
        description:
          "Matte cream wooden arch, draped linen sail, pedestal stand and balloon cascade.",
        duration: "2h setup",
        price: 145,
      },
      {
        id: "tablescape-24",
        name: "Candlelit dinner tablescape (up to 24 guests)",
        description:
          "Cheesecloth runners, tapered brass holders, gold chargers and dried floral buds.",
        duration: "2h 30m setup",
        price: 185,
      },
    ],
    ratingBreakdown: makeBreakdown(54),
    reviewList: [
      {
        id: "rev-zl-1",
        initials: "AK",
        author: "Aisha K.",
        avatarClass: "bg-blush-d",
        rating: 5,
        timeAgo: "6d ago",
        comment:
          "Matched our terracotta and emerald colour swatches down to the exact shade.",
      },
      {
        id: "rev-zl-2",
        initials: "SG",
        author: "Sonia G.",
        avatarClass: "bg-gold-600",
        rating: 5,
        timeAgo: "3w ago",
        comment:
          "Zero wall tape marks left behind when they packed everything away on Sunday.",
      },
    ],
    availability: buildAvailability(2),
  },
  {
    id: "goldcrest-event-hire",
    initials: "GE",
    name: "Goldcrest Event Hire",
    categorySlug: "event-rentals",
    categoryLabel: "Event Rentals",
    area: "Gorton",
    distance: "3.9 mi",
    tagline:
      "Champagne Chiavari chairs, crisp table linens & banquet chafing sets delivered.",
    about:
      "Clean, reliable wedding and community banquet hire stocked locally in Gorton — every chair pad freshly steamed and steel chafing dishes polished before dispatch.",
    joinedLabel: "Joined Mar 2026",
    completedBookings: 109,
    serviceRadiusLabel:
      "Direct van delivery within 12 miles of Gorton Depot",
    mapPinPosition: { xPercent: 72, yPercent: 55 },
    nextSlot: "Tue 10:00",
    slots: ["Tue 10:00", "Thu 09:00", "Sat 08:30"],
    responseTime: "Replies ~1 hr",
    bannerVar: "var(--sv-banner-rentals)",
    rating: 4.7,
    reviews: 48,
    duration: "~2 hrs",
    tags: ["Chiavari chairs", "Chafing dishes"],
    startingPrice: 40,
    avatarColorClass: "bg-peach-d",
    bannerBgClass: "bg-peach/45",
    availableThisWeek: false,
    verified: true,
    recommendedOrder: 11,
    keywords: [
      "rentals",
      "chairs",
      "tables",
      "marquee",
      "chiavari",
      "hire",
    ],
    offerings: [
      {
        id: "chafing-set",
        name: "4-pan stainless chafing dish buffet bundle",
        description:
          "Includes full-size insulated chafers, 4h gel fuel cans & serving tongs.",
        duration: "Weekend hire",
        price: 40,
      },
      {
        id: "chiavari-50",
        name: "50 champagne-gold Chiavari chairs",
        description:
          "Ivory padded seats, Manchester ground-floor delivery and stacked collection.",
        duration: "Weekend hire",
        price: 140,
      },
      {
        id: "banquet-tables",
        name: "5 round 6ft banquet tables + pressed cloths",
        description:
          "Sturdy folding banqueting tables dressed with crisp heavyweight floor-length linen.",
        duration: "Weekend hire",
        price: 95,
      },
    ],
    ratingBreakdown: makeBreakdown(48),
    reviewList: [
      {
        id: "rev-ge-1",
        initials: "MO",
        author: "Mike O.",
        avatarClass: "bg-peach-d",
        rating: 5,
        timeAgo: "8d ago",
        comment:
          "Prompt 8am van drop-off before our venue setup crew even arrived.",
      },
      {
        id: "rev-ge-2",
        initials: "YN",
        author: "Yemi N.",
        avatarClass: "bg-leaf-700",
        rating: 5,
        timeAgo: "1m ago",
        comment:
          "Chairs looked brand new — not a single scuffed frame in 100 units.",
      },
    ],
    availability: buildAvailability(0),
  },
  {
    id: "tunde-handyman-errands",
    initials: "TH",
    name: "Tunde Handyman & Errands",
    categorySlug: "other-local-services",
    categoryLabel: "Other Local Services",
    area: "Moss Side",
    distance: "1.2 mi",
    tagline:
      "Precision shelf mounting, flat-pack builds & reliable same-day Manchester errands.",
    about:
      "Detail-focused local handyman for furniture assembly, TV wall mounts, curtain poles, minor joinery repairs and trusted Manchester estate errands with digital photo receipts.",
    joinedLabel: "Joined Feb 2026",
    completedBookings: 173,
    serviceRadiusLabel:
      "Covers Manchester city & south suburbs · Fully insured",
    mapPinPosition: { xPercent: 54, yPercent: 64 },
    nextSlot: "Tomorrow 14:00",
    slots: ["Tomorrow 14:00", "Sat 10:00", "Mon 13:00"],
    responseTime: "Replies ~20 min",
    bannerVar: "var(--sv-banner-local)",
    rating: 4.8,
    reviews: 39,
    duration: "~1.5 hrs",
    tags: ["Flat-pack assembly", "Local courier"],
    startingPrice: 22,
    avatarColorClass: "bg-leaf-900",
    bannerBgClass: "bg-mint/45",
    availableThisWeek: true,
    verified: true,
    recommendedOrder: 12,
    keywords: ["handyman", "repairs", "errands", "assembly", "delivery"],
    offerings: [
      {
        id: "odd-jobs",
        name: "1-hour odd-jobs & curtain rail mounting",
        description:
          "Brick or plasterboard anchors included for pictures, blinds, shelves or locks.",
        duration: "1h",
        price: 22,
      },
      {
        id: "wardrobe-build",
        name: "Flat-pack wardrobe or bed assembly",
        description:
          "IKEA / Argos assembly levelled, wall-anchored safely and packaging stacked neatly.",
        duration: "2h",
        price: 48,
      },
      {
        id: "tv-mount",
        name: "55\"–75\" TV bracket mount & cable tidy",
        description:
          "Stud & wiring scan, heavy-duty bracket installation and neat cord channel.",
        duration: "1h 30m",
        price: 55,
      },
    ],
    ratingBreakdown: makeBreakdown(39),
    reviewList: [
      {
        id: "rev-th-1",
        initials: "CK",
        author: "Claire K.",
        avatarClass: "bg-leaf-900",
        rating: 5,
        timeAgo: "3d ago",
        comment:
          "Built two double wardrobes and hung five frames perfectly level in one afternoon.",
      },
      {
        id: "rev-th-2",
        initials: "OA",
        author: "Ola A.",
        avatarClass: "bg-sky-d",
        rating: 5,
        timeAgo: "2w ago",
        comment:
          "Calm, tidy, and wears shoe covers without even asking.",
      },
    ],
    availability: buildAvailability(1),
  },
];

export const EXTRA_HOMEPAGE_PROVIDERS: ReadonlyArray<ServiceProvider> = [
  {
    id: "zuri-glow-skin-studio",
    initials: "ZG",
    name: "Zuri Glow Skin Studio",
    categorySlug: "hair-beauty",
    categoryLabel: "Beauty & Skincare",
    area: "Chorlton",
    distance: "3.2 mi",
    tagline:
      "Deep-cleanse glow facials, whipped shea body rituals & hyperpigmentation care.",
    about:
      "Holistic skincare studio in Chorlton formulated specifically for melanin-rich skin barriers, pairing clinical LED soothing with small-batch raw Ghanaian shea butter.",
    joinedLabel: "Joined Jan 2026",
    completedBookings: 284,
    serviceRadiusLabel:
      "Wilbraham Road Studio, Chorlton · 3 min walk from tram",
    mapPinPosition: { xPercent: 35, yPercent: 67 },
    nextSlot: "Tomorrow 12:00",
    slots: ["Tomorrow 12:00", "Sat 10:30", "Tue 14:00"],
    responseTime: "Replies ~20 min",
    bannerVar: "var(--sv-banner-catering)",
    rating: 4.9,
    reviews: 112,
    duration: "~50 min",
    tags: ["Deep cleanse facial", "Shea rituals"],
    startingPrice: 18,
    avatarColorClass: "bg-blush-d",
    bannerBgClass: "bg-blush/50",
    availableThisWeek: true,
    verified: true,
    defaultSaved: true,
    recommendedOrder: 13,
    keywords: ["facial", "skincare", "shea", "beauty", "chorlton"],
    offerings: [
      {
        id: "shea-hand-foot",
        name: "Whipped shea restorative scrub & mask",
        description:
          "Exfoliating raw black-soap polish and warm ivory shea wrap.",
        duration: "35m",
        price: 18,
      },
      {
        id: "glow-facial",
        name: "Deep cleanse melanin glow facial",
        description:
          "Ultrasonic extraction, vitamin C mist, lymphatic massage and soothing mask.",
        duration: "60m",
        price: 45,
      },
      {
        id: "led-pigment",
        name: "Glass-skin hydro peel & LED session",
        description:
          "Gentle lactic brightening peel finished with zero-downtime red LED therapy.",
        duration: "75m",
        price: 68,
      },
    ],
    ratingBreakdown: makeBreakdown(112),
    reviewList: [
      {
        id: "rev-zg-1",
        initials: "AB",
        author: "Ama B.",
        avatarClass: "bg-blush-d",
        rating: 5,
        timeAgo: "2d ago",
        comment:
          "My dark spots faded noticeably within two sessions without irritation.",
      },
      {
        id: "rev-zg-2",
        initials: "RN",
        author: "Rhea N.",
        avatarClass: "bg-gold-600",
        rating: 5,
        timeAgo: "9d ago",
        comment:
          "Calm room, lovely music and zero hard upselling at the end.",
      },
    ],
    availability: buildAvailability(2),
  },
  {
    id: "kofis-kitchen",
    initials: "KK",
    name: "Kofi's Kitchen",
    categorySlug: "catering-food",
    categoryLabel: "Food & Catering",
    area: "Moss Side",
    distance: "1.1 mi",
    tagline:
      "Ghanaian smoky jollof, Waakye weekend trays, kelewele & grilled tilapia.",
    about:
      "Authentic Ghanaian kitchen on Princess Parkway cooking slow-simmered shito, charcoal-grilled spiced tilapia, kelewele sweet plantain and generous catering bowls for Manchester homes and offices.",
    joinedLabel: "Joined Feb 2026",
    completedBookings: 261,
    serviceRadiusLabel:
      "Moss Side kitchen · Hot delivery across M14, M15, M16 & City",
    mapPinPosition: { xPercent: 52, yPercent: 60 },
    nextSlot: "Sat 12:30",
    slots: ["Sat 12:30", "Sun 14:00", "Wed 18:00"],
    responseTime: "Replies ~25 min",
    bannerVar: "var(--sv-banner-home)",
    rating: 4.8,
    reviews: 94,
    duration: "~45 min",
    tags: ["Party jollof", "Small chops"],
    startingPrice: 18,
    avatarColorClass: "bg-leaf-700",
    bannerBgClass: "bg-mint/55",
    availableThisWeek: true,
    verified: true,
    recommendedOrder: 14,
    keywords: ["ghanaian", "waakye", "jollof", "kelewele", "tilapia", "food"],
    offerings: [
      {
        id: "waakye-platter",
        name: "Ghanaian Waakye & shito sharing tray",
        description:
          "Slow-cooked sorghum leaf rice with gari, kelewele, stewed chicken and house shito.",
        duration: "45m prep",
        price: 18,
      },
      {
        id: "kofi-jollof-box",
        name: "Office lunch buffet box (serves 8)",
        description:
          "Ghanaian party jollof, ginger-chili grilled wings and crisp coleslaw.",
        duration: "1h prep",
        price: 54,
      },
      {
        id: "tilapia-feast",
        name: "Grilled banku & jumbo tilapia platters (4)",
        description:
          "Whole seasoned tilapia over charcoal with fresh blended green pepper salsa.",
        duration: "1h prep",
        price: 62,
      },
    ],
    ratingBreakdown: makeBreakdown(94),
    reviewList: [
      {
        id: "rev-kk-1",
        initials: "KM",
        author: "Kwame M.",
        avatarClass: "bg-leaf-700",
        rating: 5,
        timeAgo: "4d ago",
        comment:
          "Authentic Waakye leaf aroma and the green pepper sauce hits the exact spot.",
      },
      {
        id: "rev-kk-2",
        initials: "EL",
        author: "Ebony L.",
        avatarClass: "bg-gold-600",
        rating: 5,
        timeAgo: "16d ago",
        comment:
          "Ordered for a studio birthday lunch — portions were huge and piping hot.",
      },
    ],
    availability: buildAvailability(0),
  },
];

export const ALL_SERVICE_PROVIDERS: ReadonlyArray<ServiceProvider> = [
  ...SERVICE_PROVIDERS,
  ...EXTRA_HOMEPAGE_PROVIDERS,
];

export function getServiceProviderBySlug(
  slug: string,
): ServiceProvider | undefined {
  return ALL_SERVICE_PROVIDERS.find((provider) => provider.id === slug);
}
