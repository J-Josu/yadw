module.exports = {
    "extends": "eslint:recommended",
    "env": {
        "node": true
    },

    "parserOptions": {
        "project": "./tsconfig.json",
        "sourceType": "module",
        "ecmaVersion": 2015
    },

    rules: {
        // 'no-console': 'error',
        // eslint isn't that well-versed with JSDoc to know that `foo: /** @type{..} */ (foo)` isn't a violation of this rule, so turn it off
        'object-shorthand': 'off',
        'no-var': 'error'
    }
};
