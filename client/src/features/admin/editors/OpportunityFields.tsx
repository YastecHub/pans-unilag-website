import {
  OPPORTUNITY_TYPE_LABELS,
  OPPORTUNITY_TYPES,
} from '../../opportunities/api/opportunities.ts'
import { control, Field, Group } from './fields.tsx'
import { slugify } from './lagos.ts'
import { PlaceholderFields } from './PlaceholderFields.tsx'
import { bool, type FieldsProps, str } from './types.ts'

export function OpportunityFields(props: FieldsProps) {
  const { form, set, errors, isNew } = props
  const slug = str(form, 'slug')
  const onTitle = (title: string) =>
    set(isNew && !bool(form, 'slugEdited') ? { title, slug: slugify(title) } : { title })

  return (
    <>
      <Group title="The opportunity">
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
              The page will be at /opportunities/{slug || '…'}.{' '}
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
        <Field id="type" label="Type" error={errors.type}>
          {(p) => (
            <select
              {...p}
              className={control}
              value={str(form, 'type')}
              onChange={(e) => set({ type: e.target.value })}
            >
              <option value="">Choose a type</option>
              {OPPORTUNITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {OPPORTUNITY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field id="organisation" label="Offered by" optional error={errors.organisation}>
          {(p) => (
            <input
              {...p}
              className={control}
              maxLength={120}
              value={str(form, 'organisation')}
              onChange={(e) => set({ organisation: e.target.value })}
            />
          )}
        </Field>
        <Field
          id="applyUrl"
          label="Apply link"
          hint="The official page where students apply. Must start with https://."
          error={errors.applyUrl}
        >
          {(p) => (
            <input
              {...p}
              type="url"
              inputMode="url"
              className={control}
              value={str(form, 'applyUrl')}
              onChange={(e) => set({ applyUrl: e.target.value })}
            />
          )}
        </Field>
        <Field
          id="deadline"
          label="Deadline"
          optional
          hint="The last day to apply. It disappears from the site the day after. Leave empty if applications are always open."
          error={errors.deadline}
        >
          {(p) => (
            <input
              {...p}
              type="date"
              className={control}
              value={str(form, 'deadline')}
              onChange={(e) => set({ deadline: e.target.value })}
            />
          )}
        </Field>
      </Group>

      <Group title="Details">
        <Field
          id="eligibility"
          label="Who can apply"
          optional
          hint="E.g. “300L and 400L students”."
          error={errors.eligibility}
        >
          {(p) => (
            <input
              {...p}
              className={control}
              maxLength={500}
              value={str(form, 'eligibility')}
              onChange={(e) => set({ eligibility: e.target.value })}
            />
          )}
        </Field>
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
        <Field
          id="lastChecked"
          label="Details checked on"
          optional
          hint="When you last confirmed the details on the official site. Shown to students."
          error={errors.lastChecked}
        >
          {(p) => (
            <input
              {...p}
              type="date"
              className={control}
              value={str(form, 'lastChecked')}
              onChange={(e) => set({ lastChecked: e.target.value })}
            />
          )}
        </Field>
      </Group>

      <PlaceholderFields {...props} />
    </>
  )
}
