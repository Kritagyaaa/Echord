import { Header } from './components/Header/Header.jsx';
import { LibrarySidebar } from './components/LibrarySidebar/LibrarySidebar.jsx';
import { PlayerBar } from './components/PlayerBar/PlayerBar.jsx';
import { RightSidebar } from './components/RightSidebar/RightSidebar.jsx';
import styles from './App.module.css';
import { useState } from "react";
import { PlaylistView } from "./components/PlaylistView/PlaylistView.jsx";

function App() {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  return (
    <div className={styles.appFrame}>
      <Header />
      <div className={styles.appShell}>
        <LibrarySidebar
  onPlaylistSelect={setSelectedPlaylist}
  selectedPlaylist={selectedPlaylist}
/>
        <main
  className={styles.mainPlaceholder}
  aria-label="Main content"
>
  <PlaylistView playlist={selectedPlaylist} />
</main>
        <RightSidebar />
      </div>
      <PlayerBar />
    </div>
  );
}

export default App;
