import axios from "axios";
import { episodeResponseCache } from "./getEpisodes.utils.js";

const PROVIDER_NAMES = {
  kaa: "KickAssAnime",
  anikoto: "AniKoto",
  reanime: "ReAnime",
  anizone: "AniZone",
  aniwaves: "AniWaves",
  senshi: "Senshi",
  animegg: "AnimeGG",
  animenosub: "AnimeNoSub",
  mkissa: "MKissa",
  animedunya: "AnimeDunya",
  animeonsen: "AnimeOnsen",
  anipm: "Ani.pm",
};

export default async function getServers(animeId, episodeId, options = {}) {
  const api_url =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "/api";
  const numId = Number(animeId);
  const epNum = Number(episodeId);

  let rawData = null;

  // Use cached provider episodes if available
  if (episodeResponseCache.has(numId)) {
    rawData = episodeResponseCache.get(numId)?.rawProviders;
  }

  // Otherwise fetch from lightanime-api
  if (!rawData || Object.keys(rawData).length === 0) {
    try {
      const response = await axios.get(`${api_url}/episodes/${numId}`, {
        signal: options.signal,
      });
      rawData = response.data;
    } catch (err) {
      if (err?.name === "AbortError") return [];
      console.warn("Could not fetch episode provider data for servers:", err.message);
    }
  }

  const servers = [];
  const registered = new Set();

  if (rawData && typeof rawData === "object") {
    for (const [providerKey, pData] of Object.entries(rawData)) {
      if (providerKey === "reanime") continue;
      if (!pData?.episodes) continue;
      const subList = Array.isArray(pData.episodes.sub) ? pData.episodes.sub : [];
      const dubList = Array.isArray(pData.episodes.dub) ? pData.episodes.dub : [];

      const hasSub = subList.some((e) => Number(e.number) === epNum);
      const hasDub = dubList.some((e) => Number(e.number) === epNum);

      const serverLabel = PROVIDER_NAMES[providerKey] || providerKey.toUpperCase();

      if (hasSub) {
        const dataId = `${providerKey}_sub_${epNum}`;
        if (!registered.has(dataId)) {
          registered.add(dataId);
          servers.push({
            serverName: serverLabel,
            providerKey,
            type: "sub",
            data_id: dataId,
          });
        }
      }

      if (hasDub) {
        const dataId = `${providerKey}_dub_${epNum}`;
        if (!registered.has(dataId)) {
          registered.add(dataId);
          servers.push({
            serverName: serverLabel,
            providerKey,
            type: "dub",
            data_id: dataId,
          });
        }
      }
    }
  }

  // Fallback defaults if none found
  if (servers.length === 0) {
    servers.push(
      {
        serverName: "KickAssAnime",
        providerKey: "kaa",
        type: "sub",
        data_id: `kaa_sub_${epNum}`,
      },
      {
        serverName: "AniKoto",
        providerKey: "anikoto",
        type: "sub",
        data_id: `anikoto_sub_${epNum}`,
      },
      {
        serverName: "AniWaves",
        providerKey: "aniwaves",
        type: "sub",
        data_id: `aniwaves_sub_${epNum}`,
      }
    );
  }

  return servers;
}
