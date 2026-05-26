import dynamic from "next/dynamic";

const NextClientApp = dynamic(() => import("../client/NextClientApp"), {
  ssr: false
});

export default function CatchAllPage() {
  return <NextClientApp />;
}
