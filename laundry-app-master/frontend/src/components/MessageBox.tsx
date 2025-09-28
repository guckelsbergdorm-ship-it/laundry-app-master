import type {ReactNode} from "react";
import styles from "./MessageBox.module.css";
import clsx from "clsx";

export type Message = {
  type: 'error' | 'success';
  text: string | ReactNode;
}

export function MessageBox({message}: {message?: Message}) {
  if (!message) {
    return null;
  }
  return (
    <div className={clsx(styles.messageBox, styles[message.type])}>
      {message.text}
    </div>
  )
}
