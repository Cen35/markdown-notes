import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

type Note = { id: string; title: string; content: string; updatedAt: string }
const KEY = 'moji-notes-v1'
const welcome = `# 欢迎使用墨记

这是一个支持 **实时预览** 的 Markdown 笔记应用。

## 现在就试试

- 在左边输入，右边立即预览
- 使用 \`Ctrl + B\` 快速加粗
- 代码块支持语法高亮

\`\`\`javascript
const idea = "记录，让灵感有迹可循";
console.log(idea);
\`\`\`

> 所有笔记自动保存在当前浏览器中。
`
const initial: Note[] = [{ id: 'welcome', title: '欢迎使用墨记', content: welcome, updatedAt: new Date().toISOString() }]
const load = () => { try { const value = localStorage.getItem(KEY); return value ? JSON.parse(value) as Note[] : initial } catch { return initial } }

export default function App() {
  const [notes, setNotes] = useState<Note[]>(load)
  const [activeId, setActiveId] = useState(notes[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [mobileTab, setMobileTab] = useState<'edit'|'preview'>('edit')
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const active = notes.find(note => note.id === activeId) ?? notes[0]

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(notes)), [notes])
  const filtered = useMemo(() => notes.filter(note => note.title.toLowerCase().includes(query.toLowerCase())).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)), [notes, query])

  const update = (changes: Partial<Note>) => setNotes(items => items.map(note => note.id === active?.id ? { ...note, ...changes, updatedAt: new Date().toISOString() } : note))
  const createNote = () => {
    const note = { id: crypto.randomUUID(), title: '未命名笔记', content: '# 未命名笔记\n\n开始写点什么吧……', updatedAt: new Date().toISOString() }
    setNotes(items => [note, ...items]); setActiveId(note.id); setMobileTab('edit')
  }
  const remove = () => {
    if (!active || !confirm(`确定删除“${active.title}”吗？`)) return
    const next = notes.filter(note => note.id !== active.id)
    setNotes(next); setActiveId(next[0]?.id ?? '')
  }
  const handleKeys = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const box = event.currentTarget
    if (event.key === 'Tab') {
      event.preventDefault(); const start = box.selectionStart; const end = box.selectionEnd
      update({ content: active.content.slice(0,start) + '  ' + active.content.slice(end) })
      requestAnimationFrame(() => { box.selectionStart = box.selectionEnd = start + 2 })
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault(); const start = box.selectionStart; const end = box.selectionEnd; const selected = active.content.slice(start,end) || '加粗文字'
      update({ content: active.content.slice(0,start) + `**${selected}**` + active.content.slice(end) })
      requestAnimationFrame(() => { box.selectionStart = start + 2; box.selectionEnd = start + 2 + selected.length })
    }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="logo"><span>墨</span><div><strong>墨记</strong><small>MARKDOWN NOTES</small></div></div>
      <button className="new-note" onClick={createNote}>＋ 新建笔记</button>
      <label className="search"><span>⌕</span><input aria-label="搜索笔记" value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索笔记标题" /></label>
      <div className="note-count">全部笔记 <span>{notes.length}</span></div>
      <nav className="notes">
        {filtered.map(note => <button key={note.id} className={note.id === active?.id ? 'active' : ''} onClick={() => setActiveId(note.id)}><strong>{note.title || '未命名笔记'}</strong><small>{new Intl.DateTimeFormat('zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(note.updatedAt))}</small><p>{note.content.replace(/[#*`>\-[\]]/g,' ').replace(/\s+/g,' ').slice(0,42)}</p></button>)}
        {filtered.length === 0 && <p className="no-result">没有找到相关笔记</p>}
      </nav>
      <div className="storage">● 已自动保存到本地</div>
    </aside>

    <main>
      {active ? <>
        <header className="editor-header">
          <div><input aria-label="笔记标题" value={active.title} onChange={e => update({title:e.target.value})} /><small>最后编辑 {new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit'}).format(new Date(active.updatedAt))}</small></div>
          <button className="delete" onClick={remove}>删除笔记</button>
        </header>
        <div className="mobile-tabs"><button className={mobileTab==='edit'?'active':''} onClick={()=>setMobileTab('edit')}>编辑</button><button className={mobileTab==='preview'?'active':''} onClick={()=>setMobileTab('preview')}>预览</button></div>
        <section className="split">
          <div className={`pane editor-pane ${mobileTab==='edit'?'mobile-active':''}`}><div className="pane-label"><span>MARKDOWN</span><span>{active.content.length} 字符</span></div><textarea ref={editorRef} aria-label="Markdown 编辑器" spellCheck={false} value={active.content} onChange={e => update({content:e.target.value})} onKeyDown={handleKeys}/></div>
          <div className={`pane preview-pane ${mobileTab==='preview'?'mobile-active':''}`}><div className="pane-label"><span>PREVIEW</span><span>实时渲染</span></div><article className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{active.content}</ReactMarkdown></article></div>
        </section>
      </> : <div className="empty"><span>✦</span><h1>写下第一条笔记</h1><p>让零散的灵感有一个安静的归处。</p><button onClick={createNote}>新建笔记</button></div>}
    </main>
  </div>
}
