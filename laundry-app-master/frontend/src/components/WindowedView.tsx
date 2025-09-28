import React, {useEffect} from "react";
import {clsx} from "clsx";
import styles from "./WindowedView.module.css";
import {Button} from "./Button.tsx";
import {Separator} from "./Separator.tsx";
import {useSearchParams} from "react-router";

export type Window = {
  name: string | React.ReactNode,
  body: React.ReactNode
}

export type Props = {
  windows: Window[],
  initialIndex?: number,
  urlParam?: string;
}

export function WindowedView({windows, initialIndex = 0, urlParam}: Props) {
  const [windowIndex, setWindowIndexInternal] = React.useState(initialIndex);
  const [urlParams, setUrlParams] = useSearchParams();
  const setWindowIndex = (index: number) => {
    setWindowIndexInternal(index);
    if (urlParam) {
      const newParams = new URLSearchParams(urlParams.toString());
      newParams.set(urlParam, index.toString());
      setUrlParams(newParams);
    }
  }
  useEffect(() => {
    if (urlParam) {
      const indexString = urlParams.get(urlParam);
      const index = indexString ? parseInt(indexString, 10) : null;
      if (index !== null && !isNaN(index)) {
        setWindowIndexInternal(index);
      }
    }
  }, [urlParam, urlParams]);
  return (
    <div className={styles.container}>
      <div className={styles.tabBar}>
        {windows.map((window, index) => (
          <Button
            key={index}
            className={clsx(styles.tab, windowIndex === index && styles.selected)}
            onClick={() => setWindowIndex(index)}
          >
            {window.name}
          </Button>
        ))}
      </div>
      <Separator/>
      <div className={styles.windowContainer}>
        {windows.map((window, index) => (
          windowIndex === index && (
            <div key={index}>
              {window.body}
            </div>
          )
        ))}
      </div>
    </div>
  )
}
