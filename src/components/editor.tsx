'use client';

import React, { useState, useEffect, useMemo, useRef, forwardRef } from 'react';
import {
  // Core system
  createEditorSystem,

  // Extensions
  boldExtension,
  italicExtension,
  underlineExtension,
  strikethroughExtension,
  linkExtension,
  horizontalRuleExtension,
  TableExtension,
  listExtension,
  historyExtension,
  imageExtension,
  blockFormatExtension,
  htmlExtension,
  MarkdownExtension,
  codeExtension,
  codeFormatExtension,
  HTMLEmbedExtension,
  floatingToolbarExtension,
  contextMenuExtension,
  commandPaletteExtension,
  DraggableBlockExtension,

  // Utilities
  ALL_MARKDOWN_TRANSFORMERS,

  // Types
  type ExtractCommands,
  type ExtractStateQueries,
  type BaseCommands,
} from '@lexkit/editor';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalEditor } from 'lexical';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Undo,
  Redo,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  Link,
  Unlink,
  Minus,
  Code,
  Terminal,
  Table as TableIcon,
  FileCode,
  Eye,
  Pencil,
  Type,
  Quote,
  Indent,
  Outdent,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { commandsToCommandPaletteItems, registerKeyboardShortcuts } from './ui/commands';
import { Select, Dropdown, Dialog } from './ui/components';
import { defaultTheme } from './ui/theme';

type TableConfig = {
  rows?: number;
  columns?: number;
  includeHeaders?: boolean;
};

// Create markdown extension instance
const markdownExt = new MarkdownExtension().configure({
  customTransformers: ALL_MARKDOWN_TRANSFORMERS,
});

// Define extensions array
export const extensions = [
  boldExtension,
  italicExtension,
  underlineExtension,
  strikethroughExtension,
  linkExtension.configure({
    linkSelectedTextOnPaste: true,
    autoLinkText: true,
    autoLinkUrls: true,
  }),
  horizontalRuleExtension,
  new TableExtension().configure({
    enableContextMenu: true,
    markdownExtension: markdownExt,
  }),
  listExtension,
  historyExtension,
  imageExtension,
  blockFormatExtension,
  htmlExtension,
  markdownExt,
  codeExtension,
  codeFormatExtension,
  new HTMLEmbedExtension().configure({
    markdownExtension: markdownExt,
  }),
  floatingToolbarExtension,
  contextMenuExtension,
  commandPaletteExtension,
  new DraggableBlockExtension().configure({}),
] as const;

// Create typed editor system
const { Provider, useEditor } = createEditorSystem<typeof extensions>();

// Extract types
type EditorCommands = BaseCommands & ExtractCommands<typeof extensions>;
type EditorStateQueries = ExtractStateQueries<typeof extensions>;
type ExtensionNames = (typeof extensions)[number]['name'];

// Ref interface for external control
export interface DefaultTemplateRef {
  injectMarkdown: (content: string) => void;
  injectHTML: (content: string) => void;
  getMarkdown: () => string;
  getHTML: () => string;
}

// Hook for image handling logic
function useImageHandlers(commands: EditorCommands, editor: LexicalEditor | null) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlers = useMemo(
    () => ({
      insertFromUrl: () => {
        const src = prompt('Enter image URL:');
        if (!src) return;
        const alt = prompt('Enter alt text:') || '';
        const caption = prompt('Enter caption (optional):') || undefined;
        commands.insertImage({ src, alt, caption });
      },
      insertFromFile: () => fileInputRef.current?.click(),
      handleUpload: async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        let src: string;
        if (imageExtension.config.uploadHandler) {
          try {
            src = await imageExtension.config.uploadHandler(file);
          } catch (error) {
            alert('Failed to upload image');
            return;
          }
        } else {
          src = URL.createObjectURL(file);
        }
        commands.insertImage({ src, alt: file.name, file });
        e.target.value = '';
      },
      setAlignment: (alignment: 'left' | 'center' | 'right' | 'none') => {
        commands.setImageAlignment(alignment);
      },
      setCaption: () => {
        const newCaption = prompt('Enter caption:') || '';
        commands.setImageCaption(newCaption);
      },
    }),
    [commands],
  );

  return { handlers, fileInputRef };
}

