const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
    entry: __dirname + "/src/index.js",
    output: {
        path: __dirname + "/dist",
        filename: "index.js",
        publicPath: "./"
    },
    cache: false,
    watch: true,
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
        ]
    }
}