import LocalizedStrings from 'react-localization'
import * as LangHelper from '../common/LangHelper'

export const strings = new LocalizedStrings({
    fr: {
        TOTAL: 'Total :'
    },
    en: {
        TOTAL: 'Total:'
    }
})

LangHelper.setLanguage(strings)
