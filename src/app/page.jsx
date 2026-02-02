"use client";
import CertBatchGenerator from "./components/certGen";

export default function Home() {
  return (
    <div className="flex flex-col items-center p-4">
      <CertBatchGenerator />
    </div>
  );
}
