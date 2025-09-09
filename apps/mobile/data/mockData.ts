export const MOCK_TAGS = ["rust", "cycling", "coffee", "sales", "design"];

export const seedContacts = [
  {
    id: "c1",
    name: "Alex Rivera",
    identifiers: [
      { type: "email", value: "alex@trailbrew.com" },
      { type: "linkedin", value: "linkedin.com/in/alexrivera" },
    ],
    company: "Trailbrew",
    title: "Platform Engineer",
    city: "Austin",
    country: "US",
    groups: ["DevCon 2025", "Austin Trip"],
    tags: ["rust", "cycling"],
    note: "Met at booth B12. Bikepacking + distributed systems.",
    starred: true,
    lastInteraction: "2025-08-21",
  },
  {
    id: "c2",
    name: "Bianca Lee",
    identifiers: [
      { type: "email", value: "bianca@beanlab.co" },
      { type: "x", value: "@biancacodes" },
    ],
    company: "BeanLab",
    title: "Founder",
    city: "San Francisco",
    country: "US",
    groups: ["Coffee Expo 2025"],
    tags: ["coffee", "design"],
    note: "Espresso geek. Loves visual brand systems.",
    starred: false,
    lastInteraction: "2025-08-03",
  },
  {
    id: "c3",
    name: "Dmitri Pavlov",
    identifiers: [{ type: "email", value: "d@meshgrid.dev" }],
    company: "MeshGrid",
    title: "CTO",
    city: "Barcelona",
    country: "ES",
    groups: ["KubeCon 2025"],
    tags: ["sales"],
    note: "Edge inference at the booth. Interested in collab.",
    starred: false,
    lastInteraction: "2025-07-29",
  },
];

export const seedGroups = [
  {
    id: "g1",
    name: "DevCon 2025",
    type: "event",
    dates: { start: "2025-06-11", end: "2025-06-14" },
    location: "Austin, TX",
    members: ["c1"],
  },
  {
    id: "g2",
    name: "Austin Trip",
    type: "trip",
    dates: { start: "2025-10-01", end: "2025-10-06" },
    location: "Austin, TX",
    members: ["c1"],
  },
  {
    id: "g3",
    name: "Coffee Expo 2025",
    type: "event",
    dates: { start: "2025-04-21", end: "2025-04-23" },
    location: "Portland, OR",
    members: ["c2"],
  },
  {
    id: "g4",
    name: "KubeCon 2025",
    type: "event",
    dates: { start: "2025-05-18", end: "2025-05-22" },
    location: "Barcelona, ES",
    members: ["c3"],
  },
];

export const seedSuggestions = [
  {
    id: "s1",
    contactId: "c1",
    field: "title",
    proposed: "Senior Platform Engineer",
    confidence: 0.86,
    source: "linkedin",
  },
  {
    id: "s2",
    contactId: "c2",
    field: "company",
    proposed: "BeanLab Co.",
    confidence: 0.72,
    source: "domain",
  },
];