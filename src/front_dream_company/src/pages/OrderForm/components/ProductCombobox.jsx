/* 제품명 검색 가능 셀렉트 (react-select 래퍼)
 * - 입력창에 타이핑하면 원단명 중간 매칭으로 필터
 * - 화면에는 별칭(제품명)만 표시한다. 제품코드는 고객에게 보여주지 않는다.
 */

import Select, { components } from "react-select";

const Option = (props) => {
  const { data } = props;
  return (
    <components.Option {...props}>
      <span style={{ fontSize: 14 }}>{data.aliasName}</span>
    </components.Option>
  );
};

const SingleValue = (props) => {
  const { data } = props;
  return (
    <components.SingleValue {...props}>
      <span>{data.aliasName}</span>
    </components.SingleValue>
  );
};

const filterOption = (candidate, rawInput) => {
  if (!rawInput) return true;
  const q = rawInput.toLowerCase().trim();
  const d = candidate.data;
  return (
    (d.aliasName || "").toLowerCase().includes(q) ||
    (d.prodCode  || "").toLowerCase().includes(q) ||
    (d.prodName  || "").toLowerCase().includes(q)
  );
};

const customStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    borderColor: state.isFocused ? "#1b3a2a" : "#d7ddda",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(27,58,42,0.1)" : "none",
    "&:hover": { borderColor: "#1b3a2a" },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#1b3a2a"
      : state.isFocused
      ? "#f3f7f4"
      : "white",
    color: state.isSelected ? "white" : "#1a1a1a",
    cursor: "pointer",
    padding: "8px 12px",
  }),
  menu: (base) => ({ ...base, zIndex: 20 }),
};

export default function ProductCombobox({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  error,
}) {
  const selected = options.find((o) => o.value === value) || null;
  return (
    <div style={error ? { outline: "2px solid #d64545", borderRadius: 6 } : undefined}>
      <Select
        value={selected}
        options={options}
        onChange={(opt) => onChange(opt ? opt.value : "")}
        placeholder={placeholder}
        isDisabled={disabled}
        isClearable
        isSearchable
        filterOption={filterOption}
        components={{ Option, SingleValue }}
        styles={customStyles}
        noOptionsMessage={() => "일치하는 제품이 없습니다"}
        loadingMessage={() => "불러오는 중…"}
        menuPlacement="auto"
      />
    </div>
  );
}
