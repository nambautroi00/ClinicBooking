import React, { useEffect, useState } from "react";
import departmentApi from "../../api/departmentApi";

export default function DepartmentSelect({
  value,
  onChange,
  className = "",
  placeholder = "Chọn khoa",
  disabled = false
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    departmentApi
      .getAllDepartmentsList()
      .then((res) => {
        if (!mounted) return;
        const data = res?.data ?? [];
        const list = Array.isArray(data) ? data : data.content ?? [];
        setOptions(list);
      })
      .catch((err) => {
        console.error("Load departments failed:", err);
        setOptions([]);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const currentValue =
    value === null || value === undefined || value === "" ? "" : String(value);

  return (
    <select
      className={className}
      value={currentValue}
      onChange={onChange}
      disabled={disabled || loading}
    >
      <option value="">{placeholder}</option>
      {options.map((d) => {
        const id = d.id ?? d.departmentId ?? d.departmentid;
        const name = d.departmentName ?? d.department_name ?? d.name ?? `Khoa ${id}`;
        return (
          <option key={String(id)} value={String(id)}>
            {name}
          </option>
        );
      })}
    </select>
  );
}

/*Usage example (đưa vào file form thay vì giữ tại đây):
<DepartmentSelect
  value={form.departmentId}
  onChange={(e) =>
    setForm((prev) => ({
      ...prev,
      departmentId: e.target.value ? Number(e.target.value) : "",
    }))
  }
  className="border rounded px-2 py-1 w-full"
  placeholder="Chọn khoa"
/>*/