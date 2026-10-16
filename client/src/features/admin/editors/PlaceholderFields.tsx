import { Checkbox, control, Field, Group } from './fields.tsx'
import { bool, type FieldsProps, str } from './types.ts'

/**
 * "Still waiting for details?" Saving real content clears the placeholder flag (README →
 * Placeholder rules); ticking this keeps the item marked "Coming soon" with a note for admins.
 */
export function PlaceholderFields({
  form,
  set,
  errors,
  forced,
}: FieldsProps & { forced?: string }) {
  const keep = bool(form, 'isPlaceholder')
  return (
    <Group title="Status">
      {forced ? (
        <p className="text-small">{forced}</p>
      ) : (
        <Checkbox
          id="isPlaceholder"
          label="Still waiting for some details"
          hint="Ticked: the site shows the missing parts as “Coming soon” and the item stays on the Placeholders list. Unticked: it’s published as finished."
          checked={keep}
          onChange={(checked) => set({ isPlaceholder: checked })}
        />
      )}
      {keep && (
        <Field
          id="placeholderNote"
          label="What’s missing?"
          hint="Only admins see this, on the Placeholders list."
          error={errors.placeholderNote}
        >
          {(props) => (
            <input
              {...props}
              className={control}
              maxLength={300}
              value={str(form, 'placeholderNote')}
              onChange={(e) => set({ placeholderNote: e.target.value })}
            />
          )}
        </Field>
      )}
    </Group>
  )
}
