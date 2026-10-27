// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    settings: {
      "import/ignore": ["@env", "react-native"],
    },
    rules: {
      // @env is resolved by babel (react-native-dotenv) at build time
      "import/no-unresolved": ["error", { ignore: ["@env"] }],
      "import/no-named-as-default-member": "off",
      // False positive: ESLint can't parse RN's Flow type annotations
      "import/namespace": "off",
    },
  },
]);
