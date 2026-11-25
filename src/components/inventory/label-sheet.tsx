import { encodeCode128, type Barcode } from "@/lib/code128";
import { formatPrice } from "@/lib/labels";

export interface LabelContent {
  title: string;
  barcode: string;
  /** null: not printed */
  price: number | null;
}

/** Sizes in mm */
export const papers = [
  { id: "a4", label: "A4 stickers, 24 per sheet (70 × 37 mm)", width: 70, height: 37, columns: 3, rows: 8, page: "A4" },
  { id: "50x30", label: "Label printer, 50 × 30 mm", width: 50, height: 30, columns: 1, rows: 1, page: "50mm 30mm" },
  { id: "40x30", label: "Label printer, 40 × 30 mm", width: 40, height: 30, columns: 1, rows: 1, page: "40mm 30mm" },
] as const;
export type Paper = (typeof papers)[number];

const MAX_BAR_MM = 0.33;
/** Thinner bars are hard to print and read */
const MIN_BAR_MM = 0.19;
const PADDING_MM = 2;

const barWidth = (barcode: Barcode, paper: Paper) => Math.min(MAX_BAR_MM, (paper.width - PADDING_MM) / barcode.width);

/** Why this barcode can't be printed on this paper, "" when it can */
export const labelProblem = (text: string, paper: Paper) => {
  const barcode = encodeCode128(text);
  if (!barcode) return "This barcode has characters that can't be printed as bars.";
  return barWidth(barcode, paper) < MIN_BAR_MM ? "This barcode is too long for this label. Choose a bigger label." : "";
};

export function Label({ content, paper }: { content: LabelContent; paper: Paper }) {
  const barcode = encodeCode128(content.barcode);
  if (!barcode) return null;
  return (
    <div
      style={{ width: `${paper.width}mm`, height: `${paper.height}mm`, padding: `${PADDING_MM / 2}mm`, boxSizing: "border-box" }}
      className="flex flex-col items-center justify-center overflow-hidden bg-white text-center text-black"
    >
      <p className="line-clamp-2 w-full px-[1mm] font-medium" style={{ fontSize: "2.8mm", lineHeight: 1.2, overflowWrap: "anywhere" }}>
        {content.title}
      </p>
      <svg
        role="img"
        aria-label={`Barcode ${content.barcode}`}
        viewBox={`0 0 ${barcode.width} 1`}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        style={{ width: `${barcode.width * barWidth(barcode, paper)}mm`, height: "11mm", margin: "1mm 0 0.5mm", flexShrink: 0 }}
      >
        {barcode.bars.map((bar) => (
          <rect key={bar.x} x={bar.x} y={0} width={bar.width} height={1} fill="#000" />
        ))}
      </svg>
      <p style={{ fontSize: "2.8mm", lineHeight: 1.2 }}>{content.barcode}</p>
      {content.price !== null && (
        <p className="font-semibold" style={{ fontSize: "3.6mm", lineHeight: 1.2 }}>
          {formatPrice(content.price)}
        </p>
      )}
    </div>
  );
}

/** Every page to print. `skip`: stickers already used on the first sheet */
export function LabelSheets({ content, paper, count, skip }: { content: LabelContent; paper: Paper; count: number; skip: number }) {
  const perPage = paper.columns * paper.rows;
  const isSheet = perPage > 1;
  const cells = Array.from({ length: skip + count }, (_, index) => index >= skip);
  const pages = Array.from({ length: Math.ceil(cells.length / perPage) }, (_, page) => cells.slice(page * perPage, (page + 1) * perPage));
  return pages.map((page, pageIndex) => (
    <div
      key={pageIndex}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${paper.columns}, ${paper.width}mm)`,
        gridAutoRows: `${paper.height}mm`,
        paddingTop: isSheet ? "0.5mm" : 0,
        // A little under the page, so rounding never adds an empty page
        height: isSheet ? "296.8mm" : `${paper.height - 0.2}mm`,
        overflow: "hidden",
        breakAfter: pageIndex < pages.length - 1 ? "page" : "auto",
      }}
    >
      {page.map((isUsed, index) => (isUsed ? <Label key={index} content={content} paper={paper} /> : <div key={index} />))}
    </div>
  ));
}
