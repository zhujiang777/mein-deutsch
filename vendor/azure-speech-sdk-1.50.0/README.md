# Azure Speech SDK browser bundle

This directory vendors the official `microsoft-cognitiveservices-speech-sdk`
browser bundle at version `1.50.0` for same-origin loading on GitHub Pages.

- Source package: https://www.npmjs.com/package/microsoft-cognitiveservices-speech-sdk/v/1.50.0
- Included files: minified browser bundle, Microsoft license, redistribution notice
- Purpose: fallback when Azure's short-audio REST response recognizes speech but
  omits the `PronunciationAssessment` result block.
