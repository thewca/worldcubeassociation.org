"use client";

import { useParams } from "next/navigation";

export default function HistoricalRegulation() {
  const params = useParams<{ version: string }>();

  return (
    <iframe
      src={`http://regulations.worldcubeassociation.org/history/official/${params.version}/index.html.erb`}
    ></iframe>
  );
}
