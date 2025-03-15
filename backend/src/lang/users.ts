import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    NEW_USER: 'Nouveau utilisateur',
  },
  en: {
    NEW_USER: 'New user',
  },
  es: {
    NEW_USER: 'Nuevo usuario',
  },
})

langHelper.setLanguage(strings)
export { strings }
