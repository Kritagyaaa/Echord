import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import { getPlaylists } from "../services/api";

const playlistcontext = createContext();

export function PlaylistProvider({ children }) {

    const [playlists, setPlaylists] = useState([]);

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

    useEffect(() => {

        loadPlaylists();

    }, []);

    return (

        <playlistcontext.Provider
            value={{
                playlists,
                setPlaylists,
                loadPlaylists,
            }}
        >
            {children}
        </playlistcontext.Provider>

    );

}

export function usePlaylists() {

    return useContext(playlistcontext);

}