'use client'

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED = { 'image/jpeg': [], 'image/png': [], 'image/webp': [] }

export default function Home() {
  const [original, setOriginal] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sliderPos, setSliderPos] = useState(50)
  const [elapsed, setElapsed] = useState<number | null>(null)
  const fileRef = useRef<File | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const processFile = useCallback(async (file: File) => {
    fileRef.current = file
    setOriginal(URL.createObjectURL(file))
    setResult(null)
    setError(null)
    setElapsed(null)
    setLoading(true)
    const start = Date.now()
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/remove-bg', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '处理失败')
      }
      const blob = await res.blob()
      setResult(URL.createObjectURL(blob))
      setElapsed(Date.now() - start)
      setSliderPos(50)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }, [])

  const onDrop = useCallback((accepted: File[], rejected: { errors: { code: string }[] }[]) => {
    if (rejected.length > 0) {
      const code = rejected[0].errors[0].code
      if (code === 'file-too-large') setError('文件超过 10MB 限制')
      else if (code === 'file-invalid-type') setError('仅支持 JPG、PNG、WEBP 格式')
      else setError('文件不符合要求')
      return
    }
    if (accepted[0]) processFile(accepted[0])
  }, [processFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    multiple: false,
  })

  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pos = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    setSliderPos(pos)
  }, [])

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `removed-bg-${Date.now()}.png`
    a.click()
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Image BG Remover</h1>
      <p className="text-gray-500 mb-8 text-center">上传图片 → 自动去背景 → 下载 PNG</p>

      {/* 步骤说明 */}
      <div className="flex gap-6 mb-8 text-sm text-gray-500">
        {['① 上传图片', '② 自动处理', '③ 下载结果'].map((s) => (
          <span key={s} className="flex items-center gap-1">{s}</span>
        ))}
      </div>

      {/* 上传区域 */}
      <div
        {...getRootProps()}
        className={`w-full max-w-xl border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'}`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">🖼️</div>
        <p className="text-gray-600 font-medium">
          {isDragActive ? '松开以上传' : '拖拽图片到此处，或点击选择文件'}
        </p>
        <p className="text-gray-400 text-sm mt-2">支持 JPG、PNG、WEBP，最大 10MB</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 w-full max-w-xl bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-red-600 text-sm">{error}</span>
          <button
            onClick={() => fileRef.current && processFile(fileRef.current)}
            className="text-sm text-red-500 underline ml-4"
          >重试</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">正在处理中，请稍候...</p>
        </div>
      )}

      {/* 对比视图 */}
      {original && result && !loading && (
        <div className="mt-8 w-full max-w-2xl">
          {elapsed && (
            <p className="text-center text-sm text-gray-400 mb-3">处理耗时 {(elapsed / 1000).toFixed(1)}s</p>
          )}
          <div
            ref={containerRef}
            className="relative w-full rounded-2xl overflow-hidden select-none cursor-col-resize"
            style={{ aspectRatio: '16/9' }}
            onMouseDown={() => { dragging.current = true }}
            onMouseMove={(e) => { if (dragging.current) handleSliderMove(e.clientX) }}
            onMouseUp={() => { dragging.current = false }}
            onMouseLeave={() => { dragging.current = false }}
            onTouchMove={(e) => handleSliderMove(e.touches[0].clientX)}
          >
            {/* 结果图（底层） */}
            <img src={result} alt="去背景后" className="absolute inset-0 w-full h-full object-contain bg-[url('/checker.png')] bg-repeat" />
            {/* 原图（裁剪） */}
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
              <img src={original} alt="原图" className="absolute inset-0 w-full h-full object-contain bg-white" style={{ width: `${10000 / sliderPos}%`, maxWidth: 'none' }} />
            </div>
            {/* 滑块 */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
              style={{ left: `calc(${sliderPos}% - 2px)` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 text-xs font-bold">⇔</div>
            </div>
            {/* 标签 */}
            <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">原图</span>
            <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">去背景</span>
          </div>

          <button
            onClick={handleDownload}
            className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            ⬇️ 下载 PNG
          </button>
        </div>
      )}
    </main>
  )
}
