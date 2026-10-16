import { BIO_WORDS, EXECUTIVE_OFFICES, SENATE_POSITIONS } from './lists.ts'
import { Checkbox, Group, ImageField } from './fields.tsx'
import { Select, TextArea, TextInput } from './inputs.tsx'
import { PlaceholderFields } from './PlaceholderFields.tsx'
import {
  bool,
  type FieldsProps,
  isSession,
  LEVELS,
  options,
  sessionFolder,
  str,
  wordCount,
} from './types.ts'

const LEVEL_OPTIONS = options(LEVELS)

function SessionNameLevel(props: FieldsProps) {
  return (
    <>
      <TextInput
        {...props}
        id="session"
        label="Session"
        hint="E.g. 2026/2027. The site shows the newest session."
        maxLength={9}
      />
      <TextInput
        {...props}
        id="name"
        label="Name"
        hint="As they’d like it shown. Use “To be announced” until it’s confirmed."
        maxLength={120}
        autoComplete="off"
      />
      <Select
        {...props}
        id="level"
        label="Level"
        optional
        options={LEVEL_OPTIONS}
        placeholder="Not shown"
      />
    </>
  )
}

export function ExecutiveFields(props: FieldsProps) {
  const { form, set, errors } = props
  const session = str(form, 'session').trim()
  const words = wordCount(str(form, 'bio'))
  return (
    <>
      <Group title="The officer">
        <Select
          {...props}
          id="office"
          label="Office"
          options={options(EXECUTIVE_OFFICES)}
          placeholder="Choose the office"
          hint="The list on the site follows the constitution’s order of offices."
        />
        <SessionNameLevel {...props} />
        <TextArea
          {...props}
          id="bio"
          label="Bio"
          optional
          rows={4}
          hint={`Up to ${BIO_WORDS} words: ${words} so far.`}
        />
        <TextInput
          {...props}
          id="roleEmail"
          label="Role email"
          type="email"
          optional
          maxLength={160}
          hint="The office’s official email only, never a personal address."
        />
        <ImageField
          id="photo"
          label="Photo"
          folder={isSession(session) ? `executives/${sessionFolder(session)}` : ''}
          waitingHint="Add the session first: the photo is stored under it."
          value={str(form, 'photo')}
          onChange={(photo) => set({ photo })}
          error={errors.photo}
          aspectRatio={4 / 3}
        />
      </Group>
      <PlaceholderFields {...props} />
    </>
  )
}

export function SenatorFields(props: FieldsProps) {
  return (
    <>
      <Group title="The officer">
        <Select
          {...props}
          id="position"
          label="Position"
          options={options(SENATE_POSITIONS)}
          placeholder="Choose the position"
        />
        <SessionNameLevel {...props} />
      </Group>
      <PlaceholderFields {...props} />
    </>
  )
}

export function PatronFields(props: FieldsProps) {
  const { form, set } = props
  return (
    <>
      <Group title="The patron">
        <TextInput
          {...props}
          id="name"
          label="Name"
          hint="With their title, e.g. “Prof. A. B. Example”."
          maxLength={120}
        />
        <TextInput
          {...props}
          id="title"
          label="Role"
          hint="E.g. “Dean, Faculty of Pharmacy” or “Patron”."
          maxLength={120}
        />
        <TextInput
          {...props}
          id="order"
          label="Position in the list"
          inputMode="numeric"
          hint="1 comes first. The Dean is usually 1."
          maxLength={2}
        />
        <Checkbox
          id="isDean"
          label="This is the Dean of the Faculty"
          checked={bool(form, 'isDean')}
          onChange={(isDean) => set({ isDean })}
        />
      </Group>
      <PlaceholderFields {...props} />
    </>
  )
}
