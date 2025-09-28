import {useEffect, useState} from "react";
import {applyCurrentTheme, getTheme, type Theme, toggleTheme} from "../../themes.ts";
import styles from "./ThemeToggle.module.css";
import {BiMoon} from "react-icons/bi";
import {ImSun} from "react-icons/im";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getTheme());

  useEffect(() => {
    applyCurrentTheme();
  }, [theme]);

  const handleClick = () => {
    toggleTheme();
    setTheme(getTheme());
  }

  return (
    <button onClick={handleClick} className={styles.themeToggle}>
      {theme === 'light'
        ? <ImSun/>
        : <BiMoon/>
      }
    </button>
  );
}
