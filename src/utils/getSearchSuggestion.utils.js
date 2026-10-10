import { fetchSearchSuggestions } from "./anilist.adapter.js";

const getSearchSuggestion = async (keyword) => {
  try {
    const results = await fetchSearchSuggestions(keyword);
    return results;
  } catch (err) {
    console.error("Error fetching search suggestions:", err);
    return [];
  }
};

export default getSearchSuggestion;
