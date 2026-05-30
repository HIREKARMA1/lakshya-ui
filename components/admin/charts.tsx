"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#214d9a", "#00a2e5", "#f58020", "#098855", "#d64246", "#fec40d", "#6b7280"];

type ChartCardProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function ChartCard({ title, children, className = "" }: ChartCardProps) {
  return (
    <div className={`rounded-xl border border-line bg-white p-4 shadow-sm ${className}`}>
      <h3 className="mb-4 text-sm font-bold text-ink">{title}</h3>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

export function SimpleBarChart({
  data,
  dataKey = "count",
  nameKey = "label",
}: {
  data: { label: string; count: number }[];
  dataKey?: string;
  nameKey?: string;
}) {
  if (!data.length) {
    return <p className="flex h-full items-center justify-center text-sm text-muted-foreground">—</p>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ec" />
        <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey={dataKey} fill="#214d9a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleLineChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  if (!data.length) {
    return <p className="flex h-full items-center justify-center text-sm text-muted-foreground">—</p>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ec" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#00a2e5" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimplePieChart({ data }: { data: { label: string; count: number }[] }) {
  if (!data.length) {
    return <p className="flex h-full items-center justify-center text-sm text-muted-foreground">—</p>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={90} label>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DualSalaryBarChart({
  data,
}: {
  data: { role_key: string; avg_min: number; avg_max: number }[];
}) {
  if (!data.length) {
    return <p className="flex h-full items-center justify-center text-sm text-muted-foreground">—</p>;
  }
  const chartData = data.map((d) => ({
    label: d.role_key,
    avg_min: d.avg_min,
    avg_max: d.avg_max,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ec" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="avg_min" name="Avg min" fill="#214d9a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="avg_max" name="Avg max" fill="#00a2e5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
