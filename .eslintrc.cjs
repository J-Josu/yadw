/** @type {import("eslint").Linter.Config} */
const config = {
    extends: [
        'eslint:recommended',
        'plugin:import/errors',
        'plugin:import/warnings'
    ],

    env: {
        'node': true,
        'es2022': true,
    },

    parserOptions: {
        "project": "./tsconfig.json",
        'sourceType': 'module'
    },

    plugins: ['lube'],

    rules: {
        // 'no-console': 'error',
        // eslint isn't that well-versed with JSDoc to know that `foo: /** @type{..} */ (foo)` isn't a violation of this rule, so turn it off
        'object-shorthand': 'off',
        'no-var': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
        "import/extensions": ["error", "ignorePackages"],
        'import/no-unresolved': 'error',
		'lube/svelte-naming-convention': ['off', { fixSameNames: true }],
    },

    settings: {}
};

module.exports = config;
