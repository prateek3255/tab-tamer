<script>
  import { onMount } from "svelte";

  // Add your Open AI API key here if you are using a local build
  // and don't want to add it every time you open the browser.
  let apiKey = null;

  let isGrouping = false;

  $: hasAddedApiKey = apiKey !== null;

  onMount(() => {
    chrome.storage.session.get("OPEN_AI_API_KEY", (result) => {
      if (typeof result.OPEN_AI_API_KEY === "string") {
        apiKey = result.OPEN_AI_API_KEY;
      }
    });
  });

  function addApiKey(event) {
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    chrome.storage.session.set({ OPEN_AI_API_KEY: data.apiKey }, () => {
      apiKey = data.apiKey;
    });
  }

  async function groupTabs(event) {
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    try {
      isGrouping = true;
      const allTabs = await chrome.tabs.query({});

      const currentTabURLWithTitles = allTabs
        .map((tab) => tab.url + " (" + tab.title + ")")
        .join("\n");

      const response = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        body: JSON.stringify({
          model: "text-davinci-003",
          prompt: `Find the tab URLs that fit the description\n\nTabs URLs with titles:\nhttps://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input#methods (<input>: The Input (Form Input) element)\nhttps://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus (HTMLElement.focus())\nhttp://localhost:5002/console/api/api-explorer (API Explorer Hasura)\nhttps://kentcdodds.com/blog/stop-mocking-fetch?s=09 (Stop mocking fetch)\n\nDescription: Group all the tabs with related to HTML elements\n\nOutput:\nhttps://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input#methods\nhttps://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus\n\nTabs URLs with titles:\n${currentTabURLWithTitles}\nDescription: ${data.description}\n\nOutput:`,
          temperature: 0,
          max_tokens: 2048,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      });

      const json = await response.json();
      console.log(json);
      const tabURLs = json.choices[0]?.text
        ?.split("\n")
        ?.filter((url) => url.startsWith("http"));
      if (Array.isArray(tabURLs) && typeof data.name === "string") {
        const tabIds = allTabs
          .filter((tab) => tabURLs.includes(tab.url))
          .map((tab) => tab.id);
        const group = await chrome.tabs.group({ tabIds });
        chrome.tabGroups.update(group, { title: data.name });
      }
    } catch (error) {
      alert(
        "Something went wrong. Please try resetting your API key if the problem persists"
      );
    } finally {
      isGrouping = false;
      event.target.reset();
    }
  }

  function resetAPIKey() {
    chrome.storage.session.remove("OPEN_AI_API_KEY", () => {
      apiKey = null;
    });
  }
</script>

<main>
  {#if hasAddedApiKey}
    <h1>Group tabs with GPT-3</h1>
    <form on:submit|preventDefault={groupTabs}>
      <label for="description">Description for tab grouping:</label>
      <textarea
        id="description"
        required
        cols="30"
        rows="5"
        name="description"
        placeholder="Eg: Group all tabs related to React hooks"
      />
      <span class="spacer" />
      <label for="name">Group name:</label>
      <input
        type="text"
        required
        id="name"
        name="name"
        placeholder="Eg: React Hooks"
      />
      <div class="button-container">
        <button
          id="group-button"
          type="submit"
          disabled={isGrouping}
          class="button button-primary"
        >
          {#if isGrouping}
            Grouping...
          {:else}
            Group tabs
          {/if}
        </button>
        <button
          on:click={resetAPIKey}
          id="reset-api-key"
          type="button"
          class="button button-secondary">Reset API Key</button
        >
      </div>
    </form>
  {:else}
    <h1>Add your Open AI API Key</h1>
    <p>
      Please add your OpenAI API key to use the extension. Your API key is
      stored safely in memory and never leaves your borwser. <a
        href="https://platform.openai.com/account/api-keys"
        >Generate your Open AI API key.</a
      >
    </p>
    <form on:submit|preventDefault={addApiKey}>
      <label for="apiKey">Your Open AI API Key:</label>
      <input
        type="password"
        required
        id="apiKey"
        name="apiKey"
        placeholder="Eg: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      />
      <span class="spacer" />
      <button id="add-api-key" type="submit" class="button button-primary"
        >Add API Key</button
      >
    </form>
  {/if}
</main>

<style>
  h1 {
    color: white;
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 16px;
  }

  p {
    color: white;
    font-size: 0.75rem;
    font-weight: 400;
    margin-bottom: 16px;
  }
  /* Normal state of anchor tag */
  a {
    color: #64b5f6; 
    text-decoration: none;
  }

  a:hover {
    color: #42a5f5;
    text-decoration: underline;
  }

  /* Visited state of anchor tag */
  a:visited {
    color: #90caf9; 
  }

  main {
    width: 100%;
    padding: 16px;
  }

  textarea {
    width: 100%;
    border-radius: 0.25rem;
    border-width: 0;
    font-size: 0.875rem;
    line-height: 1.25rem;
    padding: 0.75rem;
    font-family: "Inter", sans-serif;
  }

  input {
    width: 100%;
    margin: 0;
    border-radius: 0.25rem;
    border-width: 0;
    font-size: 0.875rem;
    line-height: 1.25rem;
    padding: 0.75rem;
    font-family: "Inter", sans-serif;
  }

  label {
    display: block;
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.25rem;
    margin-bottom: 4px;
  }

  .button-container {
    display: flex;
    gap: 8px;
    margin-top: 24px;
  }
  .spacer {
    display: block;
    height: 16px;
    min-height: 16px;
  }

  .button {
    width: 100%;
    padding: 6px 8px;
    font-size: 1rem;
    font-weight: bold;
    border-radius: 8px;
    transition: all 0.3s ease-in-out;
  }

  /* Primary button */
  .button-primary {
    background-color: #2196f3; /* Light blue primary button color */
    color: #fff; /* Text color */
    border: none;
  }

  .button-primary:hover {
    background-color: #0d8bf2; /* Slightly darker shade of primary button color */
    cursor: pointer;
  }

  /* Secondary button */
  .button-secondary {
    background-color: #fff; /* Background color */
    color: #2196f3; /* Light blue secondary button color */
    border: 2px solid #2196f3;
  }

  .button-secondary:hover {
    background-color: #2196f3; /* Light blue secondary button color */
    color: #fff;
    cursor: pointer;
  }
</style>
