import { fetchHomeData } from "./anilist.adapter.js";

const CACHE_KEY = "homeInfoCache";
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

export default async function getHomeInfo() {
  const currentTime = Date.now();
  try {
    const cachedData = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cachedData && currentTime - cachedData.timestamp < CACHE_DURATION) {
      return cachedData.data;
    }
  } catch {
    // ignore parse errors
  }

  try {
    const homeData = await fetchHomeData();
    if (!homeData || Object.keys(homeData).length === 0) {
      return null;
    }

    const dataToCache = {
      data: homeData,
      timestamp: currentTime,
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));
    } catch {
      // storage full
    }

    return homeData;
  } catch (error) {
    console.error("Error fetching home info:", error);
    try {
      const fallbackCached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (fallbackCached?.data) return fallbackCached.data;
    } catch {}
    return null;
  }
}
