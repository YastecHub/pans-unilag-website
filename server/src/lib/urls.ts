/** An https link, or empty. Use for optional links on content models. */
export const optionalHttpsUrl = {
  type: String,
  default: '',
  trim: true,
  match: [/^$|^https:\/\/\S+$/, 'must be an https:// link'] as [RegExp, string],
}

/** An https link that may only be empty while the item is a placeholder. */
export function httpsUrlUnlessPlaceholder(field: string) {
  return {
    type: String,
    default: '',
    trim: true,
    validate: {
      validator(this: { isPlaceholder?: boolean }, url: string) {
        return url === '' ? this.isPlaceholder === true : /^https:\/\/\S+$/.test(url)
      },
      message: `${field} must be an https:// link (required unless the item is a placeholder)`,
    },
  }
}
