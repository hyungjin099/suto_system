/* 주문 입력 메인 페이지 */

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import Header from "./components/Header";
import SectionHeader from "./components/SectionHeader";
import ProductCard from "./components/ProductCard";
import SummaryModal from "./components/SummaryModal";
import SuccessScreen from "./components/SuccessScreen";
import { IconPlus, IconChevron } from "./components/Icons";
import { emptyItem, validateItem } from "./constants";
import { fetchClientFabrics, submitOrder } from "./api";
import { seedClients } from "../Admin/clientData";
import styles from "./OrderForm.module.css";

const cx = (...args) => args.filter(Boolean).join(" ");

export default function OrderForm() {
  const { clientCode } = useParams(); // URL 마지막 숫자 = URL_NUM
  const urlNum = parseInt(clientCode, 10) || 0;
  const clientData = seedClients().find((c) => c.accessCode === clientCode);
  const clientName = clientData?.name || "드림컴퍼니";
  const managerPhone = clientData?.managerPhone || "";

  const [fabricOptions, setFabricOptions] = useState([]);
  const [fabricsLoading, setFabricsLoading] = useState(true);
  const [items, setItems] = useState([emptyItem(clientName)]);
  const [errors, setErrors] = useState({ items: {} });
  const [showSummary, setShowSummary] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [blockMsg, setBlockMsg] = useState("");
  const addedRef = useRef(null);

  useEffect(() => {
    if (!urlNum) { setFabricsLoading(false); return; }
    fetchClientFabrics(urlNum)
      .then(setFabricOptions)
      .catch(() => {})
      .finally(() => setFabricsLoading(false));
  }, [urlNum]);

  const totalRolls = useMemo(
    () => items.reduce((sum, it) => sum + (parseInt(it.rolls, 10) || 0), 0),
    [items]
  );

  const updateItem = (id, next) => {
    setItems((arr) =>
      arr.map((it) => {
        if (it.id !== id) return it;
        if (next.product !== it.product) {
          const fab = fabricOptions.find((f) => f.value === next.product);
          return { ...next, prodName: fab?.prodName || "" };
        }
        return next;
      })
    );
    if (errors.items[id]) {
      setErrors((e) => ({ ...e, items: { ...e.items, [id]: undefined } }));
    }
  };

  const removeItem = (id) => {
    setItems((arr) => arr.filter((it) => it.id !== id));
  };

  const addItem = () => {
    const it = emptyItem(clientName);
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
    if (new Date().getHours() === 0) {
      setBlockMsg("00:00 ~ 01:00 사이에는 시스템 점검 시간으로 주문을 접수할 수 없습니다.\n01시 이후에 다시 시도해 주세요.");
      return;
    }
    setBlockMsg("");
    const itemErrs = {};
    items.forEach((it) => {
      const e = validateItem(it);
      if (Object.keys(e).length) itemErrs[it.id] = e;
    });
    setErrors({ items: itemErrs });
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

  const submit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await submitOrder({ urlNum, clientName, managerPhone, items });
      setSubmitted({
        orderId: res.orderId,
        at: new Date(),
        items: items.map((it) => ({
          ...it,
          productLabel:
            fabricOptions.find((f) => f.value === it.product)?.label || it.prodName || it.product,
          destination: it.destination.trim() || clientName,
        })),
        totalRolls,
      });
      setShowSummary(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setSubmitError("주문 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setItems([emptyItem(clientName)]);
    setErrors({ items: {} });
    setSubmitted(null);
  };

  if (submitted) return <SuccessScreen data={submitted} onReset={resetAll} />;

  return (
    <div className={styles.page}>
      <Header clientCompany={clientName} />

      <main className={styles.main}>
        {/* Intro */}
        <section className={styles.intro}>
          <h1 className={styles.title}>주문 내역을 입력해 주세요</h1>
          <p className={styles.subtitle}>
            제품 정보를 입력하고, 여러 제품을 주문하실 경우 아래
            <strong className={styles.subtitleAccent}> + 제품 추가 </strong>
            버튼으로 항목을 늘려주세요.
          </p>
          <p className={styles.notice}>
            ⚠ 제품명에 보이지 않는 제품을 구매하시려면 담당자에게 연락 바랍니다.
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
                  products={fabricOptions}
                  fabricsLoading={fabricsLoading}
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

        <p className={styles.bottomNote}>
          입력하신 정보는 주문 접수 후 담당자가 확인합니다.
        </p>
      </main>

      {/* Sticky submit bar */}
      <div className={styles.stickyBar}>
        {blockMsg && (
          <div className={styles.blockMsg}>
            {blockMsg.split("\n").map((line, i) => <span key={i}>{line}</span>)}
          </div>
        )}
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
          clientName={clientName}
          fabricOptions={fabricOptions}
          totalRolls={totalRolls}
          submitting={submitting}
          submitError={submitError}
          onClose={() => setShowSummary(false)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
