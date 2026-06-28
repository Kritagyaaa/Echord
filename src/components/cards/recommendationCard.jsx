import { useEffect, useState } from "react";
import { usePlayer } from "../../context/playercontext";
import { getContentRecommendations } from "../../services/api";
import styles from "./RecommendationCard.module.css";

export function RecommendationCard() {

    const { currentSong } = usePlayer();

    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        console.log("Current Song:", currentSong);
        if (!currentSong) return;

        async function loadRecommendations() {

            try {

                const data =
                    await getContentRecommendations(currentSong.id);
                    console.log("Recommendations:", data);

                setRecommendations(data);

            } catch (error) {

                console.error(error);

            }

        }

        loadRecommendations();

    }, [currentSong]);

    return (

        <section>

            <div className={styles.heading}>
    <h3>Recommended </h3>
    <p>Based on what's playing</p>
             </div>

            {recommendations.length === 0 ? (

                <p>No recommendations</p>

            ) : (

                recommendations.map((song) => (

                    <div key={song.id}>

                        <strong>{song.title}</strong>

                        <br />

                        <small>{song.artist}</small>

                    </div>

                ))

            )}

        </section>

    );

}