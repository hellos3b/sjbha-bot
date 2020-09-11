import wretch from "wretch";

wretch().polyfills({
  fetch: require("node-fetch"),
  FormData: require("form-data"),
  URLSearchParams: require("url").URLSearchParams
})

export default wretch;