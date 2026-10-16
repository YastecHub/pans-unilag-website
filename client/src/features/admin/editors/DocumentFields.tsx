import { PUBLICATION_SERIES } from './lists.ts'
import { Group, ImageField } from './fields.tsx'
import { RowsField, Select, TextArea, TextInput, TitleAndSlug } from './inputs.tsx'
import { PlaceholderFields } from './PlaceholderFields.tsx'
import { type FieldsProps, rows, str } from './types.ts'

const LINK_HINT =
  'Must start with https://. A file on Google Drive works: share it as “Anyone with the link”.'

export function PageFields(props: FieldsProps) {
  const { form, set, errors } = props
  return (
    <>
      <Group title="The page">
        <TextInput {...props} id="title" label="Title" maxLength={120} />
        <RowsField
          id="sections"
          legend="Sections"
          hint="Each section has a heading and text. Markdown works: **bold**, lists with “- ”, [links](https://…). Cite the constitution so readers can check it."
          itemName="Section"
          rows={rows(form, 'sections')}
          onChange={(sections) => set({ sections })}
          newRow={() => ({ heading: '', bodyMarkdown: '', articleRefs: '' })}
          max={30}
          error={errors.sections}
          rowTitle={(row, i) =>
            typeof row.heading === 'string' && row.heading.trim()
              ? `Section ${i + 1}: ${row.heading.trim()}`
              : ''
          }
          columns={[
            { key: 'heading', label: 'Heading', maxLength: 120, span: 6 },
            { key: 'bodyMarkdown', label: 'Text', kind: 'textarea', span: 6 },
            {
              key: 'articleRefs',
              label: 'Constitution articles',
              optional: true,
              hint: 'Separated by commas, e.g. Art. 19, Art. 4 S.B',
              span: 6,
            },
          ]}
        />
      </Group>
      <PlaceholderFields {...props} />
    </>
  )
}

export function PublicationFields(props: FieldsProps) {
  const { form, set, errors } = props
  const series = str(form, 'series')
  return (
    <>
      <Group title="The publication">
        <TitleAndSlug {...props} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            {...props}
            id="series"
            label="Series"
            options={PUBLICATION_SERIES}
            placeholder="Choose the series"
          />
          <TextInput
            {...props}
            id="edition"
            label="Edition"
            optional
            hint="E.g. 2026 or Issue 3."
            maxLength={60}
          />
          <TextInput {...props} id="publishedOn" label="Published on" type="date" optional />
        </div>
        <TextArea {...props} id="summary" label="Summary" optional rows={3} maxLength={300} />
      </Group>
      <Group title="Where to read it">
        <TextInput
          {...props}
          id="fileUrl"
          label="PDF link"
          type="url"
          optional
          hint={`For a download, e.g. a Recipharm edition. ${LINK_HINT}`}
        />
        <TextInput
          {...props}
          id="link"
          label="Page link"
          type="url"
          optional
          hint="For a page to open instead, e.g. the Substack."
        />
        <ImageField
          id="cover"
          label="Cover"
          folder={series ? `publications/${series}` : ''}
          waitingHint="Choose the series first: the cover is stored under it."
          value={str(form, 'cover')}
          onChange={(cover) => set({ cover })}
          error={errors.cover}
          aspectRatio={3 / 4}
        />
      </Group>
      <PlaceholderFields {...props} />
    </>
  )
}

export function DocumentFields(props: FieldsProps) {
  return (
    <>
      <Group title="The document">
        <TitleAndSlug
          {...props}
          slugHint="The same for every version, e.g. constitution. The site shows the newest version."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            {...props}
            id="version"
            label="Version"
            hint="E.g. 2026, or “2026, amended”."
            maxLength={40}
          />
          <TextInput {...props} id="approvedOn" label="Approved on" type="date" />
        </div>
        <TextInput
          {...props}
          id="approvedBy"
          label="Approved by"
          optional
          hint="E.g. “The Congress of PANS UNILAG”."
          maxLength={160}
        />
        <TextArea {...props} id="summary" label="Summary" optional rows={3} maxLength={500} />
      </Group>
      <Group title="The PDF">
        <TextInput {...props} id="fileUrl" label="PDF link" type="url" hint={LINK_HINT} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            {...props}
            id="fileSizeMb"
            label="File size in MB"
            optional
            inputMode="decimal"
            hint="Shown on the download button, e.g. 7.1."
            maxLength={8}
          />
          <TextInput
            {...props}
            id="pageCount"
            label="Pages"
            optional
            inputMode="numeric"
            maxLength={4}
          />
        </div>
      </Group>
      <PlaceholderFields {...props} />
    </>
  )
}
