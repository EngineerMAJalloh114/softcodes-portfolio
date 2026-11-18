import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { palette } from "@/theme/palette";

export const alt = "Soft CODES — Mohamed Abass Jalloh";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const svg = await readFile(join(process.cwd(), "public/brand/softcodes-logo-white.svg"));
  const logo = `data:image/svg+xml;base64,${svg.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: palette.dark.bg, // Jet Black
        }}
      >
        {/* eslint-disable-next-line jsx-a11y/alt-text -- next/og (Satori) needs a plain img */}
        <img src={logo} width={760} height={207} />
      </div>
    ),
    size,
  );
}
