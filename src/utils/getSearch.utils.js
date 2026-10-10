import { fetchSearch } from "./anilist.adapter.js";

const getSearch = async (keyword, page = 1) => {
  try {
    const results = await fetchSearch(keyword, page);
    return results;
  } catch (err) {
    console.error("Error fetching search results:", err);
    return { data: [], totalPage: 1, totalPages: 1 };
  }
};

export default getSearch;
