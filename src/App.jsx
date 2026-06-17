import { Header } from './components/Header/Header.jsx';
import { PlayerBar } from './components/PlayerBar/PlayerBar.jsx';
import { RightSidebar } from './components/RightSidebar/RightSidebar.jsx';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.appFrame}>
      <Header />
      <div className={styles.appShell}>
        <aside className={styles.leftPlaceholder} aria-label="Left sidebar placeholder" />
        <main className={styles.mainPlaceholder} aria-label="Main content placeholder" />
        <RightSidebar />
      </div>
      <PlayerBar />
    </div>
  );
}

export default App;
