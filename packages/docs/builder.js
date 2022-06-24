import remarkGfm from "remark-gfm";
import remarkTwemoji from "remark-twemoji";
import remarkCodeSandbox from "remark-codesandbox";
import remarkHint from "remark-hint";
import remarkHtml from "remark-html";

import remarkHighlight from "./plugins/remark-highlight.js";
 
import { defaultSchema } from "hast-util-sanitize";
import merge from "deepmerge";
 
// Import the highlighter
import prism from "prismjs";
import "prismjs/components/prism-pug.js";
import "prismjs/components/prism-javascript.js";
import "prismjs/components/prism-sass.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-bash.js";

import webpack from "webpack";

// Preserve className attributes when sanitizing the HTML
// This is necessary for syntax highlighting
const schema = merge(defaultSchema, {
    attributes: {
        span: ["className"],
        code: ["className"]
    }
});

/**
 * @see hints: https://github.com/sergioramos/remark-hint
 */

const config = {
    entry: process.cwd() + "/src/index.js",
    output: {
        path: process.cwd() + "/dist",
        filename: "index.js",
        publicPath: "./"
    },
    cache: false,
    mode: "development",
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.pupper$/,
                use: ["@pupperjs/webpack-loader"]
            },
            {
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
            },
            {
                test: /\.md$/,
                use: [
                    {
                        loader: "html-loader",
                    },
                    {
                        loader: "remark-loader",
                        options: {
                            remarkOptions: {
                                plugins: [
                                    remarkTwemoji,
                                    remarkGfm,
                                    remarkCodeSandbox,
                                    remarkHint,
                                    [remarkHtml, {
                                        sanitize: false
                                    }],
                                    [remarkHighlight, {
                                        highlight: (code, language) => {
                                            const grammar = prism.languages[language];

                                            if (grammar) {
                                                code = prism.highlight(code, grammar);
                                            }

                                            return code;
                                        }
                                    }]
                                ],
                            },
                        },
                    },
                ],
            },
        ]
    }
};

const compiler = webpack(config);

compiler.watch({
    aggregateTimeout: 300,
    poll: undefined
}, (err, stats) => {
    if (err) {
        console.error(err.stack || err);

        if (err.details) {
            console.error(err.details);
        }

        return;
    }

    console.log(stats.toString({
        colors: true
    }));
});