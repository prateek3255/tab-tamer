<script>
  import { onMount } from "svelte";

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
      <br />
      <br />
      <label for="name">Group name:</label>
      <br />
      <input
        type="text"
        required
        id="name"
        name="name"
        placeholder="Eg: React Hooks"
      />
      <br />
      <br />
      <button id="group-button" type="submit" disabled={isGrouping}>
        {#if isGrouping}
          Grouping...
        {:else}
          Group tabs
        {/if}
      </button>
    </form>
  {:else}
    <h1>Add your Open AI API Key</h1>
    <p>
      Please add your OpenAI API key to use the extension. Your API key is
      stored safely in memory and never leaves your borwser. <a
        href="https://platform.openai.com/account/api-keys"
        >Generate your Open AI API key from.</a
      >
    </p>
    <br />
    <br />
    <form on:submit|preventDefault={addApiKey}>
      <label for="apiKey">Your Open AI API Key:</label>
      <br />
      <input type="password" required id="apiKey" name="apiKey" />
      <br />
      <br />
      <button id="add-api-key" type="submit">Add API Key</button>
    </form>
  {/if}
</main>

<style>
</style>
