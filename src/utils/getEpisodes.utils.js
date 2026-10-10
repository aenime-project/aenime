import axios from "axios";
import { fetchAnimeDetails } from "./anilist.adapter.js";

// In-memory cache for provider episode payloads
export const episodeResponseCache = new Map();

export default async function getEpisodes(id) {
  const api_url =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "/api";

  let anilistId = Number(id);
  if (isNaN(anilistId)) {
    try {
      const details = await fetchAnimeDetails(id);
      anilistId = Number(details?.data?.id);
    } catch (err) {
      console.warn("Could not resolve slug to AniList ID:", err.message);
      anilistId = id;
    }
  }

  // Check cache
  if (episodeResponseCache.has(anilistId)) {
    return episodeResponseCache.get(anilistId);
  }

  try {
    const response = await axios.get(`${api_url}/episodes/${anilistId}`);
    const data = response.data || {};

    // Filter valid provider results
    const providers = Object.entries(data).filter(
      ([key, val]) =>
        key !== "mappings" &&
        key !== "page" &&
        key !== "type" &&
        val &&
        val.episodes &&
        !val.error
    );

    let maxEpisodes = 0;
    const episodesMap = new Map();

    // Aggregate episodes across all available providers
    for (const [, pData] of providers) {
      const subList = Array.isArray(pData.episodes?.sub) ? pData.episodes.sub : [];
      const dubList = Array.isArray(pData.episodes?.dub) ? pData.episodes.dub : [];

      for (const item of [...subList, ...dubList]) {
        const epNum = Number(item.number);
        if (!epNum || isNaN(epNum)) continue;

        if (epNum > maxEpisodes) maxEpisodes = epNum;

        if (!episodesMap.has(epNum)) {
          episodesMap.set(epNum, {
            id: `${anilistId}?ep=${epNum}`,
            episode_no: epNum,
            title: item.title || `Episode ${epNum}`,
            japanese_title: item.title || `Episode ${epNum}`,
            filler: Boolean(item.filler),
            thumbnail: item.thumbnail || item.image || null,
            duration: item.duration || null,
          });
        }
      }
    }

    // Sort episodes sequentially 1..N
    const sortedEpisodes = Array.from(episodesMap.values()).sort(
      (a, b) => a.episode_no - b.episode_no
    );

    // If no provider episodes were scraped, synthesize from AniList/fallback
    if (sortedEpisodes.length === 0) {
      try {
        const details = await fetchAnimeDetails(anilistId);
        const epCount = Number(details?.data?.animeInfo?.tvInfo?.eps) || 1;
        for (let i = 1; i <= epCount; i++) {
          sortedEpisodes.push({
            id: `${anilistId}?ep=${i}`,
            episode_no: i,
            title: `Episode ${i}`,
            japanese_title: `Episode ${i}`,
            filler: false,
            thumbnail: null,
          });
        }
        maxEpisodes = epCount;
      } catch {}
    }

    const result = {
      totalEpisodes: maxEpisodes || sortedEpisodes.length,
      episodes: sortedEpisodes,
      rawProviders: data,
      anilistId,
    };

    episodeResponseCache.set(anilistId, result);
    return result;
  } catch (error) {
    console.error("Error fetching episodes from lightanime-api:", error);
    // Graceful fallback
    return {
      totalEpisodes: 0,
      episodes: [],
      rawProviders: {},
      anilistId,
    };
  }
}
