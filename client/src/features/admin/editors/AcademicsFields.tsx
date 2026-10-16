import { SEMESTERS } from '../../academics/resources/api.ts'
import { Checkbox, Group } from './fields.tsx'
import { RowsField, Select, TextArea, TextInput } from './inputs.tsx'
import { PlaceholderFields } from './PlaceholderFields.tsx'
import { bool, type FieldsProps, LEVELS, options, rows } from './types.ts'

export function ResourceFields(props: FieldsProps) {
  return (
    <>
      <Group title="The resource">
        <TextInput {...props} id="title" label="Title" maxLength={160} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            {...props}
            id="level"
            label="Level"
            options={options(LEVELS)}
            placeholder="Choose"
          />
          <Select
            {...props}
            id="semester"
            label="Semester"
            options={SEMESTERS}
            placeholder="Choose"
          />
          <TextInput
            {...props}
            id="course"
            label="Course code"
            optional
            hint="E.g. PCH201."
            maxLength={20}
          />
        </div>
        <TextInput
          {...props}
          id="url"
          label="Link"
          type="url"
          hint="Must start with https://. Only open or licensed material: never pirated textbooks."
        />
        <TextArea
          {...props}
          id="description"
          label="Description"
          optional
          rows={3}
          maxLength={300}
        />
        <TextInput
          {...props}
          id="verifiedBy"
          label="Checked by"
          hint="Who in the Academics Committee checked the link."
          maxLength={120}
        />
      </Group>
      <PlaceholderFields {...props} />
    </>
  )
}

export function GradingFields(props: FieldsProps) {
  const { form, set, errors } = props
  return (
    <>
      <Group title="The scale">
        <TextInput
          {...props}
          id="slug"
          label="Web address"
          hint="A short name for this scale: lower-case words joined by hyphens."
          maxLength={80}
        />
        <TextArea
          {...props}
          id="source"
          label="Source"
          rows={3}
          maxLength={300}
          hint="Where the scale comes from. Shown under the calculator, so students can check it."
        />
        <Checkbox
          id="active"
          label="Use this scale on the calculator"
          hint="Only one scale can be in use at a time."
          checked={bool(form, 'active')}
          onChange={(active) => set({ active })}
        />
      </Group>
      <Group title="Grades">
        <RowsField
          id="grades"
          legendHidden
          legend="Grades"
          hint="Scores are inclusive: A 70–100, B 60–69 and so on, covering 0 to 100."
          itemName="Grade"
          rows={rows(form, 'grades')}
          onChange={(grades) => set({ grades })}
          newRow={() => ({ letter: '', min: '', max: '', point: '' })}
          max={10}
          error={errors.grades}
          rowTitle={(row) =>
            typeof row.letter === 'string' && row.letter.trim()
              ? `Grade ${row.letter.trim().toUpperCase()}`
              : ''
          }
          columns={[
            { key: 'letter', label: 'Letter', maxLength: 1, span: 1 },
            { key: 'min', label: 'Lowest score', kind: 'number', maxLength: 3, span: 2 },
            { key: 'max', label: 'Highest score', kind: 'number', maxLength: 3, span: 2 },
            { key: 'point', label: 'Point', kind: 'number', maxLength: 4, span: 1 },
          ]}
        />
      </Group>
      <Group title="Results">
        <RowsField
          id="bands"
          legendHidden
          legend="Results"
          hint="What a CGPA means, covering 0.00 to 5.00, e.g. Pass 2.40–5.00 and Fail 0.00–2.39."
          itemName="Result"
          rows={rows(form, 'bands')}
          onChange={(bands) => set({ bands })}
          newRow={() => ({ name: '', min: '', max: '' })}
          max={10}
          error={errors.bands}
          rowTitle={(row) => (typeof row.name === 'string' ? row.name.trim() : '')}
          columns={[
            { key: 'name', label: 'Name', maxLength: 60, span: 2 },
            { key: 'min', label: 'Lowest CGPA', kind: 'number', maxLength: 4, span: 2 },
            { key: 'max', label: 'Highest CGPA', kind: 'number', maxLength: 4, span: 2 },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextInput
            {...props}
            id="passMark"
            label="Pass mark"
            inputMode="decimal"
            hint="The lowest passing CGPA."
            maxLength={4}
          />
          <TextInput
            {...props}
            id="unitsMin"
            label="Fewest units"
            inputMode="numeric"
            hint="Per course."
            maxLength={2}
          />
          <TextInput
            {...props}
            id="unitsMax"
            label="Most units"
            inputMode="numeric"
            hint="Per course."
            maxLength={2}
          />
        </div>
      </Group>
      <PlaceholderFields {...props} />
    </>
  )
}
