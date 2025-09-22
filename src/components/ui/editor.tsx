"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { OutputData } from "@editorjs/editorjs";

interface EditorProps {
  value?: OutputData;
  onChange?: (data: OutputData) => void;
  placeholder?: string;
  className?: string;
}

const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing your article...",
  className = "",
}) => {
  const ejInstance = useRef<any>(null);
  const editorElement = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const initialData = useRef<OutputData | undefined>(value);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const initializeEditor = useCallback(async () => {
    if (!editorElement.current || isInitialized.current || !isClient) return;

    try {
      // Dynamic imports to ensure these only load on the client
      const EditorJS = (await import("@editorjs/editorjs")).default;
      const Header = (await import("@editorjs/header")).default;
      const List = (await import("@editorjs/list")).default;
      const Paragraph = (await import("@editorjs/paragraph")).default;
      const Quote = (await import("@editorjs/quote")).default;
      const Code = (await import("@editorjs/code")).default;
      const InlineCode = (await import("@editorjs/inline-code")).default;
      const Delimiter = (await import("@editorjs/delimiter")).default;
      const Table = (await import("@editorjs/table")).default;
      const Image = (await import("@editorjs/image")).default;

      const editor = new EditorJS({
        holder: editorElement.current,
        placeholder,
        tools: {
          header: {
            class: Header as any,
            config: {
              placeholder: "Enter a header",
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 2,
            },
          },
          paragraph: {
            class: Paragraph as any,
            inlineToolbar: true,
            config: {
              placeholder: "Tell your story...",
            },
          },
          list: {
            class: List as any,
            inlineToolbar: true,
            config: {
              defaultStyle: "unordered",
            },
          },
          quote: {
            class: Quote as any,
            inlineToolbar: true,
            config: {
              quotePlaceholder: "Enter a quote",
              captionPlaceholder: "Quote's author",
            },
          },
          code: {
            class: Code as any,
            config: {
              placeholder: "Enter code here...",
            },
          },
          inlineCode: {
            class: InlineCode as any,
            shortcut: "CMD+SHIFT+M",
          },
          delimiter: Delimiter as any,
          table: {
            class: Table as any,
            inlineToolbar: true,
            config: {
              rows: 2,
              cols: 3,
            },
          },
          image: {
            class: Image as any,
            config: {
              endpoints: {
                byFile: "/api/upload", // Cloudinary upload endpoint
              },
              field: "image", // Field name for the file
              types: "image/*", // Accept only images
              captionPlaceholder: "Enter image caption...",
              additionalRequestData: {
                // You can add additional data if needed
              },
              additionalRequestHeaders: {
                // Add any custom headers if needed
              },
              buttonContent: "Select an Image",
              uploader: {
                uploadByFile: async (file: File) => {
                  const formData = new FormData();
                  formData.append("image", file);

                  try {
                    const response = await fetch("/api/upload", {
                      method: "POST",
                      body: formData,
                    });

                    const result = await response.json();

                    if (result.success) {
                      return {
                        success: 1,
                        file: {
                          url: result.file.url,
                          size: result.file.size,
                          name: result.file.name,
                          title: result.file.title,
                          extension: result.file.extension,
                          width: result.file.width,
                          height: result.file.height,
                        },
                      };
                    } else {
                      throw new Error(result.message || "Upload failed");
                    }
                  } catch (error) {
                    console.error("Image upload error:", error);
                    return {
                      success: 0,
                      error: "Image upload failed",
                    };
                  }
                },
              },
            },
          },
        },
        data: initialData.current || undefined,
        onChange: async () => {
          if (onChange && ejInstance.current) {
            try {
              const outputData = await ejInstance.current.save();
              onChange(outputData);
            } catch (error) {
              console.error("Error saving editor data:", error);
            }
          }
        },
        minHeight: 200,
      });

      ejInstance.current = editor;
      isInitialized.current = true;
    } catch (error) {
      console.error("Error initializing editor:", error);
    }
  }, [placeholder, isClient]);

  // Initialize editor only once when client-side
  useEffect(() => {
    if (isClient) {
      // Update initial data if value is provided
      if (value && value.blocks && value.blocks.length > 0) {
        initialData.current = value;
      }
      initializeEditor();
    }

    return () => {
      if (ejInstance.current) {
        ejInstance.current.destroy();
        ejInstance.current = null;
        isInitialized.current = false;
      }
    };
  }, [initializeEditor, isClient]);

  // Only update editor data if it's significantly different (for loading existing content)
  useEffect(() => {
    if (
      value &&
      value.blocks &&
      value.blocks.length > 0 &&
      ejInstance.current &&
      !isInitialized.current
    ) {
      // Only render new data during initialization, not during active editing
      ejInstance.current.render(value).catch((error: any) => {
        console.error("Error rendering editor data:", error);
      });
    }
  }, [value]);

  // Show loading state while on server or before client initialization
  if (!isClient) {
    return (
      <div className={`border rounded-md ${className}`}>
        <div className="min-h-[300px] p-4 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto mb-2"></div>
            <p>Loading editor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-md ${className}`}>
      <div
        ref={editorElement}
        className="min-h-[300px] p-4 prose prose-sm max-w-none focus-within:ring-2 focus-within:ring-ring focus-within:border-ring"
      />
    </div>
  );
};

export default Editor;
