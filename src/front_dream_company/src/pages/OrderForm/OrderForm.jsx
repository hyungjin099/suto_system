/* 주문 입력 메인 페이지 */

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import PasswordGate from "./components/PasswordGate";
import OrderHistory from "./components/OrderHistory";
import Header from "./components/Header";
import SectionHeader from "./components/SectionHeader";
import ProductCard from "./components/ProductCard";
import SummaryModal from "./components/SummaryModal";
import SuccessScreen from "./components/SuccessScreen";
import UnavailableScreen from "./components/UnavailableScreen";
import PopupModal from "./components/PopupModal";
import FrequentItems from "./components/FrequentItems";
import { entriesToItems, matchFabric, isBlankItem } from "./reorder";
import { IconPlus, IconChevron } from "./components/Icons";
import { emptyItem, validateItem } from "./constants";
import { fetchClientFabrics, submitOrder, fetchClientInfo, fetchClientDestinations, fetchOrderAvailability, fetchFrequentItems } from "./api";
import styles from "./OrderForm.module.css";

const cx = (...args) => args.filter(Boolean).join(" ");

export default function OrderForm() {
  const { clientCode } = useParams(); // URL 경로의 거래처코드 = CLI_CODE
  const cliCode = clientCode || "";
  const [clientInfo, setClientInfo] = useState({ name: "", managerPhone: "" });
  const clientName = clientInfo.name;
  const managerPhone = clientInfo.managerPhone;

  // 백엔드에서 거래처명/담당자 정보 조회 (URL이 유효해도 DB에 없으면 비어둠)
  useEffect(() => {
    if (!cliCode) return;
    fetchClientInfo(cliCode)
      .then((c) => setClientInfo({
        name: c.cliCompName || "",
        managerPhone: c.cliManagerTel || "",
      }))
      .catch(() => setClientInfo({ name: "", managerPhone: "" }));
  }, [cliCode]);

  const [fabricOptions, setFabricOptions] = useState([]);
  const [fabricsLoading, setFabricsLoading] = useState(true);
  const [destinations, setDestinations] = useState([]);
  const [items, setItems] = useState([emptyItem(clientName)]);

  // clientName이 뒤늦게 도착하면 비어있는 납품처를 채운다 (최초 아이템 공란 해결)
  useEffect(() => {
    if (!clientName) return;
    setItems((arr) =>
      arr.map((it) => (it.destination ? it : { ...it, destination: clientName }))
    );
  }, [clientName]);

  // 자동완성용: 이 거래처의 과거 사용 납품처 목록
  useEffect(() => {
    if (!cliCode) { setDestinations([]); return; }
    fetchClientDestinations(cliCode).then(setDestinations).catch(() => setDestinations([]));
  }, [cliCode]);
  const [errors, setErrors] = useState({ items: {} });
  const [frequent, setFrequent] = useState([]);
  const [reorderNotice, setReorderNotice] = useState(null); // { added, skipped[] }
  const [showSummary, setShowSummary] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [tab, setTab] = useState("order"); // 'order' | 'history'
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [blockMsg, setBlockMsg] = useState("");
  const [availability, setAvailability] = useState({ loading: true, available: true, reason: null, message: null });
  const addedRef = useRef(null);

  // 접수 가능 여부 체크 (주말/공휴일/심야). 1분마다 재확인.
  useEffect(() => {
    let alive = true;
    const check = () => {
      fetchOrderAvailability()
        .then((r) => alive && setAvailability({ loading: false, ...r }))
        .catch(() => alive && setAvailability({ loading: false, available: true, reason: null, message: null }));
    };
    check();
    const timer = setInterval(check, 60_000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!cliCode) { setFabricsLoading(false); return; }
    fetchClientFabrics(cliCode)
      .then(setFabricOptions)
      .catch(() => {})
      .finally(() => setFabricsLoading(false));
  }, [cliCode]);

  // 자주 주문한 품목 (지금도 주문 가능한 것만)
  useEffect(() => {
    if (!cliCode) { setFrequent([]); return; }
    fetchFrequentItems(cliCode).then(setFrequent).catch(() => setFrequent([]));
  }, [cliCode]);
  const frequentOrderable = useMemo(
    () => frequent.filter((e) => matchFabric(fabricOptions, e)).slice(0, 6),
    [frequent, fabricOptions]
  );

  const totalRolls = useMemo(
    () => items.reduce((sum, it) =>
      sum + (it.specs || []).reduce((s, sp) => s + (parseInt(sp.rolls, 10) || 0), 0),
    0),
    [items]
  );

  // 모든 (제품 × 규격) 조합을 한 줄씩 평탄화 — 제출/요약/완료 화면에서 사용
  const flatItems = useMemo(
    () => items.flatMap((it) =>
      (it.specs || []).map((sp) => ({
        ...it,
        width: sp.width,
        length: sp.length,
        rolls: sp.rolls,
        _parentId: it.id,
        _specId: sp.id,
        id: `${it.id}_${sp.id}`,
      }))
    ),
    [items]
  );
  const totalLines = flatItems.length;

  const updateItem = (id, next) => {
    setItems((arr) =>
      arr.map((it) => {
        if (it.id !== id) return it;
        if (next.product !== it.product) {
          // next.product는 aliasNum(문자열). 실제 prodCode/aliasName은 옵션에서 꺼내 저장
          const fab = fabricOptions.find((f) => f.value === next.product);
          return {
            ...next,
            prodName: fab?.prodName || "",
            prodCode: fab?.prodCode || "",
            aliasName: fab?.aliasName || "",
          };
        }
        return next;
      })
    );
    if (errors.items[id]) {
      setErrors((e) => ({ ...e, items: { ...e.items, [id]: undefined } }));
    }
  };

  // 재주문·자주 주문한 품목 → 주문서에 카드로 추가 (제품을 아직 안 고른 빈 카드는 대체)
  const addEntries = (entries) => {
    const { items: added, skipped } = entriesToItems(entries, fabricOptions, clientName);
    if (added.length) {
      setItems((arr) => [...arr.filter((it) => !isBlankItem(it)), ...added]);
      setErrors({ items: {} });
      addedRef.current = added[0].id;
    }
    setReorderNotice({ added: added.length, skipped });
    setTab("order");
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
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 3) {
      setBlockMsg("23:00 ~ 03:00 사이에는 시스템 점검 시간으로 주문을 접수할 수 없습니다.\n03시 이후에 다시 시도해 주세요.");
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
      const res = await submitOrder({ cliCode, clientName, managerPhone, items: flatItems });
      setSubmitted({
        orderId: res.orderId,
        deliveryDate: res.deliveryDate,
        at: new Date(),
        items: flatItems.map((it) => ({
          ...it,
          productLabel:
            fabricOptions.find((f) => f.value === it.product)?.label || it.aliasName || it.prodName || it.prodCode,
          destination: (it.destination || "").trim() || clientName,
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
    setReorderNotice(null);
    setTab("order");
  };

  const goHistory = () => {
    setItems([emptyItem(clientName)]);
    setErrors({ items: {} });
    setSubmitted(null);
    setTab("history");
  };

  if (submitted) return (
    <SuccessScreen
      data={submitted}
      onReset={resetAll}
      onGoHistory={goHistory}
    />
  );

  // 접수 불가 시간대 → 전체 블록 UI
  if (!availability.loading && !availability.available) {
    return <UnavailableScreen reason={availability.reason} message={availability.message} />;
  }

  return (
    <PasswordGate cliCode={cliCode} clientName={clientName}>
    <div className={styles.page}>
      <Header clientCompany={clientName} />
      <PopupModal cliCode={cliCode} active={tab === "order"} />

      <div className={styles.tabBar}>
        <button
          type="button"
          className={cx(styles.tabBtn, tab === "order" && styles.tabBtnActive)}
          onClick={() => setTab("order")}
        >
          주문하기
        </button>
        <button
          type="button"
          className={cx(styles.tabBtn, tab === "history" && styles.tabBtnActive)}
          onClick={() => setTab("history")}
        >
          주문 내역
        </button>
      </div>

      {tab === "history" ? (
        <main className={styles.main}>
          <OrderHistory
            cliCode={cliCode}
            clientName={clientName}
            fabricOptions={fabricOptions}
            fabricsLoading={fabricsLoading}
            onReorder={(entries) => {
              addEntries(entries);
              addedRef.current = null;               // 내역에서 넘어왔을 땐 맨 위의 안내 문구가 보이게
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </main>
      ) : (
      <>
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

        {reorderNotice && (
          <div className={styles.reorderNotice} role="status">
            <div>
              {reorderNotice.added > 0
                ? <><b>{reorderNotice.added}개 카드</b>를 주문서에 담았습니다. 롤수 등 내용을 확인한 뒤 발주해 주세요.</>
                : "담을 수 있는 품목이 없습니다."}
              {reorderNotice.skipped.length > 0 && (
                <div className={styles.reorderSkipped}>
                  지금은 주문할 수 없어 담지 못한 품목: {reorderNotice.skipped.join(", ")}
                </div>
              )}
            </div>
            <button type="button" className={styles.reorderNoticeX} onClick={() => setReorderNotice(null)} aria-label="닫기">×</button>
          </div>
        )}

        <FrequentItems entries={frequentOrderable} onPick={(e) => addEntries([e])} />

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
                  destinations={destinations}
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
              규격 <span className={styles.numeric}>{totalLines}</span>건
              <span className={styles.sep}>·</span>
              <span className={styles.numeric}>{totalRolls}</span>롤
            </div>
          </div>
          <button
            type="button"
            onClick={tryReview}
            className={styles.reviewBtn}
          >
            발주하기 <IconChevron size={14} />
          </button>
        </div>
      </div>
      </>
      )}

      {tab === "order" && showSummary && (
        <SummaryModal
          items={flatItems}
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
    </PasswordGate>
  );
}
