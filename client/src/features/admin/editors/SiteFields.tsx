import { useAllEvents } from '../../events/api/events.ts'
import { Checkbox, Group } from './fields.tsx'
import { RowsField, Select, TextArea, TextInput, TitleAndSlug } from './inputs.tsx'
import { SOCIAL_PLATFORMS } from './lists.ts'
import { PhotosField } from './PhotosField.tsx'
import { PlaceholderFields } from './PlaceholderFields.tsx'
import { bool, type FieldsProps, options, rows, SLUG, str } from './types.ts'

export function SettingsFields(props: FieldsProps) {
  const { form, set, errors } = props
  return (
    <>
      <Group title="Contact">
        <TextArea
          {...props}
          id="postalAddress"
          label="Postal address"
          rows={3}
          maxLength={300}
          hint="Shown on the Contact page and in the footer."
        />
        <TextInput
          {...props}
          id="location"
          label="Where to find us"
          optional
          maxLength={300}
          hint="The physical location, if different from the postal address."
        />
        <TextInput
          {...props}
          id="contactEmail"
          label="Official email"
          type="email"
          optional
          maxLength={160}
          hint="A role address only (e.g. the Secretary General’s), never a personal one."
        />
      </Group>
      <Group title="Social media">
        <RowsField
          id="socialLinks"
          legendHidden
          legend="Social media"
          hint="Links must start with https://."
          itemName="Link"
          rows={rows(form, 'socialLinks')}
          onChange={(socialLinks) => set({ socialLinks })}
          newRow={() => ({ platform: '', url: '' })}
          max={SOCIAL_PLATFORMS.length}
          error={errors.socialLinks}
          addLabel="Add a social media link"
          rowTitle={(row) => (typeof row.platform === 'string' ? row.platform : '')}
          columns={[
            {
              key: 'platform',
              label: 'Platform',
              kind: 'select',
              options: options(SOCIAL_PLATFORMS),
              placeholder: 'Choose',
              span: 2,
            },
            { key: 'url', label: 'Address', kind: 'url', span: 4 },
          ]}
        />
      </Group>
      <Group title="Footer and home page">
        <RowsField
          id="quickLinks"
          legend="Footer links"
          hint="A page on this site (starting with /) or an https:// address."
          itemName="Link"
          rows={rows(form, 'quickLinks')}
          onChange={(quickLinks) => set({ quickLinks })}
          newRow={() => ({ label: '', url: '' })}
          max={12}
          error={errors.quickLinks}
          addLabel="Add a footer link"
          columns={[
            { key: 'label', label: 'Label', maxLength: 60, span: 2 },
            { key: 'url', label: 'Address', span: 4 },
          ]}
        />
        <TextInput
          {...props}
          id="bannerText"
          label="Banner text"
          optional
          maxLength={200}
          hint="A short notice at the top of the home page. Leave empty for no banner."
        />
        <TextInput
          {...props}
          id="bannerUrl"
          label="Banner link"
          optional
          hint="Where the banner goes: a page on this site (starting with /) or an https:// address."
        />
      </Group>
      <PlaceholderFields {...props} />
    </>
  )
}

export function AlbumFields(props: FieldsProps) {
  const { form, set } = props
  const events = useAllEvents({})
  const event = str(form, 'event')
  const known = events.data?.some((e) => e.slug === event)
  return (
    <>
      <Group title="The album">
        <TitleAndSlug {...props} pathPrefix="/gallery/" />
        <Select
          {...props}
          id="event"
          label="Event"
          hint={
            events.isError
              ? 'The events couldn’t be loaded. Reload the page to try again.'
              : 'The photos are stored under the event’s web address.'
          }
          placeholder="Choose the event"
          options={[
            ...(event && !known ? [{ value: event, label: event }] : []),
            ...(events.data ?? []).map((e) => ({ value: e.slug, label: e.title })),
          ]}
        />
        <TextInput
          {...props}
          id="series"
          label="Series"
          optional
          maxLength={120}
          hint="Groups albums from a multi-day event, e.g. “PANS Health Week 2026: Redefine+”."
        />
      </Group>
      <Group title="Photos">
        <PhotosField {...props} folder={SLUG.test(event) ? `events/${event}` : ''} />
        <Checkbox
          id="consentConfirmed"
          label="The people pictured agreed to these photos being published"
          hint="The Media Committee confirms this before an album goes on the site."
          checked={bool(form, 'consentConfirmed')}
          onChange={(consentConfirmed) => set({ consentConfirmed })}
          error={props.errors.consentConfirmed}
        />
        <TextInput
          {...props}
          id="sourceFolderUrl"
          label="Full photo folder"
          type="url"
          optional
          hint="The Drive folder with every photo, for the Media Committee. Not shown on the site."
        />
      </Group>
      <PlaceholderFields {...props} />
    </>
  )
}
