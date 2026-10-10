import { fetchAniList } from "./anilist.adapter.js";

const DEFAULT_TOP_SEARCH = [
  { title: "Solo Leveling", link: "/search?keyword=Solo%20Leveling" },
  { title: "One Piece", link: "/search?keyword=One%20Piece" },
  { title: "Jujutsu Kaisen", link: "/search?keyword=Jujutsu%20Kaisen" },
  { title: "Demon Slayer", link: "/search?keyword=Demon%20Slayer" },
  { title: "Attack on Titan", link: "/search?keyword=Attack%20on%20Titan" },
  { title: "Bleach", link: "/search?keyword=Bleach" },
  { title: "Chainsaw Man", link: "/search?keyword=Chainsaw%20Man" },
  { title: "Naruto: Shippuden", link: "/search?keyword=Naruto%3A%20Shippuden" },
];

const getTopSearch = async () => {
  const storedData = localStorage.getItem("topSearch");
  if (storedData) {
    try {
      const { data, timestamp } = JSON.parse(storedData);
      if (Date.now() - timestamp <= 7 * 24 * 60 * 60 * 1000 && Array.isArray(data) && data.length > 0) {
        return data.map((item) =>
          typeof item === "string"
            ? { title: item, link: `/search?keyword=${encodeURIComponent(item)}` }
            : item
        );
      }
    } catch {}
  }

  try {
    const res = await fetchAniList(`
      query TopSearch {
        Page(page: 1, perPage: 10) {
          media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
            title { english romaji }
          }
        }
      }
    `);
    const results = (res.Page?.media || [])
      .map((m) => {
        const title = m.title?.english || m.title?.romaji;
        return title
          ? { title, link: `/search?keyword=${encodeURIComponent(title)}` }
          : null;
      })
      .filter(Boolean);

    if (results.length) {
      try {
        localStorage.setItem(
          "topSearch",
          JSON.stringify({ data: results, timestamp: Date.now() })
        );
      } catch {}
      return results;
    }
    return DEFAULT_TOP_SEARCH;
  } catch (error) {
    console.error("Error fetching top search data:", error);
    return DEFAULT_TOP_SEARCH;
  }
};

export default getTopSearch;
