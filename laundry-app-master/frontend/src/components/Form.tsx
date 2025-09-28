import {type FormEvent, type ReactNode, useState} from "react";
import {Button, type ButtonProps} from "./Button.tsx";
import styles from './Form.module.css';
import clsx from "clsx";
import {fetchWithCredentials} from "../utils.ts";
import {useNavigate} from "react-router";
import {type Message, MessageBox} from "./MessageBox.tsx";

type SubmitHandler<T> = { onSubmit: (data: T, setMessage: (error: Message) => void) => void };

type SubmitPost = {
  postUrl: string,
  redirectUrl?: string,
  onResult?: (response: Response, setMessage: (error: Message) => void) => boolean | void
};

type SubmitEvent<T> = SubmitHandler<T> | SubmitPost

type InputProps<T> = {
  label?: string | ReactNode;
  placeholder?: string;
  type?: 'text' | 'number' | 'password' | 'email' | 'textarea';
  options?: { label?: string, key: string }[];
  optional?: boolean;
  value?: T
  readOnly?: boolean;
}

export type Props<T> = {
  title?: string | ReactNode;
  inputs: {
    [K in keyof T]?: InputProps<T[K]>;
  }
  submit: {
    label: string | ReactNode;
    buttonProps?: ButtonProps;
  } & SubmitEvent<T>;
  center?: boolean;
  value?: Partial<T>;
  errorFormat?: (error: string) => string;
}

const titleCase = (str: string) => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function Input<T>({inputKey, config, value}: { inputKey: string, config: InputProps<T>, value?: T }) {
  const givenValue = value ?? config.value;
  const givenValueString = givenValue !== undefined && givenValue !== null ? String(givenValue) : undefined;
  if ('options' in config) {
    const options = config.options!;
    return (
      <select
        className={styles.formInput}
        name={inputKey}
        required={!config.optional}
        defaultValue={
          (givenValueString !== undefined)
            ? givenValueString
            : options.length > 0
              ? options[0].key
              : ''
        }
      >
        <option value="" disabled>{config.placeholder}</option>
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label ?? titleCase(option.key)}
          </option>
        ))}
      </select>
    )
  }
  if (config.type === 'textarea') {
    return (
      <textarea
        className={styles.formInput}
        placeholder={config.placeholder}
        name={String(inputKey)}
        required={!config.optional}
        value={givenValueString}
        readOnly={config.readOnly ?? false}
      />
    )
  }
  return (
    <input
      className={styles.formInput}
      type={config.type ?? 'text'}
      placeholder={config.placeholder}
      name={String(inputKey)}
      required={!config.optional}
      value={givenValueString}
      readOnly={config.readOnly ?? false}
    />
  )
}

export function Form<T>({title, inputs, submit, center = false, errorFormat, value}: Props<T>) {
  const navigate = useNavigate();
  const [message, setMessage] = useState<Message | null>(null);
  const keys = Object.keys(inputs) as (keyof T)[];
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {} as T;
    keys.forEach((key) => {
      const value = formData.get(String(key));
      data[key] = value as T[keyof T];
    })
    if ('postUrl' in submit) {
      fetchWithCredentials(submit.postUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }).then(async res => {
        if (submit.onResult) {
          if (submit.onResult(res, setMessage)) {
            return;
          }
        }
        if (!res.ok) {
          let text = await res.text();
          if (errorFormat) {
            text = errorFormat(text);
          }
          setMessage({type: 'error', text});
          return;
        }
        if (submit.redirectUrl) {
          navigate(submit.redirectUrl);
        }
      })
    }
    if ('onSubmit' in submit) {
      submit.onSubmit(data, setMessage);
    }
  }
  return (
    <div className={clsx(center && styles.center)}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {title && (
          typeof title === 'string'
            ? <h3>{title}</h3>
            : title
        )}
        {message && (
          <div className={styles.errorContainer}>
            <MessageBox message={message}/>
          </div>
        )}
        {keys.map((key) => {
          const config = inputs[key];
          if (!config) return null;
          return (
            <div key={String(key)} className={styles.field}>
              {config.label && <label>{config.label}</label>}
              <Input inputKey={String(key)} config={config} value={value ? value[key] : undefined}/>
            </div>
          )
        })}
        <Button
          {...submit.buttonProps}
          type="submit"
        >
          {submit.label}
        </Button>
      </form>
    </div>
  )
}
