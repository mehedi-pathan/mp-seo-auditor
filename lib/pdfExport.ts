import type { AuditResult } from '@/types'

type JsPdfInstance = InstanceType<typeof import('jspdf').jsPDF>

const pageWidth = 210
const pageHeight = 297
const margin = 16
const contentWidth = pageWidth - margin * 2

const colors = {
  ink: [20, 24, 33] as const,
  muted: [101, 112, 128] as const,
  blue: [37, 99, 235] as const,
  purple: [147, 51, 234] as const,
  green: [5, 150, 105] as const,
  amber: [217, 119, 6] as const,
  red: [220, 38, 38] as const,
  panel: [244, 247, 255] as const,
  border: [224, 229, 236] as const,
}

const setColor = (pdf: JsPdfInstance, color: readonly [number, number, number]) => {
  pdf.setTextColor(color[0], color[1], color[2])
}

const addWrappedText = (
  pdf: JsPdfInstance,
  text: string,
  x: number,
  y: number,
  width: number,
  options: { size?: number; lineHeight?: number; color?: readonly [number, number, number]; style?: 'normal' | 'bold' } = {},
) => {
  pdf.setFont('helvetica', options.style || 'normal')
  pdf.setFontSize(options.size || 10)
  setColor(pdf, options.color || colors.ink)

  const lines = pdf.splitTextToSize(text || '-', width) as string[]
  pdf.text(lines, x, y)
  return y + lines.length * (options.lineHeight || 5)
}

const ensureSpace = (pdf: JsPdfInstance, y: number, required = 32) => {
  if (y + required <= pageHeight - margin) return y
  pdf.addPage()
  return margin
}

const addSectionTitle = (pdf: JsPdfInstance, title: string, y: number) => {
  const nextY = ensureSpace(pdf, y, 18)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  setColor(pdf, colors.blue)
  pdf.text(title, margin, nextY)
  return nextY + 9
}

const addScoreBox = (
  pdf: JsPdfInstance,
  label: string,
  score: number,
  x: number,
  y: number,
  color: readonly [number, number, number],
) => {
  pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
  pdf.setFillColor(255, 255, 255)
  pdf.roundedRect(x, y, 52, 32, 3, 3, 'FD')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  setColor(pdf, color)
  pdf.text(String(score), x + 26, y + 14, { align: 'center' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  setColor(pdf, colors.muted)
  pdf.text(label, x + 26, y + 24, { align: 'center' })
}

export async function generatePDF(audit: AuditResult): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF('p', 'mm', 'a4')
  let y = margin

  pdf.setProperties({
    title: `MP SEO Auditor - ${audit.domain}`,
    subject: 'Website SEO audit report',
    author: 'MP SEO Auditor',
  })

  pdf.setFillColor(colors.panel[0], colors.panel[1], colors.panel[2])
  pdf.roundedRect(margin, y, contentWidth, 42, 4, 4, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  setColor(pdf, colors.ink)
  pdf.text('MP SEO Auditor', margin + 8, y + 13)
  pdf.setFontSize(15)
  pdf.text(audit.domain, margin + 8, y + 25)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  setColor(pdf, colors.muted)
  pdf.text(audit.url, margin + 8, y + 32, { maxWidth: contentWidth - 16 })
  pdf.text(`Audit date: ${new Date(audit.createdAt).toLocaleDateString()}`, margin + 8, y + 38)
  y += 52

  addScoreBox(pdf, 'SEO Score', audit.scores.seo, margin, y, colors.blue)
  addScoreBox(pdf, 'Performance', audit.scores.performance, margin + 60, y, colors.purple)
  addScoreBox(pdf, 'Accessibility', audit.scores.accessibility, margin + 120, y, colors.green)
  y += 44

  y = addSectionTitle(pdf, 'Executive Summary', y)
  y = addWrappedText(pdf, audit.aiSummary || 'No summary available.', margin, y, contentWidth, {
    size: 10.5,
    lineHeight: 5.4,
  }) + 4

  y = addSectionTitle(pdf, 'Top Issues to Fix', y)
  audit.topFixes.slice(0, 6).forEach((fix, index) => {
    y = ensureSpace(pdf, y, 30)
    const impactColor = fix.impact === 'high' ? colors.red : fix.impact === 'medium' ? colors.amber : colors.green
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    pdf.setFillColor(250, 250, 250)
    pdf.roundedRect(margin, y - 5, contentWidth, 9, 2, 2, 'FD')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    setColor(pdf, colors.ink)
    pdf.text(`${index + 1}. ${fix.title}`, margin + 3, y + 1)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    setColor(pdf, impactColor)
    pdf.text(fix.impact.toUpperCase(), pageWidth - margin - 3, y + 1, { align: 'right' })
    y += 9
    y = addWrappedText(pdf, fix.description, margin + 3, y, contentWidth - 6, {
      size: 9,
      lineHeight: 4.6,
      color: colors.muted,
    }) + 4
  })

  y = addSectionTitle(pdf, 'Quick Wins', y)
  audit.quickWins.slice(0, 6).forEach(win => {
    y = ensureSpace(pdf, y, 14)
    y = addWrappedText(pdf, `- ${win}`, margin, y, contentWidth, {
      size: 9.5,
      lineHeight: 4.8,
    }) + 2
  })

  y = addSectionTitle(pdf, 'Technical Checklist', y)
  audit.technical.checks.slice(0, 12).forEach(check => {
    y = ensureSpace(pdf, y, 18)
    const statusColor = check.status === 'pass' ? colors.green : check.status === 'warning' ? colors.amber : colors.red
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9.5)
    setColor(pdf, statusColor)
    pdf.text(check.status.toUpperCase(), margin, y)
    y = addWrappedText(pdf, `${check.name}: ${check.description}`, margin + 28, y, contentWidth - 28, {
      size: 9,
      lineHeight: 4.5,
    }) + 2
  })

  const totalPages = pdf.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page)
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    pdf.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    setColor(pdf, colors.muted)
    pdf.text('Designed & Developed by Mehedi Pathan - mehedipathan.online', margin, pageHeight - 10)
    pdf.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
  }

  return pdf.output('blob')
}

