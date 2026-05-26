/* 폼 입력 프리미티브: Label / TextInput / SelectInput / Stepper */

import { useState } from "react";
import { IconChevron } from "./Icons";
import { onlyDigits } from "../utils";
import styles from "./Fields.module.css";

const cx = (...args) => args.filter(Boolean).join(" ");

export function Label({ children, required, hint }) {
  return (
    <div className={styles.labelWrap}>
      <label className={styles.label}>
        {children}
        {required && <span className={styles.required}>*</span>}
      </label>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  error,
  suffix,
  inputMode,
  onBlur,
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div
      className={cx(
        styles.inputWrap,
        focus && !error && styles.focused,
        error && styles.error
      )}
    >
      <input
        className={styles.input}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={(e) => {
          setFocus(false);
          onBlur && onBlur(e);
        }}
        placeholder={placeholder}
        inputMode={inputMode}
        {...rest}
      />
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </div>
  );
}

export function SelectInput({ value, onChange, options, placeholder, error }) {
  const [focus, setFocus] = useState(false);
  const empty = !value;
  return (
    <div
      className={cx(
        styles.selectWrap,
        focus && !error && styles.focused,
        error && styles.error
      )}
    >
      <select
        className={cx(styles.select, empty && styles.empty)}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className={styles.chevron}>
        <IconChevron />
      </span>
    </div>
  );
}

export function Stepper({ value, onChange, min = 1, max = 9999, error }) {
  const num = parseInt(onlyDigits(value), 10);
  const safe = Number.isFinite(num) ? num : null;
  const dec = () => onChange(String(Math.max(min, (safe ?? min + 1) - 1)));
  const inc = () => onChange(String(Math.min(max, (safe ?? min - 1) + 1)));
  const [focus, setFocus] = useState(false);
  return (
    <div
      className={cx(
        styles.stepperWrap,
        focus && !error && styles.focused,
        error && styles.error
      )}
    >
      <button
        type="button"
        onClick={dec}
        className={styles.stepBtn}
        aria-label="감소"
      >
        −
      </button>
      <input
        className={styles.stepInput}
        value={value ?? ""}
        onChange={(e) => onChange(onlyDigits(e.target.value))}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        inputMode="numeric"
        placeholder="1"
      />
      <span className={styles.stepUnit}>롤</span>
      <button
        type="button"
        onClick={inc}
        className={styles.stepBtn}
        aria-label="증가"
      >
        +
      </button>
    </div>
  );
}
