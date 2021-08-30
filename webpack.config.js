module.exports = {
    entry: __dirname + "/test/browser.js",
    output: {
        path: __dirname + "/test/out",
        filename: "index.js"
    },
    watch: true,
    module: {
        rules: [
            {
                test: /\.pupper$/,
                use: [__dirname + "/modules/webpack"]
            }
        ]
    },
    mode: "development"
}