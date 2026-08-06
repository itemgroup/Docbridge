const DEEPSEEK_API_CONFIG = {
  baseURL: "https://api.deepseek.com/v1",
  model: "deepseek-chat",
  temperature: 0.3,
  max_tokens: 4096,
  timeout: 1e4
};
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1e3;
const DT_BRIDGE_CLASS = "dt-bridge";
const DT_LABEL_CLASS = "dt-label";
const DT_TEXT_CLASS = "dt-text";
const DT_ID_ATTR = "data-dt-id";
export {
  DEEPSEEK_API_CONFIG as D,
  MAX_RETRIES as M,
  RETRY_BASE_DELAY_MS as R,
  DT_BRIDGE_CLASS as a,
  DT_ID_ATTR as b,
  DT_LABEL_CLASS as c,
  DT_TEXT_CLASS as d
};
//# sourceMappingURL=constants-CoCYY9Y6.js.map
