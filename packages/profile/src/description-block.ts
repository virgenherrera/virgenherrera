export interface DescriptionBlock {
  type: 'paragraph' | 'bullets';
  lines: string[];
}

export function parseDescription(lines: readonly string[]): DescriptionBlock[] {
  return lines.reduce<DescriptionBlock[]>((blocks, line) => {
    if (!line.startsWith('*')) {
      blocks.push({ type: 'paragraph', lines: [line] });

      return blocks;
    }

    const text = line.slice(1).trim();
    const lastBlock = blocks.at(-1);

    if (lastBlock && lastBlock.type === 'bullets') {
      lastBlock.lines.push(text);
    } else {
      blocks.push({ type: 'bullets', lines: [text] });
    }

    return blocks;
  }, []);
}