// Floating Toolbar Component
function FloatingToolbarRenderer() {
  const { commands, activeStates, extensions, hasExtension } = useEditor();

  const [isVisible, setIsVisible] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    positionFromRight?: boolean;
  } | null>(null);

  const floatingExtension = extensions.find((ext) => ext.name === 'floatingToolbar') as any;

  useEffect(() => {
    if (!floatingExtension) return;

    const checkState = () => {
      const visible = floatingExtension.getIsVisible();
      const rect = floatingExtension.getSelectionRect();
      setIsVisible(visible);
      setSelectionRect(rect);
    };

    const interval = setInterval(checkState, 200);
    return () => clearInterval(interval);
  }, [floatingExtension]);

  if (!isVisible || !selectionRect) return null;

  const isImageSelected = activeStates.imageSelected;

  return createPortal(
    <div
      className="lexkit-floating-toolbar"
      style={{
        position: 'absolute',
        top: selectionRect.y,
        ...(selectionRect.positionFromRight
          ? { right: 10, left: 'auto' }
          : { left: selectionRect.x, right: 'auto' }),
        zIndex: 50,
        maxWidth: 400,
        flexWrap: 'wrap',
        pointerEvents: 'auto',
      }}
    >
      {isImageSelected ? (
        <>
          <button
            type="button"
            onClick={() => commands.setImageAlignment('left')}
            className={`lexkit-toolbar-button ${activeStates.isImageAlignedLeft ? 'active' : ''}`}
            title="Align Left"
          >
            <AlignLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => commands.setImageAlignment('center')}
            className={`lexkit-toolbar-button ${activeStates.isImageAlignedCenter ? 'active' : ''}`}
            title="Align Center"
          >
            <AlignCenter size={14} />
          </button>
          <button
            type="button"
            onClick={() => commands.setImageAlignment('right')}
            className={`lexkit-toolbar-button ${activeStates.isImageAlignedRight ? 'active' : ''}`}
            title="Align Right"
          >
            <AlignRight size={14} />
          </button>
          <div className="bg-border mx-1 h-6 w-px" />
          <button
            type="button"
            onClick={() => commands.setImageCaption(prompt('Enter caption:') || '')}
            className="lexkit-toolbar-button"
            title="Edit Caption"
          >
            <Type size={14} />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => commands.toggleBold()}
            className={`lexkit-toolbar-button ${activeStates.bold ? 'active' : ''}`}
            title="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => commands.toggleItalic()}
            className={`lexkit-toolbar-button ${activeStates.italic ? 'active' : ''}`}
            title="Italic"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => commands.toggleUnderline()}
            className={`lexkit-toolbar-button ${activeStates.underline ? 'active' : ''}`}
            title="Underline"
          >
            <Underline size={14} />
          </button>
          <button
            type="button"
            onClick={() => commands.toggleStrikethrough()}
            className={`lexkit-toolbar-button ${activeStates.strikethrough ? 'active' : ''}`}
            title="Strikethrough"
          >
            <Strikethrough size={14} />
          </button>
          <div className="bg-border mx-1 h-6 w-px" />
          <button
            type="button"
            onClick={() => commands.formatText('code')}
            className={`lexkit-toolbar-button ${activeStates.code ? 'active' : ''}`}
            title="Inline Code"
          >
            <Code size={14} />
          </button>
          <button
            type="button"
            onClick={() => (activeStates.isLink ? commands.removeLink() : commands.insertLink())}
            className={`lexkit-toolbar-button ${activeStates.isLink ? 'active' : ''}`}
            title={activeStates.isLink ? 'Remove Link' : 'Insert Link'}
          >
            {activeStates.isLink ? <Unlink size={14} /> : <Link size={14} />}
          </button>
          <div className="bg-border mx-1 h-6 w-px" />
          {hasExtension('blockFormat') && (
            <>
              <button
                type="button"
                onClick={() => commands.toggleParagraph()}
                className={`lexkit-toolbar-button ${!activeStates.isH1 && !activeStates.isH2 && !activeStates.isH3 && !activeStates.isH4 && !activeStates.isH5 && !activeStates.isH6 && !activeStates.isQuote ? 'active' : ''}`}
                title="Paragraph"
              >
                P
              </button>
              <button
                type="button"
                onClick={() => commands.toggleHeading('h1')}
                className={`lexkit-toolbar-button ${activeStates.isH1 ? 'active' : ''}`}
                title="Heading 1"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => commands.toggleHeading('h2')}
                className={`lexkit-toolbar-button ${activeStates.isH2 ? 'active' : ''}`}
                title="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => commands.toggleHeading('h3')}
                className={`lexkit-toolbar-button ${activeStates.isH3 ? 'active' : ''}`}
                title="Heading 3"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => commands.toggleQuote()}
                className={`lexkit-toolbar-button ${activeStates.isQuote ? 'active' : ''}`}
                title="Quote"
              >
                <Quote size={14} />
              </button>
              {hasExtension('code') && (
                <button
                  type="button"
                  onClick={() => commands.toggleCodeBlock()}
                  className={`lexkit-toolbar-button ${activeStates.isInCodeBlock ? 'active' : ''}`}
                  title="Code Block"
                >
                  <Terminal size={14} />
                </button>
              )}
              <div className="bg-border mx-1 h-6 w-px" />
            </>
          )}
          {hasExtension('list') && (
            <>
              <button
                onClick={() => commands.toggleUnorderedList()}
                className={`lexkit-toolbar-button ${activeStates.unorderedList ? 'active' : ''}`}
                title="Bullet List"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => commands.toggleOrderedList()}
                className={`lexkit-toolbar-button ${activeStates.orderedList ? 'active' : ''}`}
                title="Numbered List"
              >
                <ListOrdered size={14} />
              </button>
            </>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}

