import axios from "axios";

const LABEL_TO_PROVIDER = {
  kickassanime: "kaa",
  kaa: "kaa",
  anikoto: "anikoto",
  reanime: "reanime",
  anizone: "anizone",
  aniwaves: "aniwaves",
  senshi: "senshi",
  animegg: "animegg",
  animenosub: "animenosub",
  mkissa: "mkissa",
  animedunya: "animedunya",
  animeonsen: "animeonsen",
  anipm: "anipm",
  megaplay: "megaplay",
  vidwish: "vidwish",
};

export default async function getStreamInfo(animeId, episodeId, serverName, type = "sub") {
  const api_url =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "/api";
  const numId = Number(animeId);
  const epNum = Number(episodeId);
  const audio = (type || "sub").toLowerCase() === "dub" ? "dub" : "sub";

  const rawServer = String(serverName || "").toLowerCase().trim();
  const providerKey = LABEL_TO_PROVIDER[rawServer] || rawServer;

  try {
    const watchUrl = `${api_url}/watch/${providerKey}/${numId}/${audio}/${providerKey}-${epNum}`;
    const response = await axios.get(watchUrl);
    const data = response.data;

    const streams = Array.isArray(data.streams) ? data.streams : [];
    let primaryStream = null;
    let isIframe = false;

    if (providerKey === "aniwaves") {
      isIframe = true;
      const mp4Stream = streams.find((s) => s.type === "mp4" && s.url);
      const embedStream =
        streams.find((s) => s.type === "embed" && (s.server === "BYFMS" || s.server === "Vidplay")) ||
        streams.find((s) => s.type === "embed" && s.url);
      primaryStream = mp4Stream || embedStream || streams[0] || (data.stream_url ? { url: data.stream_url } : null);
    } else {
      primaryStream =
        streams.find((s) => s.type === "hls" || (s.url && s.url.includes(".m3u8"))) ||
        streams[0] ||
        (data.stream_url ? { url: data.stream_url } : null);
    }

    if (!primaryStream && !data.stream_url) {
      throw new Error(`No stream links found for ${providerKey} ep ${epNum}`);
    }

    const rawSubtitles = data.subtitles || primaryStream?.subtitles || [];
    const subtitles = (Array.isArray(rawSubtitles) ? rawSubtitles : [])
      .filter((s) => s && (s.url || s.file))
      .map((s) => ({
        file: s.url || s.file,
        label: s.label || s.lang || s.srclang || "English",
        kind: "captions",
      }));

    if (data.thumbnails_vtt || primaryStream?.thumbnails_vtt) {
      subtitles.push({
        file: data.thumbnails_vtt || primaryStream.thumbnails_vtt,
        kind: "thumbnails",
      });
    }

    const intro = data.intro || primaryStream?.intro || (
      data.intro_start != null && data.intro_end != null
        ? { start: data.intro_start, end: data.intro_end }
        : null
    );

    const outro = data.outro || primaryStream?.outro || (
      data.outro_start != null && data.outro_end != null
        ? { start: data.outro_start, end: data.outro_end }
        : null
    );

    const streamHeaders = {
      ...(data.headers || {}),
      ...(primaryStream?.headers || {}),
    };
    if (primaryStream?.referer && !streamHeaders.Referer && !streamHeaders.referer) {
      streamHeaders.Referer = primaryStream.referer;
    }

    return {
      streamingLink: {
        link: {
          file: primaryStream.url || data.stream_url,
          type: primaryStream.type || (isIframe ? "embed" : "hls"),
        },
        iframe: primaryStream.embed || primaryStream.url || data.embeds?.[0]?.url || null,
        headers: Object.keys(streamHeaders).length > 0 ? streamHeaders : null,
        isIframe,
        intro,
        outro,
        tracks: subtitles,
      },
    };
  } catch (error) {
    console.error(`Error fetching stream info from ${providerKey}:`, error.message);
    throw error;
  }
}
