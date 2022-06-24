import { visit } from "unist-util-visit";
import escape from "escape-html";

export default function highlighter(options) {
    return function(ast) {
        visit(ast, "code", function(node) {
            if (!node.lang) {
                return;
            }

            const highlight = function(code) {
                const html = code == null ? escape(node.value) : code;

                node.type = "html";
                node.value = [
                    "<pre>",
                        "<code class=\"language-" + node.lang + "\">",
                            html,
                        "</code>",
                    "</pre>",
                ].join("\n");
            };

            const result = options.highlight(node.value, node.lang);

            return highlight(result);
        });
    };
};