import { LocalizedStrings } from 'localized-strings'
import env from '@/config/env.config'
import * as UserService from '@/services/UserService'

/**
 * Get current language.
 *
 * @returns {string}
 */
export const getLanguage = async () => {
  let language = UserService.getQueryLanguage() ?? ''

  if (language === '' || !env.LANGUAGES.includes(language)) {
    language = await UserService.getLanguage()
  }

  return language
}

/**
 * Set LocalizedStrings language.
 *
 * @param {LocalizedStrings<any>} strings
 * @param {?string} [language]
 */
export const setLanguage = async (strings: LocalizedStrings<any>, language?: string) => {
  const lang = language || await getLanguage()
  strings.setLanguage(lang)
}
