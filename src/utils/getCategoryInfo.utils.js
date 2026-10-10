import { fetchCategory } from "./anilist.adapter.js";

const getCategoryInfo = async (path, page = 1) => {
  try {
    const results = await fetchCategory(path, page);
    return results;
  } catch (err) {
    console.error("Error fetching category info:", err);
    return { data: [], totalPages: 1, totalPage: 1 };
  }
};

export default getCategoryInfo;
