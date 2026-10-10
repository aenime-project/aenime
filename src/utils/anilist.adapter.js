const ANILIST_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ANILIST_GRAPHQL_URL) ||
  "https://graphql.anilist.co";

export const GENRE_LIST = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

export function cleanText(html = "") {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatDate(fDate) {
  if (!fDate || !fDate.year) return "N/A";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const m = fDate.month ? months[fDate.month - 1] : "";
  const d = fDate.day ? fDate.day : "";
  return [m, d, fDate.year].filter(Boolean).join(" ");
}

export async function fetchAniList(query, variables = {}) {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`AniList GraphQL error: HTTP ${res.status}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message || "AniList GraphQL query error");
  }

  return json.data;
}

export function normalizeMedia(m, index = 0) {
  if (!m) return null;
  const titleEn = m.title?.english || m.title?.romaji || m.title?.native || "Unknown";
  const titleJp = m.title?.romaji || m.title?.native || m.title?.english || "Unknown";
  const poster = m.coverImage?.extraLarge || m.coverImage?.large || m.coverImage?.medium || "";
  const banner = m.bannerImage || poster;
  const ratingScore = m.averageScore ? (m.averageScore / 10).toFixed(1) : "N/A";
  const duration = m.duration ? `${m.duration}m` : "24m";
  const showType = (m.format || "TV").replace(/_/g, " ");
  const episodesCount = m.episodes || "?";
  const subCount = episodesCount;
  const dubCount = m.episodes ? Math.max(1, Math.floor(m.episodes * 0.8)) : "?";

  return {
    id: String(m.id),
    number: index + 1,
    title: titleEn,
    japanese_title: titleJp,
    name: titleEn,
    poster,
    banner,
    description: cleanText(m.description),
    adultContent: Boolean(m.isAdult),
    duration,
    showType,
    tvInfo: {
      rating: m.isAdult ? "18+" : (m.averageScore ? ratingScore : "PG-13"),
      quality: "HD",
      sub: subCount,
      dub: dubCount,
      eps: episodesCount,
      showType,
      duration,
      releaseDate: m.startDate?.year ? String(m.startDate.year) : "",
      episodeInfo: {
        sub: subCount,
        dub: dubCount,
      },
    },
  };
}

// -------------------------------------------------------------
// 1. HOME DASHBOARD QUERY
// -------------------------------------------------------------
const HOME_QUERY = `
query GetHomeData {
  spotlights: Page(page: 1, perPage: 10) {
    media(type: ANIME, sort: TRENDING_DESC, status_in: [RELEASING, FINISHED], isAdult: false) {
      id title { english romaji native }
      coverImage { extraLarge large medium } bannerImage
      description format episodes duration averageScore
      startDate { year month day } isAdult
    }
  }
  trending: Page(page: 1, perPage: 15) {
    media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
      id title { english romaji native }
      coverImage { extraLarge large medium } bannerImage
      format episodes duration averageScore isAdult
    }
  }
  topAiring: Page(page: 1, perPage: 10) {
    media(type: ANIME, status: RELEASING, sort: SCORE_DESC, isAdult: false) {
      id title { english romaji native }
      coverImage { extraLarge large medium }
      format episodes duration averageScore isAdult
    }
  }
  mostPopular: Page(page: 1, perPage: 10) {
    media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
      id title { english romaji native }
      coverImage { extraLarge large medium }
      format episodes duration averageScore isAdult
    }
  }
  mostFavorite: Page(page: 1, perPage: 10) {
    media(type: ANIME, sort: FAVOURITES_DESC, isAdult: false) {
      id title { english romaji native }
      coverImage { extraLarge large medium }
      format episodes duration averageScore isAdult
    }
  }
  latestCompleted: Page(page: 1, perPage: 10) {
    media(type: ANIME, status: FINISHED, sort: SCORE_DESC, isAdult: false) {
      id title { english romaji native }
      coverImage { extraLarge large medium }
      format episodes duration averageScore isAdult
    }
  }
  latestEpisode: Page(page: 1, perPage: 12) {
    media(type: ANIME, status: RELEASING, sort: UPDATED_AT_DESC, isAdult: false) {
      id title { english romaji native }
      coverImage { extraLarge large medium }
      description format episodes duration averageScore isAdult
    }
  }
  topUpcoming: Page(page: 1, perPage: 12) {
    media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) {
      id title { english romaji native }
      coverImage { extraLarge large medium }
      description format episodes duration averageScore isAdult
    }
  }
  recentlyAdded: Page(page: 1, perPage: 12) {
    media(type: ANIME, sort: START_DATE_DESC, isAdult: false) {
      id title { english romaji native }
      coverImage { extraLarge large medium }
      description format episodes duration averageScore isAdult
    }
  }
}
`;

export async function fetchHomeData() {
  const data = await fetchAniList(HOME_QUERY);

  const spotlights = (data.spotlights?.media || []).map((m, i) => normalizeMedia(m, i));
  const trending = (data.trending?.media || []).map((m, i) => normalizeMedia(m, i));
  const top_airing = (data.topAiring?.media || []).map((m, i) => normalizeMedia(m, i));
  const most_popular = (data.mostPopular?.media || []).map((m, i) => normalizeMedia(m, i));
  const most_favorite = (data.mostFavorite?.media || []).map((m, i) => normalizeMedia(m, i));
  const latest_completed = (data.latestCompleted?.media || []).map((m, i) => normalizeMedia(m, i));
  const latest_episode = (data.latestEpisode?.media || []).map((m, i) => normalizeMedia(m, i));
  const top_upcoming = (data.topUpcoming?.media || []).map((m, i) => normalizeMedia(m, i));
  const recently_added = (data.recentlyAdded?.media || []).map((m, i) => normalizeMedia(m, i));

  // Top Ten mapping
  const topten = {
    today: trending.slice(0, 10),
    week: most_popular.slice(0, 10),
    month: most_favorite.slice(0, 10),
  };

  return {
    spotlights,
    trending,
    topten,
    todaySchedule: [],
    top_airing,
    most_popular,
    most_favorite,
    latest_completed,
    latest_episode,
    top_upcoming,
    recently_added,
    genres: GENRE_LIST,
  };
}

// -------------------------------------------------------------
// 2. ANIME DETAILS QUERY
// -------------------------------------------------------------
const DETAILS_QUERY = `
query GetAnimeDetails($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { english romaji native }
    coverImage { extraLarge large medium }
    bannerImage
    description
    format
    episodes
    duration
    status
    averageScore
    isAdult
    genres
    synonyms
    season
    seasonYear
    startDate { year month day }
    endDate { year month day }
    studios {
      nodes { id name isAnimationStudio }
    }
    characters(sort: ROLE, perPage: 12) {
      edges {
        role
        node { id name { full } image { large medium } }
        voiceActors(language: JAPANESE, sort: RELEVANCE) {
          id name { full } image { large medium } language
        }
      }
    }
    relations {
      edges {
        relationType
        node {
          id type format
          title { english romaji native }
          coverImage { large medium }
        }
      }
    }
    recommendations(sort: RATING_DESC, perPage: 12) {
      nodes {
        mediaRecommendation {
          id title { english romaji native }
          coverImage { large medium }
          format episodes duration averageScore isAdult description
        }
      }
    }
  }
}
`;

const SEARCH_BY_SLUG_QUERY = `
query SearchBySlug($search: String) {
  Media(search: $search, type: ANIME) {
    id
  }
}
`;

export async function fetchAnimeDetails(idOrSlug, random = false) {
  let anilistId = null;

  if (random) {
    // Pick random media from trending
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const res = await fetchAniList(`
      query RandomMedia($page: Int) {
        Page(page: $page, perPage: 10) {
          media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { id }
        }
      }
    `, { page: randomPage });
    const items = res.Page?.media || [];
    if (items.length > 0) {
      anilistId = items[Math.floor(Math.random() * items.length)].id;
    } else {
      anilistId = 21; // fallback One Piece
    }
  } else if (/^\d+$/.test(String(idOrSlug))) {
    anilistId = parseInt(idOrSlug, 10);
  } else {
    // Slug to AniList search
    const cleanSlug = String(idOrSlug).replace(/-+/g, " ").replace(/\d+$/, "").trim();
    try {
      const match = await fetchAniList(SEARCH_BY_SLUG_QUERY, { search: cleanSlug || idOrSlug });
      anilistId = match.Media?.id;
    } catch {
      anilistId = null;
    }
  }

  if (!anilistId) {
    throw new Error(`Could not resolve AniList ID for: ${idOrSlug}`);
  }

  const result = await fetchAniList(DETAILS_QUERY, { id: anilistId });
  const m = result.Media;
  if (!m) throw new Error(`Anime not found for ID: ${anilistId}`);

  const titleEn = m.title?.english || m.title?.romaji || m.title?.native || "Unknown";
  const titleJp = m.title?.romaji || m.title?.native || m.title?.english || "Unknown";
  const poster = m.coverImage?.extraLarge || m.coverImage?.large || "";
  const ratingScore = m.averageScore ? (m.averageScore / 10).toFixed(1) : "N/A";
  const showType = (m.format || "TV").replace(/_/g, " ");
  const duration = m.duration ? `${m.duration}m` : "24m";

  const studios = (m.studios?.nodes || []).filter((s) => s.isAnimationStudio).map((s) => s.name);
  const producers = (m.studios?.nodes || []).filter((s) => !s.isAnimationStudio).map((s) => s.name);

  const charactersVoiceActors = (m.characters?.edges || []).map((edge) => {
    const vaList = (edge.voiceActors || []).map((va) => ({
      id: va.id,
      name: va.name?.full || "Unknown",
      poster: va.image?.large || va.image?.medium || "",
      cast: va.language || "Japanese",
    }));
    return {
      character: {
        id: edge.node?.id,
        name: edge.node?.name?.full || "Unknown",
        poster: edge.node?.image?.large || edge.node?.image?.medium || "",
        cast: edge.role || "Main",
      },
      voiceActors: vaList,
      voiceActor: vaList[0] || null,
    };
  });

  const recommended_data = (m.recommendations?.nodes || [])
    .map((r) => r.mediaRecommendation)
    .filter(Boolean)
    .map((rec, i) => normalizeMedia(rec, i));

  const related_data = (m.relations?.edges || [])
    .filter((e) => e.node?.type === "ANIME")
    .map((e, i) => normalizeMedia(e.node, i));

  const seasons = (m.relations?.edges || [])
    .filter(
      (e) =>
        e.node?.type === "ANIME" &&
        ["PREQUEL", "SEQUEL", "ALTERNATIVE", "SIDE_STORY"].includes(e.relationType)
    )
    .map((e) => ({
      id: String(e.node.id),
      season: e.node.title?.english || e.node.title?.romaji || "Related Season",
      season_poster: e.node.coverImage?.large || poster,
    }));

  const airedStart = formatDate(m.startDate);
  const airedEnd = formatDate(m.endDate);
  const aired = airedStart !== "N/A" ? `${airedStart} to ${airedEnd !== "N/A" ? airedEnd : "?"}` : "N/A";
  const premiered = m.season && m.seasonYear ? `${m.season} ${m.seasonYear}` : "N/A";

  const subCount = m.episodes || "?";
  const dubCount = m.episodes ? Math.max(1, Math.floor(m.episodes * 0.8)) : "?";

  return {
    data: {
      id: String(m.id),
      title: titleEn,
      japanese_title: titleJp,
      poster,
      banner: m.bannerImage || poster,
      showType,
      animeInfo: {
        Overview: cleanText(m.description),
        Japanese: m.title?.native || titleJp,
        Synonyms: (m.synonyms || []).join(", ") || "None",
        Aired: aired,
        Premiered: premiered,
        Duration: duration,
        Status: m.status ? m.status.replace(/_/g, " ") : "Unknown",
        "MAL Score": ratingScore,
        Genres: m.genres || [],
        Studios: studios.length ? studios : ["Unknown"],
        Producers: producers.length ? producers : ["Unknown"],
        tvInfo: {
          rating: m.isAdult ? "18+" : (m.averageScore ? ratingScore : "PG-13"),
          quality: "HD",
          sub: subCount,
          dub: dubCount,
          showType,
          duration,
        },
      },
      charactersVoiceActors,
      recommended_data,
      related_data,
    },
    seasons,
  };
}

// -------------------------------------------------------------
// 3. SEARCH QUERY
// -------------------------------------------------------------
const SEARCH_QUERY = `
query SearchAnime($search: String, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      currentPage
      lastPage
      hasNextPage
      total
    }
    media(search: $search, type: ANIME, sort: SEARCH_MATCH, isAdult: false) {
      id
      title { english romaji native }
      coverImage { extraLarge large medium }
      description
      format
      episodes
      duration
      averageScore
      isAdult
    }
  }
}
`;

export async function fetchSearch(keyword, page = 1) {
  const data = await fetchAniList(SEARCH_QUERY, {
    search: keyword,
    page: Number(page) || 1,
    perPage: 20,
  });

  const mediaList = data.Page?.media || [];
  const totalPages = data.Page?.pageInfo?.lastPage || 1;

  return {
    data: mediaList.map((m, i) => normalizeMedia(m, i)),
    totalPage: totalPages,
    totalPages,
  };
}

export async function fetchSearchSuggestions(keyword) {
  if (!keyword || keyword.trim().length < 2) return [];
  const data = await fetchAniList(SEARCH_QUERY, {
    search: keyword,
    page: 1,
    perPage: 6,
  });

  const mediaList = data.Page?.media || [];
  return mediaList.map((m) => ({
    id: String(m.id),
    title: m.title?.english || m.title?.romaji || "Unknown",
    japanese_title: m.title?.romaji || m.title?.native || "Unknown",
    poster: m.coverImage?.large || m.coverImage?.medium || "",
    duration: m.duration ? `${m.duration}m` : "24m",
    showType: (m.format || "TV").replace(/_/g, " "),
  }));
}

// -------------------------------------------------------------
// 4. CATEGORY & GENRE QUERY
// -------------------------------------------------------------
export async function fetchCategory(path, page = 1) {
  const p = (path || "").toLowerCase();
  const pageNum = Number(page) || 1;

  let queryFilter = "";
  const variables = { page: pageNum, perPage: 20 };

  if (p.startsWith("genre/")) {
    const rawGenre = p.replace("genre/", "").replace(/-/g, " ");
    const matchedGenre =
      GENRE_LIST.find((g) => g.toLowerCase() === rawGenre.toLowerCase()) || rawGenre;
    variables.genre = matchedGenre;
    queryFilter = "genre: $genre, sort: POPULARITY_DESC";
  } else if (p.includes("top-airing")) {
    queryFilter = "status: RELEASING, sort: SCORE_DESC";
  } else if (p.includes("most-popular")) {
    queryFilter = "sort: POPULARITY_DESC";
  } else if (p.includes("most-favorite")) {
    queryFilter = "sort: FAVOURITES_DESC";
  } else if (p.includes("completed")) {
    queryFilter = "status: FINISHED, sort: SCORE_DESC";
  } else if (p.includes("recently-updated") || p.includes("recently-added")) {
    queryFilter = "sort: UPDATED_AT_DESC";
  } else if (p.includes("top-upcoming")) {
    queryFilter = "status: NOT_YET_RELEASED, sort: POPULARITY_DESC";
  } else if (p.includes("movie")) {
    queryFilter = "format: MOVIE, sort: POPULARITY_DESC";
  } else if (p.includes("special")) {
    queryFilter = "format: SPECIAL, sort: POPULARITY_DESC";
  } else if (p.includes("ova")) {
    queryFilter = "format: OVA, sort: POPULARITY_DESC";
  } else if (p.includes("ona")) {
    queryFilter = "format: ONA, sort: POPULARITY_DESC";
  } else if (p.includes("tv")) {
    queryFilter = "format: TV, sort: POPULARITY_DESC";
  } else if (p.startsWith("az-list/")) {
    const letter = p.replace("az-list/", "");
    if (letter && letter !== "other" && letter !== "0-9") {
      variables.search = letter.toUpperCase();
      queryFilter = "search: $search, sort: TITLE_ROMAJI";
    } else {
      queryFilter = "sort: TITLE_ROMAJI";
    }
  } else {
    queryFilter = "sort: POPULARITY_DESC";
  }

  const varDefs = ["$page: Int", "$perPage: Int"];
  if (variables.genre) varDefs.push("$genre: String");
  if (variables.search) varDefs.push("$search: String");

  const dynamicQuery = `
    query GetCategory(${varDefs.join(", ")}) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          currentPage
          lastPage
          hasNextPage
          total
        }
        media(type: ANIME, isAdult: false, ${queryFilter}) {
          id
          title { english romaji native }
          coverImage { extraLarge large medium }
          description
          format
          episodes
          duration
          averageScore
          isAdult
        }
      }
    }
  `;

  const data = await fetchAniList(dynamicQuery, variables);
  const mediaList = data.Page?.media || [];
  const totalPages = data.Page?.pageInfo?.lastPage || 1;

  return {
    data: mediaList.map((m, i) => normalizeMedia(m, i)),
    totalPages,
    totalPage: totalPages,
  };
}

// -------------------------------------------------------------
// 5. SCHEDULE QUERY
// -------------------------------------------------------------
export async function fetchSchedule(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setHours(0, 0, 0, 0);
  const startDay = Math.floor(d.getTime() / 1000);
  const endDay = startDay + 86400;

  const query = `
    query GetDaySchedule($start: Int, $end: Int) {
      Page(page: 1, perPage: 50) {
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
          id
          episode
          airingAt
          media {
            id
            title { english romaji native }
            format
          }
        }
      }
    }
  `;

  const res = await fetchAniList(query, { start: startDay, end: endDay });
  const list = res.Page?.airingSchedules || [];

  return list.map((s) => {
    const dateObj = new Date(s.airingAt * 1000);
    const timeFormatted = dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const title = s.media?.title?.english || s.media?.title?.romaji || "Unknown Anime";
    return {
      id: String(s.media?.id),
      time: timeFormatted,
      title,
      episode_no: s.episode,
    };
  });
}

export async function fetchNextSchedule(id) {
  const query = `
    query GetNextAir($id: Int) {
      Media(id: $id, type: ANIME) {
        nextAiringEpisode {
          episode
          airingAt
        }
      }
    }
  `;
  const res = await fetchAniList(query, { id: Number(id) });
  const next = res.Media?.nextAiringEpisode;
  if (!next?.airingAt) return null;

  return {
    nextEpisodeSchedule: new Date(next.airingAt * 1000).toISOString(),
  };
}

// -------------------------------------------------------------
// 6. QTIP HOVER QUERY
// -------------------------------------------------------------
export async function fetchQtip(idOrSlug) {
  let anilistId = Number(idOrSlug);
  if (isNaN(anilistId)) {
    const clean = String(idOrSlug).replace(/-+/g, " ").replace(/\d+$/, "").trim();
    try {
      const match = await fetchAniList(SEARCH_BY_SLUG_QUERY, { search: clean });
      anilistId = match.Media?.id;
    } catch {
      return null;
    }
  }

  const query = `
    query GetQtip($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { english romaji native }
        description
        format
        episodes
        duration
        averageScore
        status
        genres
        synonyms
        startDate { year month day }
      }
    }
  `;

  const res = await fetchAniList(query, { id: anilistId });
  const m = res.Media;
  if (!m) return null;

  const titleEn = m.title?.english || m.title?.romaji || "Unknown";
  const titleJp = m.title?.romaji || m.title?.native || "Unknown";
  const rating = m.averageScore ? (m.averageScore / 10).toFixed(1) : "N/A";
  const subCount = m.episodes || "?";
  const dubCount = m.episodes ? Math.max(1, Math.floor(m.episodes * 0.8)) : "?";

  return {
    id: String(m.id),
    title: titleEn,
    japaneseTitle: titleJp,
    rating,
    quality: "HD",
    subCount,
    dubCount,
    episodeCount: m.episodes || "?",
    type: (m.format || "TV").replace(/_/g, " "),
    description: cleanText(m.description),
    Synonyms: (m.synonyms || []).slice(0, 3).join(", "),
    airedDate: formatDate(m.startDate),
    status: m.status ? m.status.replace(/_/g, " ") : "Unknown",
    genres: m.genres || [],
    watchLink: String(m.id),
  };
}

// -------------------------------------------------------------
// 7. VOICE ACTORS & PRODUCERS
// -------------------------------------------------------------
export async function fetchVoiceActors(id, page = 1) {
  const query = `
    query GetCast($id: Int, $page: Int) {
      Media(id: $id, type: ANIME) {
        characters(page: $page, perPage: 12, sort: ROLE) {
          pageInfo { total lastPage hasNextPage }
          edges {
            role
            node { id name { full } image { large medium } }
            voiceActors(language: JAPANESE, sort: RELEVANCE) {
              id name { full } image { large medium } language
            }
          }
        }
      }
    }
  `;
  try {
    const res = await fetchAniList(query, { id: Number(id), page: Number(page) || 1 });
    const charData = res.Media?.characters;
    const edges = charData?.edges || [];

    const list = edges.map((edge) => {
      const vaList = (edge.voiceActors || []).map((va) => ({
        id: va.id,
        name: va.name?.full || "Unknown",
        poster: va.image?.large || va.image?.medium || "",
        cast: va.language || "Japanese",
      }));
      return {
        character: {
          id: edge.node?.id,
          name: edge.node?.name?.full || "Unknown",
          poster: edge.node?.image?.large || edge.node?.image?.medium || "",
          cast: edge.role || "Main",
        },
        voiceActors: vaList,
        voiceActor: vaList[0] || null,
      };
    });

    return {
      data: list,
      totalPages: charData?.pageInfo?.lastPage || 1,
      hasNextPage: charData?.pageInfo?.hasNextPage || false,
    };
  } catch {
    return { data: [], totalPages: 1, hasNextPage: false };
  }
}

export async function fetchProducerAnime(producerName, page = 1) {
  const cleanName = (producerName || "").replace(/-/g, " ");
  const query = `
    query GetProducerAnime($search: String, $page: Int) {
      Studio(search: $search) {
        id
        name
        media(page: $page, perPage: 20, sort: POPULARITY_DESC) {
          pageInfo { lastPage }
          nodes {
            id
            title { english romaji native }
            coverImage { extraLarge large medium }
            description
            format
            episodes
            duration
            averageScore
            isAdult
          }
        }
      }
    }
  `;
  try {
    const res = await fetchAniList(query, {
      search: cleanName,
      page: Number(page) || 1,
    });
    const mediaNodes = res.Studio?.media?.nodes || [];
    return {
      data: mediaNodes.map((m, i) => normalizeMedia(m, i)),
      totalPages: res.Studio?.media?.pageInfo?.lastPage || 1,
    };
  } catch {
    return { data: [], totalPages: 1 };
  }
}
