# TabTamer

An AI-powered Chrome extension that groups your tabs intelligently based on a prompt.

## How to use by adding your own API key
1. Clone the repo
2. Add your API key in `src/App.svelte` in the `apiKey` variable.
3. Run `yarn` and `yarn build` to build the extension
4. Go to `chrome://extensions` and enable developer mode
5. Click on `Load unpacked` and select the `dist` folder to load the extension
6. Click on the extension icon to start using it

## Local development
This extension uses [popups](https://developer.chrome.com/docs/extensions/mv3/user_interface/#popup) to provide a user inteface for interacting with the extension. The popup is built with [Svelte](https://svelte.dev/), and is compiled using [Rollup](https://rollupjs.org/guide/en/). To run the extension locally:

1. Clone the repo
2. Run `yarn` and `yarn dev` to start the development server
3. Go to `chrome://extensions` and enable developer mode
4. Click on `Load unpacked` and select the `dist` folder to load the extension
5. Any changes you make in the src folder will be reflected in the extension.


