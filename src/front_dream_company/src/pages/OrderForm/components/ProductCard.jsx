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
  fabricsLoading,
  destinations = [],
  onChange,
  onRemove,
  errors,
}) {
  const listId = `dest-list-${item.id}`;
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
          placeholder={fabricsLoading ? "원단 목록 불러오는 중…" : "제품을 선택하세요"}
          options={products}
          disabled={fabricsLoading}
          error={errors?.product}
        />
      </div>

      {/* width / length */}
      <div className={styles.dimensions}>
        <div className={styles.dimCol}>
          <Label required hint="mm">
            가로(폭)
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
            길이(M)
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
            {[1000, 500].map((v) => {
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
      <div className={styles.field}>
        <Label required>롤수</Label>
        <Stepper
          value={item.rolls}
          onChange={(v) => set("rolls", v)}
          error={errors?.rolls}
        />
      </div>

      {/* destination */}
      <div className={styles.field}>
        <Label hint="선택 입력">납품처</Label>
        <TextInput
          value={item.destination}
          onChange={(v) => set("destination", v)}
          placeholder="납품받으실 곳 (상호명·주소 등)"
          list={listId}
        />
        <datalist id={listId}>
          {destinations.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      </div>

      {/* note */}
      <div>
        <Label hint="선택 입력">비고</Label>
        <textarea
          className={styles.noteArea}
          value={item.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder={"코팅색상, 배송처 주소, 요청사항을 입력해 주세요.\n전폭 발주 시 재단 사이즈 작성해 주세요"}
          rows={3}
        />
      </div>
    </div>
  );
}
