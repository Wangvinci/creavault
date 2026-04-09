export type ContentType = "music" | "video" | "writing" | "podcast" | "film";

export type Content = {
  id: string;
  title: string;
  creator: string;
  creatorAddress: string;
  type: ContentType;
  cover: string;
  priceEth: string;
  priceUsdc: number;
  description: string;
  duration?: string;
  collectors: number;
  plays: number;
  createdAt: string;
  cid: string;
};

const gradients = [
  "from-violet-500 via-fuchsia-500 to-pink-500",
  "from-cyan-400 via-sky-500 to-indigo-600",
  "from-amber-400 via-orange-500 to-red-500",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-rose-400 via-pink-500 to-fuchsia-600",
  "from-indigo-500 via-purple-500 to-violet-600",
];

export const gradientFor = (id: string) =>
  gradients[
    [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % gradients.length
  ];

export const mockContent: Content[] = [
  {
    id: "midnight-orbit",
    title: "Midnight Orbit",
    creator: "Lyra Vance",
    creatorAddress: "0x7a3f...9e21",
    type: "music",
    cover: "midnight-orbit",
    priceEth: "0.012",
    priceUsdc: 32,
    description:
      "A 7-track ambient album recorded in a Reykjavík cabin. Synths, field recordings, and a sense of gravity.",
    duration: "42:18",
    collectors: 1284,
    plays: 92410,
    createdAt: "2026-03-12",
    cid: "bafybeigdyrz...4kxq",
  },
  {
    id: "after-the-static",
    title: "After the Static",
    creator: "Theo Marsh",
    creatorAddress: "0x91c2...4d8b",
    type: "film",
    cover: "after-the-static",
    priceEth: "0.05",
    priceUsdc: 138,
    description:
      "An indie short film about three radio operators in 1979 Alaska. Won Best Short at Sundance Online 2026.",
    duration: "28:42",
    collectors: 612,
    plays: 14820,
    createdAt: "2026-02-28",
    cid: "bafybeih7m3p...8jwt",
  },
  {
    id: "the-quiet-protocol",
    title: "The Quiet Protocol",
    creator: "Anya Reilly",
    creatorAddress: "0x3e1b...77fa",
    type: "writing",
    cover: "the-quiet-protocol",
    priceEth: "0.003",
    priceUsdc: 8,
    description:
      "Long-form essay on consensus mechanisms, power, and the people building them. 14 min read.",
    collectors: 3421,
    plays: 28100,
    createdAt: "2026-03-30",
    cid: "bafybeic4xn8...2plr",
  },
  {
    id: "deep-channel-07",
    title: "Deep Channel · Episode 07",
    creator: "Mira Okafor",
    creatorAddress: "0x88a5...1c33",
    type: "podcast",
    cover: "deep-channel-07",
    priceEth: "0",
    priceUsdc: 0,
    description:
      "Conversations with builders. This week: a luthier who tokenizes the wood she sources.",
    duration: "1:12:04",
    collectors: 5870,
    plays: 41230,
    createdAt: "2026-04-02",
    cid: "bafybeif2qst...9hke",
  },
  {
    id: "pelagic",
    title: "Pelagic",
    creator: "Kenji Soto",
    creatorAddress: "0x5d4e...0bc7",
    type: "video",
    cover: "pelagic",
    priceEth: "0.018",
    priceUsdc: 48,
    description:
      "A 12-minute drone documentary following Pacific fishing boats from dawn to harbour.",
    duration: "12:30",
    collectors: 941,
    plays: 19720,
    createdAt: "2026-03-20",
    cid: "bafybeiabcd9...7tyu",
  },
  {
    id: "ferns-and-frequencies",
    title: "Ferns & Frequencies",
    creator: "Iris Halden",
    creatorAddress: "0x2c10...e9d4",
    type: "music",
    cover: "ferns-and-frequencies",
    priceEth: "0.008",
    priceUsdc: 22,
    description:
      "Generative folk pieces tuned to forest soundscapes. Each mint includes the source patch.",
    duration: "31:47",
    collectors: 712,
    plays: 18290,
    createdAt: "2026-03-18",
    cid: "bafybeixx7yp...44mn",
  },
];

export const typeMeta: Record<ContentType, { label: string; icon: string }> = {
  music: { label: "Music", icon: "♪" },
  video: { label: "Video", icon: "▶" },
  writing: { label: "Writing", icon: "✎" },
  podcast: { label: "Podcast", icon: "◉" },
  film: { label: "Film", icon: "✦" },
};
