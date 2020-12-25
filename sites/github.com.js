var copyMarkdownSnippetFromGithub = (function(){ // ES6 modules are not supported by Chrome extensions, so closure used instead

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function highlightGitHubSeletedLines(){
    let lines = document.querySelectorAll('.js-file-line.highlighted');
    for (let line of lines){
      highlightElement(line);  // launch multiple coroutines in parallel
    }
  }

  function readHighlightedLines(){
    // Read code lines highlighted on GitHub page, return multiline string
    const lines = document.querySelectorAll('.js-file-line-container .js-file-line.highlighted');
    const map = Array.prototype.map;
    const codeLines = map.call(lines, line => line.innerText);
    return codeLines.join('\n');
  }

  async function copyMarkdownSnippet(quitMode=false){
    // trigger GitHub switch to canonical url with commit hash
    document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'y'}));
    let link = window.location.href;
    let [fileURL, linesCode] = link.split('#');

    let filePath = fileURL.split(/\/[a-z0-9]{40,}\//)[1] || 'README';

    if (filePath.length > 40){
      let startIndex = filePath.length - 41;
      filePath = `…${filePath.substring(startIndex)}`;
    }

    let selection = window.getSelection();
    let selectionText = selection.toString();
    let codeLinesAreSelected = Boolean(linesCode) && !selectionText; // selection has priority
    let reviewLink = selectionText && fileURL || link;
    let positionSuffix = '';
    if (codeLinesAreSelected){
      let match = linesCode.match(/\d+/);
      if (match){
        let firstLineNumber = match[0];
        positionSuffix = `:${firstLineNumber}`
      }
    }

    let markdownSnippet = '';
    if (quitMode){
      markdownSnippet = (
          `---\n` +
          `Файл [${filePath}${positionSuffix}](${reviewLink}).\n`
      );
    } else {
      let codeSnippet = '';

      // copy code
      if (selectionText) {
        codeSnippet = selectionText;
      } else if (codeLinesAreSelected){
        codeSnippet = readHighlightedLines();
      } else {
        alert('Выделите фрагмент текста');
      }

      let preparedCodeSnippet = prepareCodeSnippet(codeSnippet);
      let syntax = '';

      // disabled if .md file because it is rendered on GitHub as HTML, not markdown.
      if (!filePath.endsWith('.md')){
        syntax = detectSyntaxByFilename(filePath);
      }

      markdownSnippet = (
        `---\n`+
        `[_${filePath}${positionSuffix}_](${reviewLink})\n` +
        `\`\`\`${syntax}\n${preparedCodeSnippet}\n` +
        `\`\`\`\n`
      )
    }
    await navigator.clipboard.writeText(markdownSnippet);

    // Show which snippet was copied
    if (selectionText){
      await highlightSelection();
    } else if (codeLinesAreSelected){
      await highlightGitHubSeletedLines();
    }

  }

  return copyMarkdownSnippet;
})();
