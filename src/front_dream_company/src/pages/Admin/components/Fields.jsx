/* 관리자 페이지 폼 필드: AField / AInput / ASelect */

import { useState } from "react";
import { cx } from "../utils";
import { IconChev } from "./Icons";
import styles from "./Fields.module.css";

export function AField({ label, required, hint, children, error }) {
  return (
    <div>
      <div className={styles.head}>
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>
      {children}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

export function AInput({
  value,
  onChange,
  placeholder,
  suffix,
  prefix,
  inputMode,
  error,
  leftIcon,
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div
      className={cx(
        styles.inputWrap,
        focus && styles.focus,
        error && styles.errored
      )}
    >
      {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
      {prefix && <span className={styles.prefix}>{prefix}</span>}
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={placeholder}
        inputMode={inputMode}
        className={cx(
          styles.input,
          inputMode === "numeric" && styles.inputNumeric
        )}
      />
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </div>
  );
}

export function ASelect({ value, onChange, options, placeholder, error }) {
  const [focus, setFocus] = useState(false);
  const empty = !value;
  return (
    <div
      className={cx(
        styles.selectWrap,
        focus && styles.focus,
        error && styles.errored
      )}
    >
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className={cx(styles.select, empty && styles.selectEmpty)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) =>
          typeof o === "string" ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          )
        )}
      </select>
      <span className={styles.chev}>
        <IconChev />
      </span>
    </div>
  );
}
