import type { ReactNode } from 'react'
import { Img } from '../../../components/ui/Img.tsx'
import { PlaceholderImage, PlaceholderText } from '../../../components/ui/Placeholder.tsx'

type Props = {
  /** Office or title, e.g. "Vice President", "Dean, Faculty of Pharmacy". */
  role: string
  name: string
  /** True for "Name to be announced" / "Election pending": shown as a placeholder, never as a name. */
  nameIsStandIn: boolean
  level?: string
  /** Cloudinary id; undefined = this kind of person has no photos, "" = photo still to come. */
  photo?: string
  children?: ReactNode
}

/** One officer: photo (or silhouette), role, name (or a clearly marked placeholder) and details. */
export function PersonCard({ role, name, nameIsStandIn, level, photo, children }: Props) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface">
      {photo !== undefined &&
        (photo ? (
          <Img publicId={photo} alt={`${name}, ${role}`} width={480} height={360} />
        ) : (
          <div className="p-3 pb-0">
            <PlaceholderImage kind="person" />
          </div>
        ))}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-small font-medium tracking-[0.06em] text-text-brand uppercase">{role}</p>
        <h3 className="text-[1.25rem]">
          {nameIsStandIn ? <PlaceholderText>{name}</PlaceholderText> : name}
        </h3>
        {level && <p className="text-small text-text-muted">{level}</p>}
        {children}
      </div>
    </article>
  )
}
