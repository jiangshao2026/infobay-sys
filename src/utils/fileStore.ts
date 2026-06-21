// ============================================================
// fileStore.ts - IndexedDB 文件存储封装
// 用于在纯前端演示环境中存储上传的文件内容
// ============================================================

const DB_NAME = 'XinbaiFileStore'
const STORE_NAME = 'files'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/**
 * 保存文件到 IndexedDB
 * @param fileId 文件唯一标识（与 DocumentAttachment.key 对应）
 * @param buffer 文件二进制数据
 */
export async function saveFile(fileId: string, buffer: ArrayBuffer): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(buffer, fileId)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

/**
 * 从 IndexedDB 读取文件
 * @param fileId 文件唯一标识
 * @returns 文件二进制数据，不存在时返回 undefined
 */
export async function loadFile(fileId: string): Promise<ArrayBuffer | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(fileId)
    req.onsuccess = () => { db.close(); resolve(req.result) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

/**
 * 从 IndexedDB 删除文件
 * @param fileId 文件唯一标识
 */
export async function deleteFile(fileId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(fileId)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

/**
 * 清空 IndexedDB 中所有文件
 * 用于"重置初始数据"功能
 */
export async function clearAllFiles(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

// ============================================================
// 演示 SVG 生成（从 demoFileContent.ts 合并至此）
// ============================================================

/**
 * 为演示数据生成一个 SVG 格式的"文档缩略图" Data URL
 */
export function generateDemoFileDataUrl(
  title: string,
  subtitle?: string,
  seed?: string,
  kind: 'doc' | 'report' | 'certificate' | 'image' = 'doc',
): string {
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

  const subtitleText = subtitle
    ? `<text x="50%" y="92" text-anchor="middle" font-size="11" fill="#888">${escapeXml(subtitle)}</text>`
    : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="210" height="297" viewBox="0 0 210 297">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect x="10" y="10" width="190" height="277" rx="4" fill="white" stroke="${borderColor}" stroke-width="1" filter="url(#shadow)"/>
  <rect x="10" y="10" width="190" height="48" rx="4" fill="${primaryColor}" opacity="0.9"/>
  <rect x="10" y="34" width="190" height="24" fill="${primaryColor}" opacity="0.9"/>
  <text x="50%" y="38" text-anchor="middle" font-size="24" fill="white">${icon}</text>
  <text x="50%" y="62" text-anchor="middle" font-weight="bold" font-size="14" fill="#333">${escapeXml(truncate(title, 24))}</text>
  ${subtitleText}
  <rect x="30" y="108" width="150" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="122" width="140" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="136" width="155" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="158" width="100" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="172" width="145" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="186" width="130" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="208" width="80" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="222" width="150" height="6" rx="3" fill="${lightColor}"/>
  <rect x="30" y="236" width="120" height="6" rx="3" fill="${lightColor}"/>
  <text x="50%" y="268" text-anchor="middle" font-size="10" fill="#ddd" font-weight="bold">DEMO</text>
</svg>`

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.substring(0, maxLen - 1) + '…'
}

/**
 * 为 demo data 创建带真实 SVG 缩略图的附件
 */
export function createDemoAttachment(
  seed: string,
  name: string,
  uploadedBy: string,
  kind: 'doc' | 'report' | 'certificate' | 'image' = 'doc',
) {
  const title = name.replace(/\.[^.]+$/, '')
  return {
    key: `${seed}-1`,
    name,
    url: generateDemoFileDataUrl(title, `编号: ${seed}`, seed, kind),
    size: Math.floor(Math.random() * 500000) + 50000,
    uploadedBy,
    uploadDate: '2025-06-01 09:00:00',
    type: name.endsWith('.pdf') ? 'application/pdf'
      : name.endsWith('.png') || name.endsWith('.jpg') ? 'image/jpeg'
      : 'application/octet-stream',
  }
}

/**
 * 估算 IndexedDB 存储大小（遍历所有文件）
 * 用于监控存储使用情况
 */
export async function estimateIndexedDBUsage(): Promise<{ usedBytes: number; fileCount: number }> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.openCursor()
    let usedBytes = 0
    let fileCount = 0
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        if (cursor.value instanceof ArrayBuffer) {
          usedBytes += cursor.value.byteLength
        }
        fileCount++
        cursor.continue()
      } else {
        db.close()
        resolve({ usedBytes, fileCount })
      }
    }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

/**
 * 格式化字节数为可读字符串
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}