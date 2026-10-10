import { createContext, useContext, useState, useEffect } from "react";
import getHomeInfo from "../utils/getHomeInfo.utils.js";

const HomeInfoContext = createContext();

export const HomeInfoProvider = ({ children }) => {
  const [homeInfo, setHomeInfo] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("homeInfoCache"));
      if (cached?.data && Date.now() - (cached.timestamp || 0) < 2 * 60 * 60 * 1000) {
        return cached.data;
      }
    } catch {
      return null;
    }
    return null;
  });

  const [homeInfoLoading, setHomeInfoLoading] = useState(() => !homeInfo);

  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeInfo = async () => {
      try {
        const data = await getHomeInfo();
        if (data) {
          setHomeInfo(data);
        }
      } catch (err) {
        console.error("Error fetching home info:", err);
        if (!homeInfo) {
          setError(err);
        }
      } finally {
        setHomeInfoLoading(false);
      }
    };

    fetchHomeInfo();
  }, []);

  return (
    <HomeInfoContext.Provider value={{ homeInfo, homeInfoLoading, error }}>
      {children}
    </HomeInfoContext.Provider>
  );
};

export const useHomeInfo = () => useContext(HomeInfoContext);
