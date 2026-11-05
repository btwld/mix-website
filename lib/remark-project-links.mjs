// Rewrite root-relative links, images, and JSX href/src authored for another
// mount (btwld/remix's /remix GitHub Pages site) onto this site's routes.
// Runs before Fumadocs' image plugin so images resolve from public/.
import { rewriteUpstreamUrl } from './projects.mjs';

export function remarkProjectLinks({ project }) {
  return tree => {
    const visit = node => {
      if ((node.type === 'link' || node.type === 'image' || node.type === 'definition') && typeof node.url === 'string') {
        node.url = rewriteUpstreamUrl(project, node.url);
      }
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        for (const attribute of node.attributes ?? []) {
          if (attribute.type === 'mdxJsxAttribute' && (attribute.name === 'href' || attribute.name === 'src') && typeof attribute.value === 'string') {
            attribute.value = rewriteUpstreamUrl(project, attribute.value);
          }
        }
      }
      for (const child of node.children ?? []) visit(child);
    };
    visit(tree);
  };
}
