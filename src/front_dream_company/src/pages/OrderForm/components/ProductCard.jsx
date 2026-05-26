/* 한 줄의 주문 상품 카드 */

import { IconTrash } from "./Icons";
import { Label, TextInput, SelectInput, Stepper } from "./Fields";
import { formatNumber, onlyDigits } from "../utils";
import styles from "./ProductCard.module.css";

const cx = (...args) => args.filter(Boolean).join(" ");

export default function ProductCard({
  index,
  total,
  item,
  products,
  onChange,
  onRemove,
  errors,
}) {
  const set = (k, v) => onChange({ ...item, [k]: v });
  const removable = total > 1;

  return (
    <div className={styles.card}>
      {/* top row: index + delete */}
      <div className={styles.topRow}>
        <span className={styles.indexBadge}>
          {String(index + 1).padStart(2, "0")}
        </span>
        {removable ? (
          <button type="button" onClick={onRemove} className={styles.removeBtn}>
            <IconTrash size={14} /> 삭제
          </button>
        ) : (
          <span />
        )}
      </div>

      {/* product name */}
      <div className={styles.field}>
        <Label required>제품명</Label>
        <SelectInput
          value={item.product}
          onChange={(v) => set("product", v)}
          placeholder="제품을 선택하세요"
          options={products}
          error={errors?.product}
        />
      </div>

      {/* width / length */}
      <div className={styles.dimensions}>
        <div className={styles.dimCol}>
          <Label required hint="mm">
            가로
          </Label>
          <TextInput
            value={formatNumber(item.width)}
            onChange={(v) => set("width", onlyDigits(v))}
            placeholder="예: 1,680"
            suffix="mm"
            inputMode="numeric"
            error={errors?.width}
          />
        </div>
        <div className={styles.dimCol}>
          <Label required hint="m">
            길이
          </Label>
          <TextInput
            value={formatNumber(item.length)}
            onChange={(v) => set("length", onlyDigits(v))}
            placeholder="예: 500"
            suffix="m"
            inputMode="numeric"
            error={errors?.length}
          />
          <div className={styles.lengthPresets}>
            {[500, 1000].map((v) => {
              const active = parseInt(item.length, 10) === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => set("length", String(v))}
                  className={cx(styles.presetBtn, active && styles.active)}
                >
                  {v.toLocaleString("ko-KR")}m
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* rolls */}
      <div>
        <Label required>롤수</Label>
        <Stepper
          value={item.rolls}
          onChange={(v) => set("rolls", v)}
          error={errors?.rolls}
        />
      </div>
    </div>
  );
}
