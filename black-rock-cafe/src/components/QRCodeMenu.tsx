import QRCode from "qrcode";

/**
 * Server component: renders a real, scannable QR code (SVG, no client JS,
 * no third-party image request) pointing at the given URL — used for
 * table tents / printed QR code menus.
 */
export default async function QRCodeMenu({ url, label }: { url: string; label: string }) {
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#1a0e0a", light: "#fff8ec" } });

  return (
    <div className="card-surface flex flex-col items-center gap-3 p-6 text-center">
      {/* eslint-disable-next-line react/no-danger */}
      <div className="h-40 w-40" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="text-sm font-medium text-stone-200">{label}</p>
      <p className="break-all text-xs text-stone-500">{url}</p>
    </div>
  );
}
