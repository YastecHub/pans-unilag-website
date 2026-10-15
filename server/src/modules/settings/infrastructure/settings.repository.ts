import type { SettingsReader, StoredSettings } from '../application/settingsView.js'
import { SettingsModel } from './settings.model.js'

export const mongoSettingsReader: SettingsReader = {
  find: () => SettingsModel.findOne({ key: 'site' }).lean<StoredSettings>(),
}
