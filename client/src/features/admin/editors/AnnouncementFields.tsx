import { Checkbox, control, Field, Group } from './fields.tsx'
import { PlaceholderFields } from './PlaceholderFields.tsx'
import { bool, type FieldsProps, str } from './types.ts'

const BODY_MAX = 1000

export function AnnouncementFields(props: FieldsProps) {
  const { form, set, errors } = props
  const body = str(form, 'body')
  return (
    <>
      <Group title="The notice">
        <Field id="title" label="Title" error={errors.title}>
          {(p) => (
            <input
              {...p}
              className={control}
              maxLength={120}
              value={str(form, 'title')}
              onChange={(e) => set({ title: e.target.value })}
            />
          )}
        </Field>
        <Field
          id="body"
          label="Message"
          hint={`Shown in full on the home page. Markdown works: **bold**, [link](https://…). ${BODY_MAX - body.length} characters left.`}
          error={errors.body}
        >
          {(p) => (
            <textarea
              {...p}
              rows={6}
              maxLength={BODY_MAX}
              className={`${control} py-2`}
              value={body}
              onChange={(e) => set({ body: e.target.value })}
            />
          )}
        </Field>
        <Field
          id="link"
          label="“Read more” link"
          optional
          hint="Must start with https://."
          error={errors.link}
        >
          {(p) => (
            <input
              {...p}
              type="url"
              inputMode="url"
              className={control}
              value={str(form, 'link')}
              onChange={(e) => set({ link: e.target.value })}
            />
          )}
        </Field>
        <Checkbox
          id="pinned"
          label="Pin to the top"
          hint="Pinned notices show before the others."
          checked={bool(form, 'pinned')}
          onChange={(checked) => set({ pinned: checked })}
        />
      </Group>

      <Group title="When it shows (Lagos time)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="publishDate"
            label="Show from"
            optional
            hint="Leave empty to show it straight away."
            error={errors.publishDate}
          >
            {(p) => (
              <input
                {...p}
                type="date"
                className={control}
                value={str(form, 'publishDate')}
                onChange={(e) => set({ publishDate: e.target.value })}
              />
            )}
          </Field>
          <Field id="publishTime" label="Time" optional>
            {(p) => (
              <input
                {...p}
                type="time"
                className={control}
                value={str(form, 'publishTime')}
                onChange={(e) => set({ publishTime: e.target.value })}
              />
            )}
          </Field>
        </div>
        <Field
          id="expiresDate"
          label="Hide after"
          optional
          hint="It disappears at the end of this day. Leave empty to keep it until you delete it."
          error={errors.expiresDate}
        >
          {(p) => (
            <input
              {...p}
              type="date"
              className={control}
              value={str(form, 'expiresDate')}
              onChange={(e) => set({ expiresDate: e.target.value })}
            />
          )}
        </Field>
      </Group>

      <PlaceholderFields {...props} />
    </>
  )
}
