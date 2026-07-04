import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../../context/PlayerContext";
import { getContentRecommendations } from "../../services/api";
import placeholder from "../../assets/music-placeholder.jpg";
import styles from "./RecommendationCard.module.css";

export function RecommendationCard() {
    const { currentSong, playSong, recentSongs } = usePlayer();

    const [recommendations, setRecommendations] = useState([]);

    const scrollRef = useRef(null);

    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    useEffect(() => {
        if (!currentSong) {
            setRecommendations([]);
            return; 
        }

        async function loadRecommendations() {
            try {
                const data = await getContentRecommendations(
                currentSong.id,
                recentSongs
);
                setRecommendations(data);

                setTimeout(updateArrows, 100);
            } catch (error) {
                console.error(error);
            }
        }

        loadRecommendations();
    }, [currentSong]);

    const updateArrows = () => {
        const el = scrollRef.current;

        if (!el) return;

        setShowLeft(el.scrollLeft > 5);

        setShowRight(
            el.scrollLeft <
                el.scrollWidth - el.clientWidth - 5
        );
    };

    const scrollLeft = () => {
        scrollRef.current?.scrollBy({
            left: -170,
            behavior: "smooth",
        });

        setTimeout(updateArrows, 300);
    };

    const scrollRight = () => {
        scrollRef.current?.scrollBy({
            left: 170,
            behavior: "smooth",
        });

        setTimeout(updateArrows, 300);
    };

    return (
        <section className={styles.container}>

            <div className={styles.headerRow}>
                <div className={styles.heading}>
                    <h3>Recommended</h3>
                    <p>Based on what's playing</p>
                </div>
            </div>

            {recommendations.length === 0 ? (

                <p className={styles.empty}>
                    No recommendations
                </p>

            ) : (

                <div className={styles.carouselWrapper}>

                    {showLeft && (
                        <button
                            className={`${styles.carouselArrow} ${styles.leftArrow}`}
                            onClick={scrollLeft}
                        >
                            ‹
                        </button>
                    )}

                    <div
                        ref={scrollRef}
                        className={styles.carousel}
                        onScroll={updateArrows}
                    >
                        {recommendations.map((song) => (

                           <div
                                key={song.id}
                               className={styles.card}
                               onClick={() => playSong(song, recommendations)}
                               >

                                <img
                                    src={song.cover_url || placeholder}
                                    alt={song.title}
                                    className={styles.cover}
                                />

                                <h4>{song.title}</h4>

                                <p>{song.artist}</p>

                            </div>

                        ))}
                    </div>

                    {showRight && (
                        <button
                            className={`${styles.carouselArrow} ${styles.rightArrow}`}
                            onClick={scrollRight}
                        >
                            ›
                        </button>
                    )}

                </div>

            )}

        </section>
    );
}