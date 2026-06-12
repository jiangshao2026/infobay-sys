// ============================================================
// 紧凑表格样式
// 说明：统一管理所有表格单元格的紧凑内边距
// ============================================================
import { ReactNode } from 'react'

interface CompactTableProps {
  children: ReactNode
}

/**
 * 通过内联 style 覆盖 Ant Design 默认较大的单元格 padding，
 * 让所有列表页面保持一致的紧凑视觉效果。
 */
export const CompactTable = ({ children }: CompactTableProps) => (
  <CompactTableStyle>{children}</CompactTableStyle>
)

const CompactTableStyle = ({ children }: { children: ReactNode }) => (
  <>
    <style>{`
      .ant-table-thead > tr > th,
      .ant-table-tbody > tr > td {
        padding: 6px 12px !important;
      }
      .ant-table-tbody > tr > td .ant-space {
        display: flex;
      }
    `}</style>
    {children}
  </>
)

/**
 * 简化版：直接返回 style 标签，用于包裹 Table 组件内
 */
export const CompactTableCssOnly = () => (
  <style>{`
    .ant-table-thead > tr > th,
    .ant-table-tbody > tr > td {
      padding: 6px 12px !important;
    }
    .ant-table-tbody > tr > td .ant-space {
      display: flex;
    }
  `}</style>
)

export default CompactTable
