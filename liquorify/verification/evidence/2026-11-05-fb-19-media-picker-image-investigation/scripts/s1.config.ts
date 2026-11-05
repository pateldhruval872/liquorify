// Captures from the Storybook built with the trial story (photos decoded before the clicks).
import base from './capture.config'

export default { ...base, webServer: { ...base.webServer, command: 'node visual/serve.mjs storybook-static-s1 6007' } }
