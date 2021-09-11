module.exports = {
    entry: __dirname + "/test/browser.js",
    output: {
        path: __dirname + "/test/out",
        filename: "index.js",
        publicPath: "./"
    },
    watch: true,
    mode: "development",
    module: {
        rules: [
            {
                test: /\.pupper$/,
                use: [__dirname + "/modules/webpack"]
            },
            {
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
            },
        ]
    },
    mode: "development"
}