// Toolbar Component
function Toolbar({
  commands,
  hasExtension,
  activeStates,
}: {
  commands: EditorCommands;
  hasExtension: (name: ExtensionNames) => boolean;
  activeStates: EditorStateQueries;
}) {
  const { lexical: editor } = useEditor();
  const { handlers, fileInputRef } = useImageHandlers(commands, editor);
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [showAlignDropdown, setShowAlignDropdown] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableConfig, setTableConfig] = useState<TableConfig>({
    rows: 3,
    columns: 3,
    includeHeaders: false,
  });

  const blockFormatOptions = [
    { value: 'p', label: 'Paragraph' },
    { value: 'h1', label: 'Heading 1' },
    { value: 'h2', label: 'Heading 2' },
    { value: 'h3', label: 'Heading 3' },
    { value: 'h4', label: 'Heading 4' },
    { value: 'h5', label: 'Heading 5' },
    { value: 'h6', label: 'Heading 6' },
    { value: 'quote', label: 'Quote' },
  ];

  const currentBlockFormat = activeStates.isH1
    ? 'h1'
    : activeStates.isH2
      ? 'h2'
      : activeStates.isH3
        ? 'h3'
        : activeStates.isH4
          ? 'h4'
          : activeStates.isH5
            ? 'h5'
            : activeStates.isH6
              ? 'h6'
              : activeStates.isQuote
                ? 'quote'
                : 'p';

  const handleBlockFormatChange = (value: string) => {
    if (value === 'p') commands.toggleParagraph();
    else if (value.startsWith('h'))
      commands.toggleHeading(value as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6');
    else if (value === 'quote') commands.toggleQuote();
  };

  return (
    <>
      <div className="lexkit-toolbar">
        {/* Text Formatting */}
        <div className="lexkit-toolbar-section">
          <button
            type="button"
            onClick={() => commands.toggleBold()}
            className={`lexkit-toolbar-button ${activeStates.bold ? 'active' : ''}`}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => commands.toggleItalic()}
            className={`lexkit-toolbar-button ${activeStates.italic ? 'active' : ''}`}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={() => commands.toggleUnderline()}
            className={`lexkit-toolbar-button ${activeStates.underline ? 'active' : ''}`}
            title="Underline (Ctrl+U)"
          >
            <Underline size={16} />
          </button>
          <button
            type="button"
            onClick={() => commands.toggleStrikethrough()}
            className={`lexkit-toolbar-button ${activeStates.strikethrough ? 'active' : ''}`}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </button>
          <button
            type="button"
            onClick={() => commands.formatText('code')}
            className={`lexkit-toolbar-button ${activeStates.code ? 'active' : ''}`}
            title="Inline Code"
          >
            <Code size={16} />
          </button>
          <button
            type="button"
            onClick={() => (activeStates.isLink ? commands.removeLink() : commands.insertLink())}
            className={`lexkit-toolbar-button ${activeStates.isLink ? 'active' : ''}`}
            title={activeStates.isLink ? 'Remove Link' : 'Insert Link'}
          >
            {activeStates.isLink ? <Unlink size={16} /> : <Link size={16} />}
          </button>
        </div>

        {/* Block Format */}
        {hasExtension('blockFormat') && (
          <div className="lexkit-toolbar-section">
            <Select
              value={currentBlockFormat}
              onValueChange={handleBlockFormatChange}
              options={blockFormatOptions}
              placeholder="Format"
            />
            {hasExtension('code') && (
              <button
                type="button"
                onClick={() => commands.toggleCodeBlock()}
                className={`lexkit-toolbar-button ${activeStates.isInCodeBlock ? 'active' : ''}`}
                title="Code Block"
              >
                <Terminal size={16} />
              </button>
            )}
          </div>
        )}

        {/* Lists */}
        {hasExtension('list') && (
          <div className="lexkit-toolbar-section">
            <button
              type="button"
              onClick={() => commands.toggleUnorderedList()}
              className={`lexkit-toolbar-button ${activeStates.unorderedList ? 'active' : ''}`}
              title="Bullet List"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => commands.toggleOrderedList()}
              className={`lexkit-toolbar-button ${activeStates.orderedList ? 'active' : ''}`}
              title="Numbered List"
            >
              <ListOrdered size={16} />
            </button>
            {(activeStates.unorderedList || activeStates.orderedList) && (
              <>
                <button
                  type="button"
                  onClick={() => commands.indentList()}
                  className="lexkit-toolbar-button"
                  title="Indent List"
                >
                  <Indent size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => commands.outdentList()}
                  className="lexkit-toolbar-button"
                  title="Outdent List"
                >
                  <Outdent size={14} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Horizontal Rule */}
        {hasExtension('horizontalRule') && (
          <div className="lexkit-toolbar-section">
            <button
              type="button"
              onClick={() => commands.insertHorizontalRule()}
              className="lexkit-toolbar-button"
              title="Insert Horizontal Rule"
            >
              <Minus size={16} />
            </button>
          </div>
        )}

        {/* Table */}
        {hasExtension('table') && (
          <div className="lexkit-toolbar-section">
            <button
              type="button"
              onClick={() => setShowTableDialog(true)}
              className="lexkit-toolbar-button"
              title="Insert Table (Ctrl+Shift+T)"
            >
              <TableIcon size={16} />
            </button>
          </div>
        )}

        {/* Image */}
        {hasExtension('image') && (
          <div className="lexkit-toolbar-section">
            <Dropdown
              trigger={
                <button
                  type="button"
                  className={`lexkit-toolbar-button ${activeStates.imageSelected ? 'active' : ''}`}
                  title="Insert Image"
                >
                  <ImageIcon size={16} />
                </button>
              }
              isOpen={showImageDropdown}
              onOpenChange={setShowImageDropdown}
            >
              <button
                type="button"
                className="lexkit-dropdown-item"
                onClick={() => {
                  handlers.insertFromUrl();
                  setShowImageDropdown(false);
                }}
              >
                <Link size={16} /> From URL
              </button>
              <button
                type="button"
                className="lexkit-dropdown-item"
                onClick={() => {
                  handlers.insertFromFile();
                  setShowImageDropdown(false);
                }}
              >
                <Upload size={16} /> Upload File
              </button>
            </Dropdown>
            {activeStates.imageSelected && (
              <Dropdown
                trigger={
                  <button type="button" className="lexkit-toolbar-button" title="Align Image">
                    <AlignCenter size={16} />
                  </button>
                }
                isOpen={showAlignDropdown}
                onOpenChange={setShowAlignDropdown}
              >
                <button
                  type="button"
                  className="lexkit-dropdown-item"
                  onClick={() => {
                    handlers.setAlignment('left');
                    setShowAlignDropdown(false);
                  }}
                >
                  <AlignLeft size={16} /> Align Left
                </button>
                <button
                  type="button"
                  className="lexkit-dropdown-item"
                  onClick={() => {
                    handlers.setAlignment('center');
                    setShowAlignDropdown(false);
                  }}
                >
                  <AlignCenter size={16} /> Align Center
                </button>
                <button
                  type="button"
                  className="lexkit-dropdown-item"
                  onClick={() => {
                    handlers.setAlignment('right');
                    setShowAlignDropdown(false);
                  }}
                >
                  <AlignRight size={16} /> Align Right
                </button>
                <button
                  type="button"
                  className="lexkit-dropdown-item"
                  onClick={() => {
                    handlers.setCaption();
                    setShowAlignDropdown(false);
                  }}
                >
                  <Type size={16} /> Set Caption
                </button>
              </Dropdown>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlers.handleUpload}
              className="lexkit-file-input"
            />
          </div>
        )}

        {/* HTML Embed */}
        {hasExtension('htmlEmbed') && (
          <div className="lexkit-toolbar-section">
            <button
              type="button"
              onClick={() => commands.insertHTMLEmbed()}
              className={`lexkit-toolbar-button ${activeStates.isHTMLEmbedSelected ? 'active' : ''}`}
              title="Insert HTML Embed"
            >
              <FileCode size={16} />
            </button>
            {activeStates.isHTMLEmbedSelected && (
              <button
                type="button"
                onClick={() => commands.toggleHTMLPreview()}
                className="lexkit-toolbar-button"
                title="Toggle Preview/Edit"
              >
                {activeStates.isHTMLPreviewMode ? <Eye size={16} /> : <Pencil size={16} />}
              </button>
            )}
          </div>
        )}

        {/* History */}
        {hasExtension('history') && (
          <div className="lexkit-toolbar-section">
            <button
              type="button"
              onClick={() => commands.undo()}
              disabled={!activeStates.canUndo}
              className="lexkit-toolbar-button"
              title="Undo (Ctrl+Z)"
            >
              <Undo size={16} />
            </button>
            <button
              type="button"
              onClick={() => commands.redo()}
              disabled={!activeStates.canRedo}
              className="lexkit-toolbar-button"
              title="Redo (Ctrl+Y)"
            >
              <Redo size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Table Dialog */}
      <Dialog
        isOpen={showTableDialog}
        onClose={() => setShowTableDialog(false)}
        title="Insert Table"
      >
        <div className="lexkit-table-dialog">
          <div className="lexkit-form-group">
            <label htmlFor="table-rows">Rows:</label>
            <input
              id="table-rows"
              type="number"
              min="1"
              max="20"
              value={tableConfig.rows}
              onChange={(e) =>
                setTableConfig((prev) => ({ ...prev, rows: parseInt(e.target.value) || 1 }))
              }
              className="lexkit-input"
            />
          </div>
          <div className="lexkit-form-group">
            <label htmlFor="table-columns">Columns:</label>
            <input
              id="table-columns"
              type="number"
              min="1"
              max="20"
              value={tableConfig.columns}
              onChange={(e) =>
                setTableConfig((prev) => ({ ...prev, columns: parseInt(e.target.value) || 1 }))
              }
              className="lexkit-input"
            />
          </div>
          <div className="lexkit-form-group">
            <label className="lexkit-checkbox-label">
              <input
                type="checkbox"
                checked={tableConfig.includeHeaders || false}
                onChange={(e) =>
                  setTableConfig((prev) => ({ ...prev, includeHeaders: e.target.checked }))
                }
                className="lexkit-checkbox"
              />
              Include headers
            </label>
          </div>
          <div className="lexkit-dialog-actions">
            <button
              type="button"
              onClick={() => setShowTableDialog(false)}
              className="lexkit-button-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                commands.insertTable(tableConfig);
                setShowTableDialog(false);
              }}
              className="lexkit-button-primary"
            >
              Insert Table
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

// Error Boundary
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Editor Content Component
function EditorContent({
  className,
  isDark,
  toggleTheme,
  onReady,
}: {
  className?: string;
  isDark: boolean;
  toggleTheme: () => void;
  onReady?: (methods: DefaultTemplateRef) => void;
}) {
  const { commands, hasExtension, activeStates, lexical: editor } = useEditor();
  const commandsRef = useRef<EditorCommands>(commands);
  const readyRef = useRef(false);

  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  const methods = useMemo<DefaultTemplateRef>(
    () => ({
      injectMarkdown: (content: string) => {
        setTimeout(() => {
          if (editor) {
            editor.update(() => {
              commandsRef.current.importFromMarkdown(content, {
                immediate: true,
                preventFocus: true,
              });
            });
          }
        }, 100); // Small delay to ensure editor is ready
      },
      injectHTML: (content: string) => {
        setTimeout(() => {
          if (editor) {
            editor.update(() => {
              commandsRef.current.importFromHTML(content, { preventFocus: true });
            });
          }
        }, 100);
      },
      getMarkdown: () => commandsRef.current.exportToMarkdown(),
      getHTML: () => commandsRef.current.exportToHTML(),
    }),
    [editor],
  );

  useEffect(() => {
    if (!editor || !commands) return;

    const paletteCommands = commandsToCommandPaletteItems(commands);
    paletteCommands.forEach((cmd) => commands.registerCommand(cmd));

    const originalShowCommand = commands.showCommandPalette;

    const unregisterShortcuts = registerKeyboardShortcuts(commands, document.body);

    if (!readyRef.current) {
      readyRef.current = true;
      onReady?.(methods);
    }

    return () => {
      unregisterShortcuts();
      (commands as any).showCommandPalette = originalShowCommand;
    };
  }, [editor, commands, onReady, methods]);

  return (
    <>
      <div className="lexkit-editor-header">
        <Toolbar commands={commands} hasExtension={hasExtension} activeStates={activeStates} />
      </div>
      <div className="lexkit-editor">
        <div className="flex flex-1 flex-col" style={{ display: 'flex' }}>
          <RichTextPlugin
            contentEditable={<ContentEditable className="lexkit-content-editable" />}
            placeholder={<div className="lexkit-placeholder">Écrivez...</div>}
            ErrorBoundary={ErrorBoundary}
          />
          <FloatingToolbarRenderer />
        </div>
      </div>
    </>
  );
}

// Main DefaultTemplate Component
interface DefaultTemplateProps {
  className?: string;
  onReady?: (methods: DefaultTemplateRef) => void;
}

export const Editor = forwardRef<DefaultTemplateRef, DefaultTemplateProps>(
  ({ className, onReady }, ref) => {
    const [editorTheme, setEditorTheme] = useState<'light' | 'dark'>('light');

    const isDark = editorTheme === 'dark';

    useEffect(() => {
      imageExtension.configure({
        uploadHandler: async (file: File) => URL.createObjectURL(file),
        defaultAlignment: 'center',
        resizable: true,
        pasteListener: { insert: true, replace: true },
        debug: false,
      });
    }, []);

    const toggleTheme = () => setEditorTheme(isDark ? 'light' : 'dark');

    // Expose methods via ref
    const [methods, setMethods] = useState<DefaultTemplateRef | null>(null);
    React.useImperativeHandle(ref, () => methods as DefaultTemplateRef, [methods]);

    const handleReady = (m: DefaultTemplateRef) => {
      setMethods(m);
      onReady?.(m);
    };

    return (
      <div className={`lexkit-editor-wrapper ${className || ''}`} data-editor-theme={editorTheme}>
        <Provider extensions={extensions} config={{ theme: defaultTheme }}>
          <EditorContent
            className={className}
            isDark={isDark}
            toggleTheme={toggleTheme}
            onReady={handleReady}
          />
        </Provider>
      </div>
    );
  },
);

Editor.displayName = 'Editor';
