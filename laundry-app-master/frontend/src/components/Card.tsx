import styles from './Card.module.css';
import type {ReactNode} from "react";
import {camelToTitleCase} from "../utils.ts";

type Key<T> = keyof T | {
  key: keyof T,
  label?: ReactNode | string,
  valueRender?: (value: T[keyof T]) => ReactNode | string | undefined
};
type Props<T> = {
  data: T;
  columns: Key<T>[][] | 'all' | { 'except': Key<T>[] };
  title?: ReactNode | string;
  children?: ReactNode;
}

export function Card<T>({data, columns, children, title}: Props<T>) {
  const columnsAll = columns === 'all'
    ? [[...Object.keys(data as object)]] as Key<T>[][]
    : Array.isArray(columns)
      ? columns
      : [[...Object.keys(data as object)
        .filter(key => !columns.except.some(k => k === key))
      ]] as Key<T>[][];
  return (
    <div className={styles.card}>
      {title && (
        <h3>
          {title}
        </h3>
      )}
      <div className={styles.columns}>
        {columnsAll.map(column => (
          <div className={styles.column}>
            {column.map(key => {
              const keyString = typeof key !== 'object' ? key : key.key;
              const valueRender = typeof key !== 'object'
                ? (value: T[keyof T]) => String(value)
                : key.valueRender ?? ((value: T[keyof T]) => String(value));
              const keyRender = typeof key !== 'object'
                ? (k: keyof T) => camelToTitleCase(String(k))
                : key.label
                  ? () => key.label
                  : (k: keyof T) => camelToTitleCase(String(k));
              const value = data[keyString as keyof T];
              if (value === null || value === undefined || value === '') {
                return null;
              }
              return (
                <div className={styles.field}>
                  <div key={String(keyString)} className={styles.key}>
                    {keyRender ? keyRender(keyString) : camelToTitleCase(String(keyString))}
                  </div>
                  <div className={styles.value}>
                    {valueRender(value)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {children && <div className={styles.children}>
        {children}
      </div>}
    </div>
  )
}
