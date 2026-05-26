/* 주문 입력 메인 페이지 */

import { useState, useRef, useEffect, useMemo } from "react";
import Header from "./components/Header";
import SectionHeader from "./components/SectionHeader";
import ProductCard from "./components/ProductCard";
import SummaryModal from "./components/SummaryModal";
import SuccessScreen from "./components/SuccessScreen";
import { Label, TextInput } from "./components/Fields";
import { IconPlus, IconChevron } from "./components/Icons";
import { PRODUCT_OPTIONS, emptyItem, validateItem } from "./constants";
import styles from "./OrderForm.module.css";

const cx = (...args) => args.filter(Boolean).join(" ");

// 접속한 고객사명. URL 쿼리 등으로 동적 주입 가능.
const CLIENT_COMPANY = "한빛제과 ㈜";

export default function OrderForm() {
  const [items, setItems] = useState([emptyItem()]);
  const [destination, setDestination] = useState("");
  const [errors, setErrors] = useState({ items: {}, destination: false });
  const [showSummary, setShowSummary] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const addedRef = useRef(null);

  const totalRolls = useMemo(
    () => items.reduce((sum, it) => sum + (parseInt(it.rolls, 10) || 0), 0),
    [items]
  );

  const updateItem = (id, next) => {
    setItems((arr) => arr.map((it) => (it.id === id ? next : it)));
    if (errors.items[id]) {
      setErrors((e) => ({ ...e, items: { ...e.items, [id]: undefined } }));
    }
  };

  const removeItem = (id) => {
    setItems((arr) => arr.filter((it) => it.id !== id));
  };

  const addItem = () => {
    const it = emptyItem();
    setItems((arr) => [...arr, it]);
    addedRef.current = it.id;
  };

  // 새로 추가된 카드로 스크롤 + 포커스
  useEffect(() => {
    if (!addedRef.current) return;
    const el = document.querySelector(`[data-item-id="${addedRef.current}"]`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
      const focusable = el.querySelector("select");
      if (focusable) setTimeout(() => focusable.focus(), 300);
    }
    addedRef.current = null;
  }, [items.length]);

  const tryReview = () => {
    const itemErrs = {};
    items.forEach((it) => {
      const e = validateItem(it);
      if (Object.keys(e).length) itemErrs[it.id] = e;
    });
    setErrors({ items: itemErrs, destination: false });
    if (Object.keys(itemErrs).length) {
      const firstBadId = items.find((it) => itemErrs[it.id])?.id;
      if (firstBadId) {
        const el = document.querySelector(`[data-item-id="${firstBadId}"]`);
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }
      return;
    }
    setShowSummary(true);
  };

  const submit = () => {
    setSubmitted({
      orderId: "ORD-" + Date.now().toString(36).toUpperCase().slice(-6),
      at: new Date(),
      items: items.map((it) => ({
        ...it,
        productLabel:
          PRODUCT_OPTIONS.find((p) => p.value === it.product)?.label ||
          it.product,
      })),
      destination,
      totalRolls,
    });
    setShowSummary(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetAll = () => {
    setItems([emptyItem()]);
    setDestination("");
    setErrors({ items: {}, destination: false });
    setSubmitted(null);
  };

  if (submitted) return <SuccessScreen data={submitted} onReset={resetAll} />;

  return (
    <div className={styles.page}>
      <Header clientCompany={CLIENT_COMPANY} />

      <main className={styles.main}>
        {/* Intro */}
        <section className={styles.intro}>
          <h1 className={styles.title}>주문 내역을 입력해 주세요</h1>
          <p className={styles.subtitle}>
            제품 정보를 입력하고, 여러 제품을 주문하실 경우 아래
            <strong className={styles.subtitleAccent}> + 제품 추가 </strong>
            버튼으로 항목을 늘려주세요.
          </p>
        </section>

        {/* Products */}
        <section className={cx(styles.section, styles.first)}>
          <SectionHeader
            n="1"
            title="제품 정보"
            right={
              <span className={styles.countChip}>
                총 {items.length}개 · {totalRolls}롤
              </span>
            }
          />
          <div className={styles.itemsGrid}>
            {items.map((it, i) => (
              <div key={it.id} data-item-id={it.id}>
                <ProductCard
                  index={i}
                  total={items.length}
                  item={it}
                  products={PRODUCT_OPTIONS}
                  errors={errors.items[it.id]}
                  onChange={(next) => updateItem(it.id, next)}
                  onRemove={() => removeItem(it.id)}
                />
              </div>
            ))}
          </div>

          <button type="button" onClick={addItem} className={styles.addBtn}>
            <IconPlus /> 제품 추가
          </button>
        </section>

        {/* Destination */}
        <section className={styles.section}>
          <SectionHeader n="2" title="납품처" />
          <div id="dest-field" className={styles.destCard}>
            <Label hint="선택 입력">납품받으실 곳</Label>
            <TextInput
              value={destination}
              onChange={(v) => {
                setDestination(v);
                if (errors.destination)
                  setErrors((e) => ({ ...e, destination: false }));
              }}
              placeholder="예: 인천광역시 남동구 ○○물류센터"
              error={errors.destination}
            />
            <p className={styles.destHint}>
              상호명, 주소, 담당자 등 받는 곳을 식별할 수 있도록 자유롭게 입력해
              주세요.
            </p>
          </div>
        </section>

        <p className={styles.bottomNote}>
          입력하신 정보는 주문 접수 후 담당자가 확인합니다.
        </p>
      </main>

      {/* Sticky submit bar */}
      <div className={styles.stickyBar}>
        <div className={styles.stickyInner}>
          <div className={styles.summary}>
            <div className={styles.summaryLabel}>주문 요약</div>
            <div className={styles.summaryValue}>
              제품 <span className={styles.numeric}>{items.length}</span>개
              <span className={styles.sep}>·</span>
              <span className={styles.numeric}>{totalRolls}</span>롤
            </div>
          </div>
          <button
            type="button"
            onClick={tryReview}
            className={styles.reviewBtn}
          >
            검토하기 <IconChevron size={14} />
          </button>
        </div>
      </div>

      {showSummary && (
        <SummaryModal
          items={items}
          destination={destination}
          totalRolls={totalRolls}
          onClose={() => setShowSummary(false)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
