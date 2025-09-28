import Navbar from "./Navbar.tsx";
import * as React from "react";
import styles from './Layout.module.css';

function Footer() {
  return (
    <footer className={styles.footer}>
      <p>© {new Date().getFullYear()} Laundry App</p>
    </footer>
  );
}

export default function Layout({children}: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      <Navbar/>
      <div className={styles.mainContent}>
        <main>
          {children}
        </main>
      </div>
      <Footer/>
    </div>
  )
}
