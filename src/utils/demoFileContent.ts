// ============================================================
// demoFileContent - 生成演示用内联 SVG 文件内容
// 使初始化附件在预览时显示真实图像，而非"文件内容不可用"
// ============================================================

/**
 * 为演示数据生成一个 SVG 格式的"文档缩略图" Data URL
 * @param title 文档标题
 * @param subtitle 副标题（如文件编号）
 * @param seed 颜色种子，同一 seed 生成相同颜色
 * @param kind 文档类型（影响图标和配色）
 */
export function generateDemoFileDataUrl(
  title: string,
  subtitle?: string,
  seed?: string,
  kind: 'doc' | 'report' | 'certificate' | 'image' = 'doc',
): string {
  // 根据 seed 生成稳定的颜色
  const colorSeed = seed || title
  let hash = 0
  for (let i = 0; i < colorSeed.length; i++) {
    hash = ((hash << 5) - hash) + colorSeed.charCodeAt(i)
  }
  const hue = Math.abs(hash % 360)
  const primaryColor = `hsl(${hue}, 55%, 45%)`
  const lightColor = `hsl(${hue}, 45%, 92%)`
  const borderColor = `hsl(${hue}, 35%, 75%)`

  const iconMap: Record<string, string> = {
    doc: '📄',
    report: '📊',
    certificate: '📜',
    image: '🖼️',
  }
  const icon = iconMap[kind] || '📄'

  const subtitleText = subtitle ? `<text x="50" y="92" text-anchor="middle" font-size="11" fill="#888">${escapeXml(subtitle)}</text>` : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="210" height="297" viewBox="0 0 210 297">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.12"/>
    </filter>
  </defs>
  <!-- 纸张背景 -->
  <rect x="10" y="10" width="190" height="277" rx="4" fill="white" stroke="${borderColor}" stroke-width="1" filter="url(#shadow)"/>
  <!-- 顶部彩色条 -->
  <rect x="10" y="10" width="190" height="48" rx="4" fill="${primaryColor}" opacity="0.9"/>
  <rect x="10" y="34" width="190" height="24" fill="${primaryColor}" opacity="0.9"/>
  <!-- 图标 -->
  <text x="50%" y="38" text-anchor="middle" font-size="24" fill="white">${icon}</text>
  <!-- 标题 -->
  <text x="50%" y="62" text-anchor="middle" font-weight="bold" font-size="14" fill="#333">${escapeXml(truncate(title, 24))}</text>
  ${subtitleText}
  <!-- 模拟内容行 -->
  <rect x="30" y="108" width="150" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="122" width="140" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="136" width="155" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="158" width="100" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="172" width="145" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="186" width="130" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="208" width="80" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="222" width="150" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="236" width="120" height="6" rx="3" fill="${lightColor}"/>
  <!-- 水印 -->
  <text x="50%" y="268" text-anchor="middle" font-size="10" fill="#ddd" font-weight="bold">DEMO</text>
</svg>`

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.substring(0, maxLen - 1) + '…'
}

/**
 * 为 demo data 的 att() 函数生成带真实文件内容的附件数组
 * 用法：在 data/*.ts 中将 att(seed, name) 改为 att(seed, name, title)
 */
export function createDemoAttachment(
  seed: string,
  name: string,
  uploadedBy: string,
  kind: 'doc' | 'report' | 'certificate' | 'image' = 'doc',
) {
  const title = name.replace(/\.[^.]+$/, '') // 去掉扩展名
  return {
    key: `${seed}-1`,
    name,
    url: generateDemoFileDataUrl(title, `编号: ${seed}`, seed, kind),
    size: Math.floor(Math.random() * 500000) + 50000, // 50KB ~ 550KB
    uploadedBy,
    uploadDate: '2025-06-01 09:00:00',
    type: name.endsWith('.pdf') ? 'application/pdf'
      : name.endsWith('.png') || name.endsWith('.jpg') ? 'image/jpeg'
      : 'application/octet-stream',
  }
}