/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import getAnimeInfo from "@/src/utils/getAnimeInfo.utils";
import getEpisodes from "@/src/utils/getEpisodes.utils";
import getNextEpisodeSchedule from "../utils/getNextEpisodeSchedule.utils";
import getServers from "../utils/getServers.utils";
import getStreamInfo from "../utils/getStreamInfo.utils";

export const useWatch = (animeId, initialEpisodeId) => {
  const [error, setError] = useState(null);
  const [buffering, setBuffering] = useState(true);
  const [streamInfo, setStreamInfo] = useState(null);
  const [animeInfo, setAnimeInfo] = useState(null);
  const [episodes, setEpisodes] = useState(null);
  const [animeInfoLoading, setAnimeInfoLoading] = useState(false);
  const [totalEpisodes, setTotalEpisodes] = useState(null);
  const [seasons, setSeasons] = useState(null);
  const [servers, setServers] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [isFullOverview, setIsFullOverview] = useState(false);
  const [subtitles, setSubtitles] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [intro, setIntro] = useState(null);
  const [outro, setOutro] = useState(null);
  const [episodeId, setEpisodeId] = useState(null);
  const [activeEpisodeNum, setActiveEpisodeNum] = useState(null);
  const [activeServerId, setActiveServerId] = useState(null);
  const [activeServerType, setActiveServerType] = useState(null);
  const [activeServerName, setActiveServerName] = useState(null);
  const [serverLoading, setServerLoading] = useState(true);
  const [nextEpisodeSchedule, setNextEpisodeSchedule] = useState(null);
  const isServerFetchInProgress = useRef(false);
  const isStreamFetchInProgress = useRef(false);

  // Get environment variables
  const MEGAPLAY_BASE_URL = import.meta.env.VITE_BASE_IFRAME_URL;
  const VIDWISH_BASE_URL = import.meta.env.VITE_BASE_IFRAME_URL_2;

  useEffect(() => {
    setEpisodes(null);
    setEpisodeId(null);
    setActiveEpisodeNum(null);
    setServers(null);
    setActiveServerId(null);
    setStreamInfo(null);
    setStreamUrl(null);
    setSubtitles([]);
    setThumbnail(null);
    setIntro(null);
    setOutro(null);
    setBuffering(true);
    setServerLoading(true);
    setError(null);
    setAnimeInfo(null);
    setSeasons(null);
    setTotalEpisodes(null);
    setAnimeInfoLoading(true);
    isServerFetchInProgress.current = false;
    isStreamFetchInProgress.current = false;
  }, [animeId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setAnimeInfoLoading(true);
        const [animeData, episodesData] = await Promise.all([
          getAnimeInfo(animeId, false),
          getEpisodes(animeId),
        ]);
        setAnimeInfo(animeData?.data);
        setSeasons(animeData?.seasons);
        setEpisodes(episodesData?.episodes);
        setTotalEpisodes(episodesData?.totalEpisodes);
        const newEpisodeId =
          initialEpisodeId ||
          (episodesData?.episodes?.length > 0
            ? episodesData.episodes[0].id.match(/ep=(\d+)/)?.[1]
            : null);
        setEpisodeId(newEpisodeId);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError(err.message || "An error occurred.");
      } finally {
        setAnimeInfoLoading(false);
      }
    };
    fetchInitialData();
  }, [animeId]);

  useEffect(() => {
    const fetchNextEpisodeSchedule = async () => {
      try {
        const data = await getNextEpisodeSchedule(animeId);
        setNextEpisodeSchedule(data);
      } catch (err) {
        console.error("Error fetching next episode schedule:", err);
      }
    };
    fetchNextEpisodeSchedule();
  }, [animeId]);

  useEffect(() => {
    if (!episodes || !episodeId) {
      setActiveEpisodeNum(null);
      return;
    }
    const activeEpisode = episodes.find((episode) => {
      const match = episode.id.match(/ep=(\d+)/);
      return match && match[1] === episodeId;
    });
    const newActiveEpisodeNum = activeEpisode ? activeEpisode.episode_no : null;
    if (activeEpisodeNum !== newActiveEpisodeNum) {
      setActiveEpisodeNum(newActiveEpisodeNum);
    }
  }, [episodeId, episodes]);

  useEffect(() => {
    if (!episodeId || !episodes || isServerFetchInProgress.current) return;

    let mounted = true;
    const controller = new AbortController();
    isServerFetchInProgress.current = true;
    setServerLoading(true);

    const fetchServers = async () => {
      try {
        const data = await getServers(animeId, episodeId, { signal: controller.signal });
        if (!mounted) return;
        
        // Use case-insensitive filtering
        const allowedServers = ["hd-2", "vidstreaming", "vidcloud", "douvideo"];
        const filteredServers = data?.filter(
          (server) => allowedServers.includes(server.serverName.toLowerCase())
        ) || [];

        let serversList = [...filteredServers];
        
        // Add MegaPlay and VidWish servers
        serversList.push(
          {
            type: "sub",
            data_id: `megaplay_sub_${episodeId}`,
            server_id: "megaplay",
            serverName: "MegaPlay",
          },
          {
            type: "dub", 
            data_id: `megaplay_dub_${episodeId}`,
            server_id: "megaplay",
            serverName: "MegaPlay",
          },
          {
            type: "sub",
            data_id: `vidwish_sub_${episodeId}`,
            server_id: "vidwish", 
            serverName: "VidWish",
          },
          {
            type: "dub",
            data_id: `vidwish_dub_${episodeId}`,
            server_id: "vidwish",
            serverName: "VidWish",
          }
        );

        const savedServerName = localStorage.getItem("server_name");
        const savedServerType = localStorage.getItem("server_type");
        
        // Try to restore user preference first
        let initialServer =
          serversList.find(s => s.serverName.toLowerCase() === savedServerName?.toLowerCase() && s.type === savedServerType) ||
          serversList.find(s => s.serverName.toLowerCase() === savedServerName?.toLowerCase());
        
        // If none saved or invalid, prioritize SUB HD-2, then MegaPlay, then VidWish
        if (!initialServer) {
          initialServer = 
            serversList.find(s => s.serverName.toLowerCase() === "hd-2" && s.type === "sub") ||
            serversList.find(s => s.serverName.toLowerCase() === "megaplay" && s.type === "sub") ||
            serversList.find(s => s.serverName.toLowerCase() === "vidwish" && s.type === "sub") ||
            serversList.find(s => s.serverName.toLowerCase() === "vidstreaming" && s.type === "sub") ||
            serversList.find(s => s.serverName.toLowerCase() === "hd-2") ||
            serversList[0];
        }

        setServers(serversList);
        setActiveServerType(initialServer?.type);
        setActiveServerName(initialServer?.serverName);
        setActiveServerId(initialServer?.data_id);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Error fetching servers:", err);
        if (mounted) setError(err.message || "An error occurred.");
      } finally {
        if (mounted) {
          setServerLoading(false);
          isServerFetchInProgress.current = false;
        }
      }
    };

    fetchServers();

    return () => {
      mounted = false;
      try { controller.abort(); } catch (e) {
        // console.log(e.message);
      }
      isServerFetchInProgress.current = false;
    };
  }, [episodeId, episodes]);

  // Fetch stream info only when episodeId, activeServerId, and servers are ready
  useEffect(() => {
    if (
      !episodeId || !activeServerId || !servers || 
      isServerFetchInProgress.current || isStreamFetchInProgress.current
    ) return;

    const iframeServers = ["vidstreaming", "vidcloud", "douvideo", "megaplay", "vidwish"];

    if (iframeServers.includes(activeServerName?.toLowerCase()) && !serverLoading) {
      setBuffering(false);
      
      // Set stream URL for iframe servers
      const serverNameLower = activeServerName.toLowerCase();
      
      if (serverNameLower === "megaplay" && MEGAPLAY_BASE_URL) {
        const streamUrl = `${MEGAPLAY_BASE_URL}/${episodeId}/${activeServerType}`;
        setStreamUrl(streamUrl);
      } 
      else if (serverNameLower === "vidwish" && VIDWISH_BASE_URL) {
        const streamUrl = `${VIDWISH_BASE_URL}/${episodeId}/${activeServerType}`;
        setStreamUrl(streamUrl);
      }
      else if (serverNameLower === "hd-1" || serverNameLower === "hd-4") {
        // For HD-1 and HD-4, you might need to construct URLs or keep existing logic
        // If they also need special URL construction, add it here
        // For now, they'll rely on the existing getStreamInfo flow
        console.log(`HD server selected: ${activeServerName}, will use getStreamInfo`);
      }
      
      // For other iframe servers, return early but don't set streamUrl
      // They will be handled by the fetchStreamInfo below
      if (["megaplay", "vidwish"].includes(serverNameLower)) {
        return;
      }
    }

    const fetchStreamInfo = async () => {
      isStreamFetchInProgress.current = true;
      setBuffering(true);
      try {
        const server = servers.find((srv) => srv.data_id === activeServerId);
        if (server) {
          const data = await getStreamInfo(
            animeId, 
            episodeId,
            server.serverName.toLowerCase(),
            server.type.toLowerCase()
          );
          setStreamInfo(data);
          setStreamUrl(data?.streamingLink?.link?.file || null);
          setIntro(data?.streamingLink?.intro || null);
          setOutro(data?.streamingLink?.outro || null);
          
          const subtitles = data?.streamingLink?.tracks
            ?.filter((track) => track.kind === "captions")
            .map(({ file, label }) => ({ file, label })) || [];
          setSubtitles(subtitles);
          
          const thumbnailTrack = data?.streamingLink?.tracks?.find(
            (track) => track.kind === "thumbnails" && track.file
          );
          if (thumbnailTrack) setThumbnail(thumbnailTrack.file);
        } else {
          setError("No server found with the activeServerId.");
        }
      } catch (err) {
        console.error("Error fetching stream info:", err);
        setError(err.message || "An error occurred.");
      } finally {
        setBuffering(false);
        isStreamFetchInProgress.current = false;
      }
    };
    
    fetchStreamInfo();
  }, [episodeId, activeServerId, servers, activeServerName, activeServerType, MEGAPLAY_BASE_URL, VIDWISH_BASE_URL]);

  return {
    error,
    buffering,
    serverLoading,
    streamInfo,
    animeInfo,
    episodes,
    nextEpisodeSchedule,
    animeInfoLoading,
    totalEpisodes,
    seasons,
    servers,
    streamUrl,
    isFullOverview,
    setIsFullOverview,
    subtitles,
    thumbnail,
    intro,
    outro,
    episodeId,
    setEpisodeId,
    activeEpisodeNum,
    setActiveEpisodeNum,
    activeServerId,
    setActiveServerId,
    activeServerType,
    setActiveServerType,
    activeServerName,
    setActiveServerName,
  };
};