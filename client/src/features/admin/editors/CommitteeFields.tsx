import { Group, ImageField } from './fields.tsx'
import { RowsField, TextArea, TextInput, TitleAndSlug } from './inputs.tsx'
import { PlaceholderFields } from './PlaceholderFields.tsx'
import { type FieldsProps, LEVELS, options, rows, SLUG, str } from './types.ts'

const MARKDOWN = 'Markdown works: **bold**, lists with “- ”, [links](https://…).'
const LINES = 'One per line. They show as a bulleted list.'

export function CommitteeFields(props: FieldsProps) {
  const { form, set, errors } = props
  const slug = str(form, 'slug')
  return (
    <>
      <Group title="The committee">
        <TitleAndSlug
          {...props}
          titleKey="name"
          titleLabel="Name"
          pathPrefix="/leadership/committees/"
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextInput
            {...props}
            id="shortName"
            label="Short name"
            hint="For menus and cards."
            maxLength={40}
          />
          <TextInput {...props} id="session" label="Session" hint="E.g. 2026/2027." maxLength={9} />
          <TextInput
            {...props}
            id="order"
            label="Position in the list"
            inputMode="numeric"
            hint="1 comes first."
            maxLength={3}
          />
        </div>
        <TextInput {...props} id="motto" label="Motto" optional maxLength={160} />
        <TextArea {...props} id="description" label="Description" rows={8} hint={MARKDOWN} />
      </Group>

      <Group title="Officers">
        <RowsField
          id="officers"
          legendHidden
          legend="Officers"
          hint="Titles vary: Lead and Assistant, Chairman and Secretary, LEO and LLO."
          itemName="Officer"
          rows={rows(form, 'officers')}
          onChange={(officers) => set({ officers })}
          newRow={() => ({ title: '', name: '', level: '' })}
          max={12}
          error={errors.officers}
          columns={[
            { key: 'title', label: 'Title', maxLength: 60, span: 2 },
            { key: 'name', label: 'Name', maxLength: 120, span: 2 },
            {
              key: 'level',
              label: 'Level',
              kind: 'select',
              options: options(LEVELS),
              placeholder: 'Not shown',
              optional: true,
              span: 2,
            },
          ]}
        />
      </Group>

      <Group title="Work">
        <TextArea {...props} id="activities" label="Activities" optional hint={LINES} />
        <TextArea {...props} id="achievements" label="Achievements" optional hint={LINES} />
        <TextArea {...props} id="plans" label="Plans for the session" optional hint={LINES} />
        <ImageField
          folder={SLUG.test(slug) ? `committees/${slug}` : ''}
          waitingHint="Add the web address first: the photo is stored under it."
          value={str(form, 'coverImage')}
          onChange={(coverImage) => set({ coverImage })}
          error={errors.coverImage}
        />
      </Group>

      <PlaceholderFields {...props} />
    </>
  )
}
