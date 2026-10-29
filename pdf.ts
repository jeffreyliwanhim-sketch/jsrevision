// Renders a DOM sheet to a multi-page A4 PDF, breaking pages between `.pdf-q` blocks.
export async function exportSheetToPdf(el: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
  const scale = 2;
  const canvas = await html2canvas(el, { scale, backgroundColor: "#ffffff" });
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const margin = 12;
  const pageW = 210 - margin * 2;
  const pageH = 297 - margin * 2;
  const pxPerMm = canvas.width / pageW;
  const pagePx = pageH * pxPerMm;

  // Candidate break points (in canvas px): bottoms of each question block.
  const top = el.getBoundingClientRect().top;
  const breaks = Array.from(el.querySelectorAll<HTMLElement>(".pdf-q"))
    .map((q) => (q.getBoundingClientRect().bottom - top) * scale)
    .concat(canvas.height);

  let y = 0;
  let first = true;
  while (y < canvas.height - 1) {
    let end = Math.min(y + pagePx, canvas.height);
    if (end < canvas.height) {
      const fit = breaks.filter((b) => b > y + 10 && b <= end);
      if (fit.length) end = fit[fit.length - 1]!;
    }
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = Math.ceil(end - y);
    const ctx = slice.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, y, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
    if (!first) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", margin, margin, pageW, slice.height / pxPerMm);
    first = false;
    y = end;
  }
  pdf.save(filename);
}
