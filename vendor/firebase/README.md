# Firebase JS SDK (bundled)

`firebase.js` is a single-file ES module bundle of the Firebase JS SDK **v10.14.1**
(`firebase/app`, `firebase/auth`, `firebase/firestore`), built with esbuild so the game can
load it without a build step or CDN. It is only loaded when cloud saves are configured in
`js/cloud-config.js`.

The Firebase JS SDK is licensed under the Apache License 2.0:
https://github.com/firebase/firebase-js-sdk/blob/main/LICENSE
