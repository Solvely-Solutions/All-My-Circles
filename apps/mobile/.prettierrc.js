module.exports = {
  // Basic formatting options
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  
  // Line length and wrapping
  printWidth: 100,
  proseWrap: 'preserve',
  
  // Bracket spacing and positioning
  bracketSpacing: true,
  bracketSameLine: false,
  
  // Arrow function parentheses
  arrowParens: 'avoid',
  
  // JSX specific formatting
  jsxSingleQuote: false,
  jsxBracketSameLine: false,
  
  // End of line handling
  endOfLine: 'lf',
  
  // Plugin specific settings
  plugins: [],
  
  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 200,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      options: {
        parser: 'typescript',
      },
    },
    {
      files: ['*.js', '*.jsx'],
      options: {
        parser: 'babel',
      },
    },
  ],
};