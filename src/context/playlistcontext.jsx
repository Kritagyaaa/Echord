import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import { getPlaylists, getPlaylist, getLikedSongs, getSongs } from "../services/api";

const playlistcontext = createContext();

export function PlaylistProvider({ children }) {

    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);

    const loadPlaylists = async () => {

        try {

            const data = await getPlaylists();

            setPlaylists(data);

            return data;

        } catch (err) {

            console.error("Failed to load playlists:", err);

            return [];

        }

    };

    const selectPlaylist = async (playlist) => {
        if (!playlist) {
            setSelectedPlaylist(null);
            return;
        }

        try {
            if (playlist.id === "liked-songs") {
                const likedSongs = await getLikedSongs();
                const totalDuration = likedSongs.reduce((sum, s) => sum + (s.duration || 0), 0);
                setSelectedPlaylist({
                    id: "liked-songs",
                    name: "Liked Songs",
                    description: "Songs you liked",
                    cover_url: null,
                    songs: likedSongs,
                    song_count: likedSongs.length,
                    total_duration: totalDuration,
                    isLikedSongs: true,
                });
            } else if (playlist.id === "trending") {
                const allSongs = await getSongs();
                const trendingSongs = allSongs.filter(s => !s.uploaded_by || s.uploaded_by === 1);
                const totalDuration = trendingSongs.reduce((sum, s) => sum + (s.duration || 0), 0);
                setSelectedPlaylist({
                    id: "trending",
                    name: "Trending",
                    description: "Trending songs right now",
                    cover_url: null,
                    songs: trendingSongs,
                    song_count: trendingSongs.length,
                    total_duration: totalDuration,
                });
            } else if (playlist.id === "latest-song") {
                const allSongs = await getSongs();
                const latestSongs = allSongs.filter(s => s.uploaded_by && s.uploaded_by !== 1);
                const totalDuration = latestSongs.reduce((sum, s) => sum + (s.duration || 0), 0);
                setSelectedPlaylist({
                    id: "latest-song",
                    name: "Latest song",
                    description: "Latest songs uploaded by creators",
                    cover_url: null,
                    songs: latestSongs,
                    song_count: latestSongs.length,
                    total_duration: totalDuration,
                });
            } else if (playlist.id === "mixes") {
                const allSongs = await getSongs();
                const mixesSongs = allSongs.slice(2, 9);
                const totalDuration = mixesSongs.reduce((sum, s) => sum + (s.duration || 0), 0);
                setSelectedPlaylist({
                    id: "mixes",
                    name: "Your top mixes",
                    description: "Mixes tailored to you",
                    cover_url: null,
                    songs: mixesSongs,
                    song_count: mixesSongs.length,
                    total_duration: totalDuration,
                });
            } else if (playlist.id === "featured") {
                const allSongs = await getSongs();
                const featuredSongs = allSongs.slice(1, 7);
                const totalDuration = featuredSongs.reduce((sum, s) => sum + (s.duration || 0), 0);
                setSelectedPlaylist({
                    id: "featured",
                    name: "Featured now",
                    description: "Featured songs on Spotify Clone",
                    cover_url: null,
                    songs: featuredSongs,
                    song_count: featuredSongs.length,
                    total_duration: totalDuration,
                });
            } else {
                const fullPlaylist = await getPlaylist(playlist.id);
                setSelectedPlaylist(fullPlaylist);
            }
        } catch (err) {
            console.error("Failed to load playlist details:", err);
            alert(err.message || "Failed to load playlist.");
        }
    };

    const refreshSelectedPlaylist = async () => {
        if (!selectedPlaylist) return;
        try {
            if (selectedPlaylist.id === "liked-songs") {
                const likedSongs = await getLikedSongs();
                const totalDuration = likedSongs.reduce((sum, s) => sum + (s.duration || 0), 0);
                setSelectedPlaylist(prev => ({
                    ...prev,
                    songs: likedSongs,
                    song_count: likedSongs.length,
                    total_duration: totalDuration,
                }));
            } else if (selectedPlaylist.id === "trending") {
                const allSongs = await getSongs();
                const trendingSongs = allSongs.filter(s => !s.uploaded_by || s.uploaded_by === 1);
                const totalDuration = trendingSongs.reduce((sum, s) => sum + (s.duration || 0), 0);
                setSelectedPlaylist(prev => ({
                    ...prev,
                    songs: trendingSongs,
                    song_count: trendingSongs.length,
                    total_duration: totalDuration,
                }));
            } else if (selectedPlaylist.id === "latest-song") {
                const allSongs = await getSongs();
                const latestSongs = allSongs.filter(s => s.uploaded_by && s.uploaded_by !== 1);
                const totalDuration = latestSongs.reduce((sum, s) => sum + (s.duration || 0), 0);
                setSelectedPlaylist(prev => ({
                    ...prev,
                    songs: latestSongs,
                    song_count: latestSongs.length,
                    total_duration: totalDuration,
                }));
            } else if (selectedPlaylist.id === "mixes") {
                const allSongs = await getSongs();
                const mixesSongs = allSongs.slice(2, 9);
                const totalDuration = mixesSongs.reduce((sum, s) => sum + (s.duration || 0), 0);
                setSelectedPlaylist(prev => ({
                    ...prev,
                    songs: mixesSongs,
                    song_count: mixesSongs.length,
                    total_duration: totalDuration,
                }));
            } else if (selectedPlaylist.id === "featured") {
                const allSongs = await getSongs();
                const featuredSongs = allSongs.slice(1, 7);
                const totalDuration = featuredSongs.reduce((sum, s) => sum + (s.duration || 0), 0);
                setSelectedPlaylist(prev => ({
                    ...prev,
                    songs: featuredSongs,
                    song_count: featuredSongs.length,
                    total_duration: totalDuration,
                }));
            } else {
                const fullPlaylist = await getPlaylist(selectedPlaylist.id);
                setSelectedPlaylist(fullPlaylist);
            }
        } catch (err) {
            console.error("Failed to refresh playlist:", err);
        }
    };

    useEffect(() => {

        loadPlaylists();

    }, []);

    useEffect(() => {
        const handleFocus = () => {
            if (localStorage.getItem('token')) {
                loadPlaylists();
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (localStorage.getItem('token')) {
                loadPlaylists();
                refreshSelectedPlaylist();
            }
        }, 10000); // 10 seconds
        return () => clearInterval(interval);
    }, [selectedPlaylist]);

    return (

        <playlistcontext.Provider
            value={{
                playlists,
                setPlaylists,
                loadPlaylists,
                selectedPlaylist,
                setSelectedPlaylist,
                selectPlaylist,
                refreshSelectedPlaylist,
            }}
        >
            {children}
        </playlistcontext.Provider>

    );

}

export function usePlaylists() {

    return useContext(playlistcontext);

}