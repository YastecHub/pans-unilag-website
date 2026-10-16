import { useCommittees } from '../../committees/api/committees.ts'
import { control, Field, Group, ImageField } from './fields.tsx'
import { slugify } from './lagos.ts'
import { PlaceholderFields } from './PlaceholderFields.tsx'
import { bool, type FieldsProps, str, precision, type Precision, SLUG } from './types.ts'

const PRECISIONS: { value: Precision; label: string; hint: string }[] = [
  { value: 'day', label: 'Exact dates', hint: 'You know the day(s).' },
  {
    value: 'month',
    label: 'Months only',
    hint: 'E.g. “April – May 2027”. The site never shows a made-up day.',
  },
  {
    value: 'unknown',
    label: 'Not known yet',
    hint: 'For a past event whose dates weren’t recorded. It stays a placeholder.',
  },
]

function DateFields({ form, set, errors }: FieldsProps) {
  const p = precision(form)
  return (
    <Group title="When (Lagos time)">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium">How exact are the dates?</legend>
        {PRECISIONS.map((option) => (
          <label key={option.value} className="flex items-start gap-3">
            <input
              type="radio"
              name="datePrecision"
              value={option.value}
              checked={p === option.value}
              onChange={() =>
                set({
                  datePrecision: option.value,
                  ...(option.value === 'unknown' ? { isPlaceholder: true } : {}),
                })
              }
              className="mt-1 size-5 shrink-0 accent-primary"
            />
            <span>
              <span className="font-medium">{option.label}</span>
              <span className="block text-small text-text-muted">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {p === 'day' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="startDate" label="Starts on" error={errors.startDate}>
            {(props) => (
              <input
                {...props}
                type="date"
                className={control}
                value={str(form, 'startDate')}
                onChange={(e) => set({ startDate: e.target.value })}
              />
            )}
          </Field>
          <Field
            id="startTime"
            label="Start time"
            optional
            hint="Leave both times empty for an all-day event."
          >
            {(props) => (
              <input
                {...props}
                type="time"
                className={control}
                value={str(form, 'startTime')}
                onChange={(e) => set({ startTime: e.target.value })}
              />
            )}
          </Field>
          <Field
            id="endDate"
            label="Ends on"
            optional
            hint="Leave empty for a one-day event."
            error={errors.endDate}
          >
            {(props) => (
              <input
                {...props}
                type="date"
                className={control}
                value={str(form, 'endDate')}
                onChange={(e) => set({ endDate: e.target.value })}
              />
            )}
          </Field>
          <Field id="endTime" label="End time" optional>
            {(props) => (
              <input
                {...props}
                type="time"
                className={control}
                value={str(form, 'endTime')}
                onChange={(e) => set({ endTime: e.target.value })}
              />
            )}
          </Field>
        </div>
      )}

      {p === 'month' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="startMonth"
            label="From month"
            error={errors.startMonth}
            hint="E.g. April 2027."
          >
            {(props) => (
              <input
                {...props}
                type="month"
                className={control}
                value={str(form, 'startMonth')}
                onChange={(e) => set({ startMonth: e.target.value })}
              />
            )}
          </Field>
          <Field
            id="endMonth"
            label="To month"
            optional
            hint="Leave empty if it’s within one month."
            error={errors.endMonth}
          >
            {(props) => (
              <input
                {...props}
                type="month"
                className={control}
                value={str(form, 'endMonth')}
                onChange={(e) => set({ endMonth: e.target.value })}
              />
            )}
          </Field>
        </div>
      )}
    </Group>
  )
}

export function EventFields(props: FieldsProps) {
  const { form, set, errors, isNew } = props
  const committees = useCommittees()
  const slug = str(form, 'slug')
  const onTitle = (title: string) =>
    // New events get their web address from the title until it's edited by hand.
    set(isNew && !bool(form, 'slugEdited') ? { title, slug: slugify(title) } : { title })

  return (
    <>
      <Group title="The event">
        <Field id="title" label="Title" error={errors.title}>
          {(p) => (
            <input
              {...p}
              className={control}
              maxLength={160}
              value={str(form, 'title')}
              onChange={(e) => onTitle(e.target.value)}
            />
          )}
        </Field>
        <Field
          id="slug"
          label="Web address"
          hint={
            <>
              The page will be at /events/{slug || '…'}.{' '}
              {!isNew && 'Changing it breaks links people have already shared.'}
            </>
          }
          error={errors.slug}
        >
          {(p) => (
            <input
              {...p}
              className={control}
              maxLength={80}
              value={slug}
              onChange={(e) => set({ slug: e.target.value, slugEdited: true })}
            />
          )}
        </Field>
        <Field id="venue" label="Venue" optional error={errors.venue}>
          {(p) => (
            <input
              {...p}
              className={control}
              maxLength={200}
              value={str(form, 'venue')}
              onChange={(e) => set({ venue: e.target.value })}
            />
          )}
        </Field>
        <Field
          id="registrationUrl"
          label="Registration link"
          optional
          hint="Must start with https://. The Register button appears once this is set."
          error={errors.registrationUrl}
        >
          {(p) => (
            <input
              {...p}
              type="url"
              inputMode="url"
              className={control}
              value={str(form, 'registrationUrl')}
              onChange={(e) => set({ registrationUrl: e.target.value })}
            />
          )}
        </Field>
      </Group>

      <DateFields {...props} />

      <Group title="Details">
        <Field
          id="description"
          label="Description"
          optional
          hint="Markdown works: **bold**, lists with “- ”, [links](https://…)."
          error={errors.description}
        >
          {(p) => (
            <textarea
              {...p}
              rows={8}
              className={`${control} py-2`}
              value={str(form, 'description')}
              onChange={(e) => set({ description: e.target.value })}
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <Field
            id="series"
            label="Series"
            optional
            hint="Groups the days of a multi-day event, e.g. “PANS Health Week 2027”."
            error={errors.series}
          >
            {(p) => (
              <input
                {...p}
                className={control}
                maxLength={120}
                value={str(form, 'series')}
                onChange={(e) => set({ series: e.target.value })}
              />
            )}
          </Field>
          <Field id="dayNumber" label="Day" optional error={errors.dayNumber}>
            {(p) => (
              <input
                {...p}
                inputMode="numeric"
                className={control}
                value={str(form, 'dayNumber')}
                onChange={(e) => set({ dayNumber: e.target.value })}
              />
            )}
          </Field>
        </div>
        <Field id="committee" label="Organised by" optional error={errors.committee}>
          {(p) => (
            <select
              {...p}
              className={control}
              value={str(form, 'committee')}
              onChange={(e) => set({ committee: e.target.value })}
            >
              <option value="">PANS UNILAG (no particular committee)</option>
              {committees.data?.committees.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <ImageField
          folder={SLUG.test(slug) ? `events/${slug}` : ''}
          value={str(form, 'coverImage')}
          alt={str(form, 'coverImageAlt')}
          onChange={(coverImage) => set({ coverImage })}
          onAltChange={(coverImageAlt) => set({ coverImageAlt })}
          error={errors.coverImage}
          altError={errors.coverImageAlt}
        />
      </Group>

      <PlaceholderFields
        {...props}
        forced={
          precision(form) === 'unknown'
            ? 'Events with unknown dates stay on the Placeholders list until their dates are added.'
            : undefined
        }
      />
    </>
  )
}
