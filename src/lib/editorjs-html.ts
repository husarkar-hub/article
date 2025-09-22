import { OutputData } from "@editorjs/editorjs";

interface EditorJSBlock {
  id?: string;
  type: string;
  data: any;
}

export const convertEditorJSToHTML = (editorData: OutputData): string => {
  if (!editorData || !editorData.blocks) {
    return "";
  }

  return editorData.blocks
    .map((block: EditorJSBlock) => {
      switch (block.type) {
        case "header":
          const level = block.data.level || 2;
          return `<h${level}>${block.data.text}</h${level}>`;

        case "paragraph":
          return `<p>${block.data.text}</p>`;

        case "list":
          const listType = block.data.style === "ordered" ? "ol" : "ul";
          const listItems = block.data.items
            .map((item: string) => `<li>${item}</li>`)
            .join("");
          return `<${listType}>${listItems}</${listType}>`;

        case "quote":
          return `<blockquote>
            <p>${block.data.text}</p>
            ${block.data.caption ? `<cite>${block.data.caption}</cite>` : ""}
          </blockquote>`;

        case "code":
          return `<pre><code>${block.data.code}</code></pre>`;

        case "delimiter":
          return `<hr>`;

        case "table":
          if (!block.data.content || !Array.isArray(block.data.content)) {
            return "";
          }
          const tableRows = block.data.content
            .map((row: string[], index: number) => {
              const cellType = index === 0 && block.data.withHeadings ? "th" : "td";
              const cells = row
                .map((cell: string) => `<${cellType}>${cell}</${cellType}>`)
                .join("");
              return `<tr>${cells}</tr>`;
            })
            .join("");
          return `<table class="border-collapse border border-gray-300 w-full">
            ${block.data.withHeadings ? "<thead>" : ""}
            ${tableRows}
            ${block.data.withHeadings ? "</thead>" : ""}
          </table>`;

        case "image":
          return `<img src="${block.data.file?.url || block.data.url || ""}" 
                      alt="${block.data.caption || ""}" 
                      class="max-w-full h-auto rounded-lg" />
                  ${block.data.caption ? `<p class="text-sm text-gray-500 mt-2">${block.data.caption}</p>` : ""}`;

        default:
          // Handle any unknown block types by trying to extract text
          if (block.data && block.data.text) {
            return `<p>${block.data.text}</p>`;
          }
          return "";
      }
    })
    .join("");
};

export const convertHTMLToEditorJS = (html: string): OutputData => {
  // This is a basic implementation for converting HTML back to Editor.js format
  // For a more robust solution, you might want to use a proper HTML parser
  if (!html) {
    return { blocks: [] };
  }

  // Split by common HTML tags and create basic blocks
  const paragraphs = html.split(/<\/p>|<\/h[1-6]>|<\/li>|<\/blockquote>/).filter(p => p.trim());
  
  const blocks = paragraphs.map((paragraph, index) => {
    const cleanText = paragraph.replace(/<[^>]*>/g, '').trim();
    
    if (!cleanText) return null;

    // Detect headers
    const headerMatch = paragraph.match(/<h([1-6])[^>]*>/);
    if (headerMatch) {
      return {
        id: `block_${index}`,
        type: "header",
        data: {
          text: cleanText,
          level: parseInt(headerMatch[1])
        }
      };
    }

    // Default to paragraph
    return {
      id: `block_${index}`,
      type: "paragraph",
      data: {
        text: cleanText
      }
    };
  }).filter((block): block is NonNullable<typeof block> => block !== null);

  return { blocks };
};

export const getPlainTextFromEditorJS = (editorData: OutputData): string => {
  if (!editorData || !editorData.blocks || !Array.isArray(editorData.blocks)) {
    console.warn("Invalid editor data structure:", editorData);
    return "";
  }

  return editorData.blocks
    .map((block: EditorJSBlock) => {
      if (!block || !block.type || !block.data) {
        console.warn("Invalid block structure:", block);
        return "";
      }

      switch (block.type) {
        case "header":
        case "paragraph":
          return block.data.text || "";
        case "list":
          if (Array.isArray(block.data.items)) {
            return block.data.items.join(" ");
          }
          return "";
        case "quote":
          const quoteText = block.data.text || "";
          const quoteCaption = block.data.caption || "";
          return `${quoteText} ${quoteCaption}`.trim();
        case "code":
          return block.data.code || "";
        case "table":
          if (Array.isArray(block.data.content)) {
            return block.data.content
              .flat()
              .filter(Boolean)
              .join(" ");
          }
          return "";
        default:
          // Try to extract any text property
          if (typeof block.data.text === "string") {
            return block.data.text;
          }
          return "";
      }
    })
    .filter(Boolean) // Remove empty strings
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
};