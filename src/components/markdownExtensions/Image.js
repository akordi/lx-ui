import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core';

const ImageOptions = {
  inline: false,
  allowBase64: false,
  HTMLAttributes: {},
};

const inputRegex = /(?:^|\s)(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/;

const Image = Node.create({
  name: 'image',

  addOptions() {
    return ImageOptions;
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? 'inline' : 'block';
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element) => {
          const src = element.getAttribute('src');
          if (!this.options.allowBase64 && src.startsWith('data:')) {
            return false;
          }
          return {};
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addStorage() {
    return {
      markdown: {
        // Default tiptap-markdown serializer is meant for inline images and does not close the block,
        // so a following block (e.g. heading) would be written on the same line as the image
        serialize(state, node) {
          const alt = state.esc(node.attrs.alt || '');
          const src = node.attrs.src.replace(/[()]/g, '\\$&');
          const title = node.attrs.title ? ` "${node.attrs.title.replace(/"/g, '\\"')}"` : '';

          state.write(`![${alt}](${src}${title})`);

          if (!this.options.inline) {
            state.closeBlock(node);
          }
        },
      },
    };
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
    };
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: (match) => {
          const [, , alt, src, title] = match;

          return { src, alt, title };
        },
      }),
    ];
  },
});

export { Image };

export default Image;
