/**
 * KTP PDF Generator
 *
 * Captures a rendered KTP card DOM element with html2canvas and outputs
 * a landscape A4 PDF using jsPDF. No external font loading required —
 * the card is captured as a raster image.
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Generates and downloads a PDF containing the KTP card.
 *
 * @param element   The root HTMLElement of the rendered KtpOfficialCard
 * @param filename  The desired .pdf filename (e.g. "KTP-Ternak-LV001.pdf")
 */
export async function downloadKtpPdf(element: HTMLElement, filename: string): Promise<void> {
  // Render the card to a high-resolution canvas
  const canvas = await html2canvas(element, {
    scale: 2.5,            // High DPI for crisp PDF output
    useCORS: true,
    logging: false,
    backgroundColor: '#F7F4EB',
    // Ensure emojis & box-shadow render correctly
    allowTaint: true,
    removeContainer: true,
  });

  const imgData = canvas.toDataURL('image/png');

  // Create landscape A4 PDF
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = pdf.internal.pageSize.getWidth();   // 297 mm
  const pageH = pdf.internal.pageSize.getHeight();  // 210 mm
  const margin = 12; // mm padding on each side

  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2;

  const imgRatio  = canvas.width / canvas.height;
  const pageRatio = availW / availH;

  let drawW: number;
  let drawH: number;

  if (imgRatio > pageRatio) {
    // Image is wider relative to page — fit by width
    drawW = availW;
    drawH = availW / imgRatio;
  } else {
    // Image is taller relative to page — fit by height
    drawH = availH;
    drawW = availH * imgRatio;
  }

  const x = margin + (availW - drawW) / 2;
  const y = margin + (availH - drawH) / 2;

  pdf.addImage(imgData, 'PNG', x, y, drawW, drawH);
  pdf.save(filename);
}
