import { useState } from 'react'
import { Folder, FileText, Image, FileCode, ChevronRight, Upload, Download, Trash2 } from 'lucide-react'

type FileItem = { name: string; type: 'folder' | 'file'; ext?: string; size?: string; modified?: string; children?: FileItem[] }

const FILE_TREE: FileItem[] = [
  { name: 'src', type: 'folder', children: [
    { name: 'components', type: 'folder', children: [
      { name: 'IconSidebar.tsx', type: 'file', ext: 'tsx', size: '2.1 KB', modified: '2h ago' },
      { name: 'NavSidebar.tsx', type: 'file', ext: 'tsx', size: '8.7 KB', modified: '2h ago' },
      { name: 'Conversation.tsx', type: 'file', ext: 'tsx', size: '12.4 KB', modified: '3h ago' },
    ]},
    { name: 'pages', type: 'folder', children: [
      { name: 'Dashboard.tsx', type: 'file', ext: 'tsx', size: '5.2 KB', modified: '1h ago' },
      { name: 'Chat.tsx', type: 'file', ext: 'tsx', size: '15.8 KB', modified: '1h ago' },
    ]},
    { name: 'App.tsx', type: 'file', ext: 'tsx', size: '3.5 KB', modified: '1h ago' },
    { name: 'index.css', type: 'file', ext: 'css', size: '0.3 KB', modified: '1d ago' },
  ]},
  { name: 'api', type: 'folder', children: [
    { name: 'chat.js', type: 'file', ext: 'js', size: '4.2 KB', modified: '1d ago' },
  ]},
  { name: 'public', type: 'folder', children: [
    { name: 'favicon.svg', type: 'file', ext: 'svg', size: '0.5 KB', modified: '1d ago' },
    { name: 'logo.png', type: 'file', ext: 'png', size: '24 KB', modified: '1d ago' },
  ]},
  { name: 'package.json', type: 'file', ext: 'json', size: '1.1 KB', modified: '1d ago' },
  { name: 'vite.config.ts', type: 'file', ext: 'ts', size: '0.3 KB', modified: '1d ago' },
  { name: 'wrangler.toml', type: 'file', ext: 'toml', size: '0.4 KB', modified: '2d ago' },
]

const FILE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  tsx: FileCode, js: FileCode, ts: FileCode, css: FileText, json: FileText, svg: Image, png: Image, toml: FileText,
}

function FileTreeNode({ item, depth = 0, selectedPath, onSelect }: { item: FileItem; depth?: number; selectedPath: string; onSelect: (path: string) => void }) {
  const [expanded, setExpanded] = useState(depth < 1)
  const Icon = item.type === 'folder' ? Folder : (item.ext ? FILE_ICONS[item.ext] || FileText : FileText)
  const path = item.name

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm ${selectedPath === path ? 'bg-[#EBF4FF] text-[#2878D9]' : 'text-[#6B7280] hover:bg-[#F9FAFB]'}`}
        onClick={() => { if (item.type === 'folder') setExpanded(!expanded); onSelect(path) }}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {item.type === 'folder' && (
          <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''} text-[#9CA3AF]`} />
        )}
        <Icon size={15} className={item.type === 'folder' ? 'text-[#D97706]' : 'text-[#6B7280]'} />
        <span className="truncate">{item.name}</span>
      </div>
      {item.type === 'folder' && expanded && item.children?.map((child, i) => (
        <FileTreeNode key={i} item={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} />
      ))}
    </div>
  )
}

export default function FilesPage() {
  const [selectedPath, setSelectedPath] = useState('src')

  function findItem(items: FileItem[], name: string): FileItem | null {
    for (const item of items) {
      if (item.name === name) return item
      if (item.children) {
        const found = findItem(item.children, name)
        if (found) return found
      }
    }
    return null
  }

  const selectedItem = findItem(FILE_TREE, selectedPath)

  return (
    <div className="flex-1 flex bg-[#FAFAFA]">
      <div className="w-56 flex-shrink-0 bg-white border-r border-[#E5E7EB] p-3 overflow-y-auto">
        <div className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-2 px-2">FILES</div>
        {FILE_TREE.map((item, i) => (
          <FileTreeNode key={i} item={item} selectedPath={selectedPath} onSelect={setSelectedPath} />
        ))}
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-white">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <span className="text-[#111827] font-medium">{selectedPath}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB]"><Upload size={14} />Upload</button>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-[#2878D9] text-white rounded-lg text-xs font-medium hover:bg-[#1D5FA8]"><Download size={14} />Download</button>
          </div>
        </div>

        {selectedItem?.type === 'folder' && selectedItem.children ? (
          <div className="p-6 grid grid-cols-4 gap-4">
            {selectedItem.children.map((child, i) => {
              const Icon = child.type === 'folder' ? Folder : (child.ext ? FILE_ICONS[child.ext] || FileText : FileText)
              return (
                <div key={i} className="bg-white rounded-lg border border-[#E5E7EB] p-4 cursor-pointer hover:border-[#D1D5DB]" onClick={() => setSelectedPath(child.name)}>
                  <Icon size={32} className={child.type === 'folder' ? 'text-[#D97706] mb-3' : 'text-[#6B7280] mb-3'} />
                  <p className="text-sm font-medium text-[#111827] truncate">{child.name}</p>
                  {child.size && <p className="text-xs text-[#9CA3AF] mt-1">{child.size}</p>}
                </div>
              )
            })}
          </div>
        ) : selectedItem ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-8 max-w-md w-full mx-6">
              <FileText size={40} className="text-[#D1D5DB] mb-4" />
              <h3 className="text-sm font-semibold text-[#111827] mb-2">{selectedItem.name}</h3>
              <div className="space-y-2 text-sm text-[#6B7280]">
                <p>Size: {selectedItem.size}</p>
                <p>Modified: {selectedItem.modified}</p>
                <p>Type: {selectedItem.ext?.toUpperCase() || 'File'}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex items-center gap-1 px-3 py-1.5 bg-[#2878D9] text-white rounded-lg text-xs font-medium"><Download size={14} />Download</button>
                <button className="flex items-center gap-1 px-3 py-1.5 border border-[#EF4444] text-[#EF4444] rounded-lg text-xs font-medium"><Trash2 size={14} />Delete</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[#9CA3AF]">Select a file or folder</p>
          </div>
        )}
      </div>
    </div>
  )
}
