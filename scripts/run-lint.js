import { ESLint } from 'eslint';

export const runLint = async () => {
  const eslint = new ESLint({
    overrideConfigFile: '.eslintrc.cjs'
  });

  const results = await eslint.lintFiles(['**/*.js']);
  const formatter = await eslint.loadFormatter('stylish');
  const filtered = results.filter((result) => !result.filePath.includes('node_modules'));

  process.stdout.write(formatter.format(filtered));

  const errorCount = filtered.reduce((sum, result) => sum + result.errorCount, 0);
  if (errorCount) {
    throw new Error(Lint failed with  error(s));
  }
};

if (import.meta.url === process.argv[1] || import.meta.url === ile://) {
  runLint().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

