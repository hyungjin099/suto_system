/* 한 제품의 주문 카드
 * - 제품(product) 1개 + 규격(spec) 1~N개
 * - "+ 제품 규격 추가" 로 규격 행을 늘릴 수 있음 (같은 제품, 다른 폭/길이/롤수)
 */

import { IconTrash } from "./Icons";
import { Label, TextInput, Stepper } from "./Fields";
import ProductCombobox from "./ProductCombobox";
import { formatNumber, onlyDigits } from "../utils";
import { emptySpec } from "../constants";
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
  const specs = item.specs || [];
  const specErrs = errors?.specs || {};

  const setField = (k, v) => onChange({ ...item, [k]: v });

  const updateSpec = (specId, next) =>
    onChange({
      ...item,
      specs: specs.map((s) => (s.id === specId ? next : s)),
    });

  const addSpec = () =>
    onChange({ ...item, specs: [...specs, emptySpec()] });

  const removeSpec = (specId) =>
    onChange({
      ...item,
      specs: specs.filter((s) => s.id !== specId),
    });

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
        <div className={styles.productLabelRow}>
          <Label required>제품명</Label>
          <span className={styles.productWarnNotice}>
            ⚠ 제품명에 보이지 않는 제품을 구매하시려면 담당자에게 연락 바랍니다.
          </span>
        </div>
        <ProductCombobox
          value={item.product}
          onChange={(v) => setField("product", v)}
          placeholder={fabricsLoading ? "원단 목록 불러오는 중…" : "제품을 선택하세요 (코드/이름으로 검색)"}
          options={products}
          disabled={fabricsLoading}
          error={errors?.product}
        />
      </div>

      {/* specs list */}
      <div className={styles.specsBlock}>
        {specs.map((sp, specIdx) => (
          <SpecRow
            key={sp.id}
            spec={sp}
            index={specIdx}
            removable={specs.length > 1}
            onChange={(next) => updateSpec(sp.id, next)}
            onRemove={() => removeSpec(sp.id)}
            errors={specErrs[sp.id]}
          />
        ))}
        <button
          type="button"
          className={styles.addSpecBtn}
          onClick={addSpec}
          title="같은 제품에 다른 규격(폭·길이·롤수)을 추가합니다"
        >
          + 제품 규격 추가
        </button>
      </div>

      {/* destination */}
      <div className={styles.field}>
        <Label hint="선택 입력">납품처</Label>
        <TextInput
          value={item.destination}
          onChange={(v) => setField("destination", v)}
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
          onChange={(e) => setField("note", e.target.value)}
          placeholder={"코팅색상, 배송처 주소, 요청사항을 입력해 주세요.\n전폭 발주 시 재단 사이즈 작성해 주세요"}
          rows={3}
        />
      </div>
    </div>
  );
}

function SpecRow({ spec, index, removable, onChange, onRemove, errors }) {
  const set = (k, v) => onChange({ ...spec, [k]: v });
  return (
    <div className={styles.specRow}>
      <div className={styles.specHeader}>
        <span className={styles.specTag}>규격 {index + 1}</span>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className={styles.specRemoveBtn}
            title="이 규격 삭제"
          >
            <IconTrash size={13} /> 삭제
          </button>
        )}
      </div>

      <div className={styles.dimensions}>
        <div className={styles.dimCol}>
          <Label required hint="mm">
            가로(폭)
          </Label>
          <TextInput
            value={formatNumber(spec.width)}
            onChange={(v) => set("width", onlyDigits(v))}
            placeholder="예: 1,680"
            suffix="mm"
            inputMode="numeric"
            error={errors?.width}
            clearOnFocus
          />
        </div>
        <div className={styles.dimCol}>
          <Label required hint="m">
            길이(M)
          </Label>
          <TextInput
            value={formatNumber(spec.length)}
            onChange={(v) => set("length", onlyDigits(v))}
            placeholder="예: 500"
            suffix="m"
            inputMode="numeric"
            error={errors?.length}
            clearOnFocus
          />
          <div className={styles.lengthPresets}>
            {[1000, 500].map((v) => {
              const active = parseInt(spec.length, 10) === v;
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

      <div className={styles.field}>
        <Label required>롤수</Label>
        <Stepper
          value={spec.rolls}
          onChange={(v) => set("rolls", v)}
          error={errors?.rolls}
        />
      </div>
    </div>
  );
}
