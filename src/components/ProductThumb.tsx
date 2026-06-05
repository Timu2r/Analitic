import { useState } from 'react'
import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Реальное изображение товара с фолбэком на lucide-иконку при ошибке загрузки. */
export function ProductThumb({
  src,
  alt,
  className,
  iconClassName,
}: {
  src: string
  alt: string
  className?: string
  iconClassName?: string
}) {
  const [failed, setFailed] = useState(false)

  // Пустой/отсутствующий src (моки WB/Яндекс без реального фото) → сразу фолбэк,
  // не рендерим <img src=""> (ломает загрузку + warning React).
  if (failed || !src || !src.trim()) {
    return (
      <div className={cn('flex items-center justify-center bg-muted text-muted-foreground', className)}>
        <Package className={cn('size-1/2', iconClassName)} />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('bg-muted object-cover', className)}
    />
  )
}
